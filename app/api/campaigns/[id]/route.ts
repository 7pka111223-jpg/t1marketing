import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { canTransitionCampaign, isCampaignStatus } from "@/lib/marketing/campaign-status";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const status = String(body.status ?? "").toUpperCase();
  if (!isCampaignStatus(status)) {
    return NextResponse.json({ error: "Unknown campaign status." }, { status: 400 });
  }

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, campaignId: id, status });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  const { data: current, error: readError } = await supabase
    .schema("marketing")
    .from("campaigns")
    .select("status")
    .eq("id", id)
    .maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 400 });
  if (!current) return NextResponse.json({ error: "Campaign not found." }, { status: 404 });

  if (!canTransitionCampaign(current.status, status)) {
    return NextResponse.json({ error: `Cannot move a ${current.status} campaign to ${status}.` }, { status: 400 });
  }

  const { error } = await supabase.schema("marketing").from("campaigns").update({ status }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, campaignId: id, status });
}
