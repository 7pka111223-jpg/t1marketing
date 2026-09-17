import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { canDeliver } from "@/lib/publishing/publication-flow";
import { publishApprovedPublication } from "@/lib/publishing/index";

const DECISION_ROLES = ["OWNER", "MARKETING_ADMIN", "PUBLISHER"];

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const decision = String(body.decision ?? "");
  if (!["APPROVE", "CANCEL"].includes(decision)) {
    return NextResponse.json({ error: "Unknown decision" }, { status: 400 });
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
