import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { canSchedule } from "@/lib/publishing/publication-guard";

const PLATFORMS = ["INSTAGRAM", "TIKTOK"];

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const platform = String(body.platform ?? "").toUpperCase();
  const scheduledAt = String(body.scheduledAt ?? "");
  if (!PLATFORMS.includes(platform)) {
    return NextResponse.json({ error: "Unknown platform" }, { status: 400 });
  }
  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, id, platform, scheduledAt });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  const { data: item, error: readError } = await supabase
    .schema("marketing")
    .from("content_items")
    .select("id,status,approved_caption")
    .eq("id", id)
    .single();
  if (readError || !item) return NextResponse.json({ error: readError?.message ?? "Content not found" }, { status: 404 });

  const guard = canSchedule(item.status, scheduledAt);
  if (!guard.ok) return NextResponse.json({ error: guard.reason }, { status: 400 });

  const { data: publication, error: pubError } = await supabase
    .schema("marketing")
    .from("publications")
    .insert({
      content_item_id: id,
      platform,
      status: "SCHEDULED",
      caption: item.approved_caption ?? null,
      scheduled_at: new Date(scheduledAt).toISOString(),
    })
    .select("id")
    .single();
  if (pubError) return NextResponse.json({ error: pubError.message }, { status: 400 });

  const { error: updateError } = await supabase
    .schema("marketing")
    .from("content_items")
    .update({ status: "SCHEDULED", scheduled_at: new Date(scheduledAt).toISOString() })
    .eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  await supabase.schema("marketing").from("approvals").insert({
    entity_type: "publication",
    entity_id: publication.id,
    stage: "SCHEDULE",
    status: "PENDING",
  });

  return NextResponse.json({ ok: true, publicationId: publication.id, status: "SCHEDULED" });
}
