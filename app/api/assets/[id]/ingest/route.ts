import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, triggerConfig } from "@/lib/config";

// Indexing a freshly uploaded asset needs the server-only Trigger.dev SDK, so it runs here
// rather than in the browser. The server also decides whether the runner is configured.
export async function POST(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, triggered: false });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  if (!triggerConfig.configured) {
    return NextResponse.json({ ok: true, triggered: false, reason: "Workflow runner is not configured." });
  }

  try {
    const { tasks } = await import("@trigger.dev/sdk");
    await tasks.trigger("media-ingestion", { assetId: id });
    return NextResponse.json({ ok: true, triggered: true });
  } catch (error) {
    console.error("[api:assets:ingest]", error);
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not start indexing." }, { status: 502 });
  }
}
