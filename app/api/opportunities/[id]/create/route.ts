import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, triggerConfig } from "@/lib/config";
import { generateBrief, type GeneratedBrief } from "@/lib/ai/generate";

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, contentId: `demo-${id}` });
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

  const { data: opportunity, error: readError } = await supabase
    .schema("marketing")
    .from("opportunities")
    .select("id,title,recommended_format,language_mode")
    .eq("id", id)
    .single();
  if (readError || !opportunity) return NextResponse.json({ error: readError?.message ?? "Opportunity not found" }, { status: 404 });

  const format = opportunity.recommended_format ?? "REEL";
  const languageMode = opportunity.language_mode ?? "MIXED";
  const objective = "BRAND_AWARENESS";
  const brief = await generateBrief({ title: opportunity.title, format, languageMode, objective }).catch(() => null);

  const { data: content, error: createError } = await supabase
    .schema("marketing")
    .from("content_items")
    .insert({
      opportunity_id: opportunity.id,
      title: opportunity.title,
      content_type: format,
      pillar: "EDUCATION",
      objective,
      language_mode: languageMode,
      status: "BRIEF_REVIEW",
      created_by: userId,
      brief: brief
        ? {
            generated_from_opportunity: true,
            hook: brief.hook,
            caption: brief.caption,
            audience: brief.audience,
            performance_hypothesis: brief.performanceHypothesis,
            asset_count: 0,
          }
        : { generated_from_opportunity: true },
    })
    .select("id")
    .single();
  if (createError) return NextResponse.json({ error: createError.message }, { status: 400 });

  if (brief) await recordBriefVersions(supabase, content.id, brief, userId);

  if (triggerConfig.configured) {
    try {
      const triggerSdk = await import("@trigger.dev/sdk");
      await triggerSdk.tasks.trigger("content-workflow", { contentId: content.id });
    } catch (error) {
      console.error("[opportunities:triggerWorkflow]", error);
    }
  }

  await supabase.schema("marketing").from("opportunities").update({ status: "CONVERTED" }).eq("id", id);
  return NextResponse.json({ ok: true, contentId: content.id, briefGenerated: Boolean(brief) });
}

async function recordBriefVersions(supabase: SupabaseServerClient, contentItemId: string, brief: GeneratedBrief, userId: string) {
  const rows = [
    { component: "HOOK", content: brief.hook },
    { component: "CAPTION", content: brief.caption },
  ].filter((row) => row.content);
  if (rows.length === 0) return;
  const { error } = await supabase.schema("marketing").from("content_versions").insert(
    rows.map((row) => ({
      content_item_id: contentItemId,
      component: row.component,
      version: 1,
      content: row.content,
      is_approved: false,
      created_by: userId,
    })),
  );
  if (error) console.error("[opportunities:recordBriefVersions]", error);
}
