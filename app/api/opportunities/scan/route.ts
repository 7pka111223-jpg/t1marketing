import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { aiConfig, isDemoMode } from "@/lib/config";
import { generateOpportunities } from "@/lib/ai/generate";

export async function POST() {
  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, created: 0 });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  if (!aiConfig.configured) {
    return NextResponse.json({ error: "AI gateway is not configured. Set OPENROUTER_API_KEY and AI_MODEL to run a live scan." }, { status: 503 });
  }

  const { data: signals } = await supabase
    .schema("marketing")
    .from("signals")
    .select("title,summary,kind,momentum")
    .order("observed_at", { ascending: false })
    .limit(20);
  const context = (signals ?? [])
    .map((signal) => `${signal.kind}: ${signal.title}${signal.summary ? ` — ${signal.summary}` : ""}`)
    .join("\n");

  try {
    const generated = await generateOpportunities(context);
    if (generated.length === 0) {
      return NextResponse.json({ ok: true, created: 0 });
    }
    const { data: inserted, error } = await supabase
      .schema("marketing")
      .from("opportunities")
      .insert(generated.map((item) => ({
        title: item.title,
        status: "NEW",
        recommended_format: item.format,
        language_mode: item.languageMode,
        total_score: item.totalScore,
        scores: item.scores,
        reason: item.reason,
        asset_count: 0,
      })))
      .select("id");
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true, created: inserted?.length ?? 0 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Signal scan failed." }, { status: 502 });
  }
}
