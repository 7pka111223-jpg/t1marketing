import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { slugify } from "@/lib/marketing/slug";

const OBJECTIVES = ["BRAND_AWARENESS", "MEMBERSHIPS", "BOTH"];

function pick(value: unknown, allowed: string[], fallback: string) {
  const candidate = String(value ?? "");
  return allowed.includes(candidate) ? candidate : fallback;
}

// Returns null for "no date", undefined for an unusable date so the caller can reject it.
function isoOrNull(value: unknown): string | null | undefined {
  if (value === undefined || value === null || value === "") return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

// Slugs are the utm_campaign value, so they must be unique: suffix a counter when taken.
async function uniqueCampaignSlug(supabase: Awaited<ReturnType<typeof createClient>>, base: string): Promise<string> {
  const fallback = base || `campaign-${Date.now()}`;
  const { data } = await supabase.schema("marketing").from("campaigns").select("slug").ilike("slug", `${fallback}%`);
  const taken = new Set((data ?? []).map((row: { slug: string }) => row.slug));
  if (!taken.has(fallback)) return fallback;
  for (let n = 2; n < 50; n += 1) {
    const candidate = `${fallback}-${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${fallback}-${Date.now()}`;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const name = String(body.name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Campaign name is required." }, { status: 400 });

  const objective = pick(body.objective, OBJECTIVES, "BRAND_AWARENESS");
  const startsAt = isoOrNull(body.startsAt);
  const endsAt = isoOrNull(body.endsAt);
  if (startsAt === undefined || endsAt === undefined) {
    return NextResponse.json({ error: "Campaign dates must be valid dates." }, { status: 400 });
  }

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, campaignId: `demo-${Date.now()}` });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  const slug = await uniqueCampaignSlug(supabase, slugify(name));

  const { data: campaign, error } = await supabase
    .schema("marketing")
    .from("campaigns")
    .insert({ name, slug, objective, status: "DRAFT", starts_at: startsAt, ends_at: endsAt, created_by: userId })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, campaignId: campaign.id, slug });
}
