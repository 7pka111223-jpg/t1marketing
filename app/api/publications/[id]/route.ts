import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { canDeliver, nextPublicationStatus } from "@/lib/publishing/publication-flow";
import { canApprovePublication } from "@/lib/publishing/publication-guard";
import { publishApprovedPublication } from "@/lib/publishing/index";
import { parsePostUrl } from "@/lib/publishing/post-url";

const DECISION_ROLES = ["OWNER", "MARKETING_ADMIN", "PUBLISHER"];
const DECISIONS = ["APPROVE", "MARK_POSTED", "DELIVER", "CANCEL"];

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const decision = String(body.decision ?? "").toUpperCase();
  if (!DECISIONS.includes(decision)) {
    return NextResponse.json({ error: "Unknown decision" }, { status: 400 });
  }

  // Validate the pasted post URL before anything else so a bad link is rejected in demo too.
  const postUrl = String(body.postUrl ?? "").trim();
  let externalPostId: string | null = null;
  if (decision === "MARK_POSTED" && postUrl) {
    const parsed = parsePostUrl(postUrl);
    if (!parsed) {
      return NextResponse.json({ error: "That does not look like an Instagram or TikTok post URL." }, { status: 400 });
    }
    externalPostId = parsed.externalId;
  }

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, id, decision });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });
  if (!DECISION_ROLES.includes(member.role)) {
    return NextResponse.json({ error: `Role ${member.role} cannot decide publications.` }, { status: 403 });
  }

  const { data: publication, error: readError } = await supabase
    .schema("marketing")
    .from("publications")
    .select("id,status")
    .eq("id", id)
    .single();
  if (readError || !publication) return NextResponse.json({ error: readError?.message ?? "Publication not found" }, { status: 404 });

  if (decision === "CANCEL") {
    await supabase.schema("marketing").from("publications").update({ status: "CANCELLED" }).eq("id", id);
    return NextResponse.json({ ok: true, status: "CANCELLED" });
  }

  if (decision === "APPROVE") {
    const guard = canApprovePublication(publication.status);
    if (!guard.ok) return NextResponse.json({ error: guard.reason }, { status: 400 });

    await supabase.schema("marketing").from("approvals").insert({
      entity_type: "publication",
      entity_id: id,
      stage: "PUBLISH",
      status: "APPROVED",
      decision,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
    });

    const approved = nextPublicationStatus(publication.status) ?? "APPROVED";
    const { error } = await supabase.schema("marketing").from("publications").update({ status: approved }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, status: approved });
  }

  if (decision === "MARK_POSTED") {
    if (publication.status !== "APPROVED") {
      return NextResponse.json({ error: `Publication is ${publication.status}; only an approved publication can be marked as posted.` }, { status: 400 });
    }

    await supabase.schema("marketing").from("approvals").insert({
      entity_type: "publication",
      entity_id: id,
      stage: "PUBLISH",
      status: "APPROVED",
      decision,
      feedback: postUrl || null,
      reviewed_by: userId,
      reviewed_at: new Date().toISOString(),
      metadata: { posted_manually: true, external_post_id: externalPostId },
    });

    const { error } = await supabase
      .schema("marketing")
      .from("publications")
      .update({
        status: "PUBLISHED",
        published_at: new Date().toISOString(),
        external_url: postUrl || null,
        external_post_id: externalPostId,
      })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });

    return NextResponse.json({ ok: true, status: "PUBLISHED", externalPostId });
  }

  // DELIVER is the platform-API path. It stays available but is only usable once Instagram
  // or TikTok credentials exist; the manual flow above is the default.
  const guard = canDeliver(publication.status);
  if (!guard.ok) return NextResponse.json({ error: guard.reason }, { status: 400 });

  await supabase.schema("marketing").from("approvals").insert({
    entity_type: "publication",
    entity_id: id,
    stage: "PUBLISH",
    status: "APPROVED",
    decision,
    reviewed_by: userId,
    reviewed_at: new Date().toISOString(),
  });

  try {
    await publishApprovedPublication(id);
    return NextResponse.json({ ok: true, status: "PUBLISHING" });
  } catch (error) {
    // Adapter throws when platform credentials are absent; publication is marked FAILED.
    const message = error instanceof Error ? error.message : "Publish failed";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
