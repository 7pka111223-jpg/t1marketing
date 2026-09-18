import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { ACCOUNT_METRIC_FIELDS, normalizeAccountMetrics } from "@/lib/marketing/account-metrics";

// Manual account-level entry. This is the only way to capture reach and profile visits: they are
// private to the account and never appear on a public page.
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const normalized = normalizeAccountMetrics(body);
  if (!normalized.ok) return NextResponse.json({ error: normalized.error }, { status: 400 });

  const { platform, metrics } = normalized.value;

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, platform, updated: Object.keys(metrics) });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  // A blank field means "unchanged", so carry the previous value forward from the newest snapshot.
  // Without this a partial entry would zero the numbers it did not mention.
  const { data: latest, error: latestError } = await supabase
    .schema("marketing")
    .from("account_metrics_latest")
    .select(ACCOUNT_METRIC_FIELDS.join(","))
    .eq("platform", platform)
    .maybeSingle();
  if (latestError) console.error("[api:metrics:account:latest]", latestError);
  // The select string is built from ACCOUNT_METRIC_FIELDS so the two can never drift apart.
  const previousRow = (latest ?? null) as unknown as Record<string, unknown> | null;

  const row: Record<string, number | null> = {};
  for (const field of ACCOUNT_METRIC_FIELDS) {
    const provided = metrics[field];
    if (provided !== undefined) {
      row[field] = provided;
      continue;
    }
    const previous = previousRow ? previousRow[field] : null;
    row[field] = previous === null || previous === undefined ? null : Number(previous);
  }

  const { error } = await supabase
    .schema("marketing")
    .from("account_metrics")
    .insert({ platform, ...row, source: "MANUAL" });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true, platform, updated: Object.keys(metrics) });
}
