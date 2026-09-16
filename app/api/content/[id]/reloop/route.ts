import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";

const COMPONENTS: Record<string, string> = {
  Hook: "HOOK",
  Script: "SCRIPT",
  Caption: "CAPTION",
  Arabic: "ARABIC",
  CTA: "CTA",
};

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const target = String(body.target ?? "Entire item");
  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, contentId: id, target });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  const { data: item, error: readError } = await supabase.schema("marketing").from("content_items").select("id,status").eq("id", id).single();
  if (readError || !item) return NextResponse.json({ error: readError?.message ?? "Content not found" }, { status: 404 });

  const component = COMPONENTS[target] ?? "CREATIVE_DIRECTION";
  const { data: latest } = await supabase
    .schema("marketing")
    .from("content_versions")
    .select("version")
    .eq("content_item_id", id)
    .eq("component", component)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (latest?.version ?? 0) + 1;

  const { error: versionError } = await supabase.schema("marketing").from("content_versions").insert({
    content_item_id: id,
    component,
    version,
    content: typeof body.note === "string" ? body.note : null,
    structured_content: { reloop_target: target, requested_by: userId, previous_status: item.status },
    is_approved: false,
    created_by: "HUMAN",
  });
  if (versionError) return NextResponse.json({ error: versionError.message }, { status: 400 });

  const reopen = component === "CREATIVE_DIRECTION" ? "CREATIVE_REVIEW" : "COPY_REVIEW";
  const { error: updateError } = await supabase.schema("marketing").from("content_items").update({ status: reopen }).eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  return NextResponse.json({ ok: true, contentId: id, target, component, status: reopen });
}
