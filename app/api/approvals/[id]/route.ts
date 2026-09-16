import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, triggerConfig } from "@/lib/config";
import { advanceStatus } from "@/lib/marketing/status";
import type { ContentStatus } from "@/lib/types";

const APPROVER_ROLES = ["OWNER", "MARKETING_ADMIN", "EDITOR", "PUBLISHER"];
const DECISIONS = ["APPROVE", "EDIT", "RELOOP", "REJECT"];
const APPROVAL_STATUS: Record<string, string> = { APPROVE: "APPROVED", EDIT: "EDITED", RELOOP: "RELOOPED", REJECT: "REJECTED" };

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const decision = String(body.decision ?? "");
  if (!DECISIONS.includes(decision)) {
    return NextResponse.json({ error: "Unknown decision" }, { status: 400 });
  }
  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, id, ...body });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member, error: memberError } = await supabase
    .schema("marketing")
    .from("members")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 400 });
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });
  if (!APPROVER_ROLES.includes(member.role)) {
    return NextResponse.json({ error: `Role ${member.role} cannot approve content.` }, { status: 403 });
  }

  const { data: item, error: readError } = await supabase
    .schema("marketing")
    .from("content_items")
    .select("id,status,brief,approved_hook,approved_caption")
    .eq("id", id)
    .single();
  if (readError || !item) return NextResponse.json({ error: readError?.message ?? "Content not found" }, { status: 404 });

  const { error: logError } = await supabase.schema("marketing").from("approvals").insert({
    entity_type: "content_item",
    entity_id: id,
    stage: item.status,
    status: APPROVAL_STATUS[decision],
    decision,
    reloop_target: decision === "RELOOP" ? body.reloopTarget ?? null : null,
    feedback: body.feedback ?? null,
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
  });
  if (logError) return NextResponse.json({ error: logError.message }, { status: 400 });

  const nextStatus = decision === "APPROVE" ? advanceStatus(item.status as ContentStatus) : decision === "REJECT" ? "ARCHIVED" : item.status;

  const brief = (item.brief ?? {}) as Record<string, unknown>;
  const hook = item.approved_hook ?? (brief.hook ? String(brief.hook) : null);
  const caption = item.approved_caption ?? (brief.caption ? String(brief.caption) : null);

  const update: Record<string, unknown> = { status: nextStatus };
  if (decision === "APPROVE") {
    if (hook) update.approved_hook = hook;
    if (caption) update.approved_caption = caption;
  }

  const { error: updateError } = await supabase.schema("marketing").from("content_items").update(update).eq("id", id);
  if (updateError) return NextResponse.json({ error: updateError.message }, { status: 400 });

  if (decision === "APPROVE") {
    await recordVersion(supabase, id, "HOOK", hook, userId);
    await recordVersion(supabase, id, "CAPTION", caption, userId);
  }

  await completeWorkflowToken(supabase, id, brief, decision, body);

  return NextResponse.json({ ok: true, status: nextStatus });
}

async function completeWorkflowToken(
  supabase: SupabaseServerClient,
  contentId: string,
  brief: Record<string, unknown>,
  decision: string,
  body: Record<string, unknown>,
) {
  if (!triggerConfig.configured) return;
  const tokenId = typeof brief.approval_token === "string" ? brief.approval_token : null;
  if (!tokenId) return;
  try {
    const { wait } = await import("@trigger.dev/sdk");
    await wait.completeToken(tokenId, {
      approved: decision === "APPROVE",
      feedback: body.feedback ?? null,
      reloopTarget: body.reloopTarget ?? null,
    });
    const nextBrief = { ...brief };
    delete nextBrief.approval_token;
    await supabase.schema("marketing").from("content_items").update({ brief: nextBrief }).eq("id", contentId);
  } catch (error) {
    console.error("[approvals:completeWorkflowToken]", error);
  }
}

async function recordVersion(supabase: SupabaseServerClient, contentItemId: string, component: string, content: string | null, userId: string) {
  if (!content) return;
  const { data: latest } = await supabase
    .schema("marketing")
    .from("content_versions")
    .select("version")
    .eq("content_item_id", contentItemId)
    .eq("component", component)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const version = (latest?.version ?? 0) + 1;
  const { error } = await supabase.schema("marketing").from("content_versions").insert({
    content_item_id: contentItemId,
    component,
    version,
    content,
    is_approved: true,
    created_by: userId,
  });
  if (error) console.error("[approvals:recordVersion]", error);
}
