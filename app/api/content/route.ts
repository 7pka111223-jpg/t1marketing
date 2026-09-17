import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { isUuid } from "@/lib/marketing/conversion-ingest";

const CONTENT_TYPES = ["REEL", "CAROUSEL", "STORY", "STATIC"];
const PILLARS = ["EDUCATION", "COMMUNITY", "CULTURE", "CHALLENGE", "CONVERSION"];
const OBJECTIVES = ["BRAND_AWARENESS", "MEMBERSHIPS", "BOTH"];
const LANGUAGE_MODES = ["EN", "AR_EG", "MIXED"];

function pick(value: unknown, allowed: string[], fallback: string) {
  const candidate = String(value ?? "");
  return allowed.includes(candidate) ? candidate : fallback;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const title = String(body.title ?? "").trim();
  if (!title) return NextResponse.json({ error: "Title is required." }, { status: 400 });

  const contentType = pick(body.contentType, CONTENT_TYPES, "REEL");
  const pillar = pick(body.pillar, PILLARS, "EDUCATION");
  const objective = pick(body.objective, OBJECTIVES, "BRAND_AWARENESS");
  const languageMode = pick(body.languageMode, LANGUAGE_MODES, "MIXED");
  const campaign = String(body.campaignId ?? "");
  const campaignId = isUuid(campaign) ? campaign : null;

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, contentId: `demo-${Date.now()}` });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  const { data: content, error } = await supabase
    .schema("marketing")
    .from("content_items")
    .insert({
      title,
      content_type: contentType,
      pillar,
      objective,
      language_mode: languageMode,
      campaign_id: campaignId,
      status: "IDEA",
      created_by: userId,
      brief: { created_from: "dashboard", created_at: new Date().toISOString() },
    })
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, contentId: content.id });
}
