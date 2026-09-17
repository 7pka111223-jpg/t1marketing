import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { normalizeAccountMetrics } from "@/lib/marketing/account-metrics";

// Manual account-level entry. This is the only way to capture reach and profile visits: they are
// private to the account and never appear on a public page.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const normalized = normalizeAccountMetrics(body);
  if (!normalized.ok) return NextResponse.json({ error: normalized.error }, { status: 400 });

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, platform: normalized.value.platform });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  const { error } = await supabase
    .schema("marketing")
    .from("account_metrics")
    .insert({ ...normalized.value, source: "MANUAL" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, platform: normalized.value.platform });
}
