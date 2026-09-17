import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { syncPublicationMetrics } from "@/lib/marketing/sync-metrics";

export async function POST() {
  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, status: "captured", captured: 0, live: 0, insights: false });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Metrics sync needs SUPABASE_SERVICE_ROLE_KEY." }, { status: 503 });
  }

  try {
    const result = await syncPublicationMetrics();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("[api:metrics:sync]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Metrics sync failed." }, { status: 500 });
  }
}
