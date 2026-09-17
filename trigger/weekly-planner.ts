import { schedules, task } from "@trigger.dev/sdk";
import { aiConfig } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateOpportunities } from "@/lib/ai/generate";
import { deriveAssetTags } from "@/lib/marketing/asset-tags";
import { buildMetricsRows } from "./metrics-sync-row-builder.ts";

export const weeklyPlanner = schedules.task({
  id: "weekly-content-planner",
  cron: { pattern: "0 8 * * 0", timezone: "Africa/Cairo" },
  run: async () => {
    if (!aiConfig.configured) {
      return { status: "skipped", reason: "AI gateway is not configured." };
    }
    const supabase = createAdminClient();
    const { data: signals, error } = await supabase
      .from("signals")
      .select("title,summary,kind,momentum")
      .order("observed_at", { ascending: false })
      .limit(20);
    if (error) throw error;

    const context = (signals ?? [])
      .map((signal) => `${signal.kind}: ${signal.title}${signal.summary ? ` — ${signal.summary}` : ""}`)
      .join("\n");

    const generated = await generateOpportunities(context);
    if (generated.length === 0) return { status: "empty", count: 0 };

    const { data, error: insertError } = await supabase
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
    if (insertError) throw insertError;

    return { status: "created", count: data?.length ?? 0 };
  },
});

export const mediaIngestion = task({
  id: "media-ingestion",
  maxDuration: 900,
  run: async (payload: { assetId: string }) => {
    const supabase = createAdminClient();
    const { data: asset, error } = await supabase
      .from("assets")
      .select("id,storage_path,mime_type,metadata")
      .eq("id", payload.assetId)
      .single();
    if (error || !asset) throw new Error(error?.message ?? "Asset not found");

    const metadata = (asset.metadata ?? {}) as Record<string, unknown>;
    const tags = deriveAssetTags(
      metadata.original_name ? String(metadata.original_name) : null,
      asset.storage_path,
    );

    const { error: updateError } = await supabase
      .from("assets")
      .update({ tags, visual_description: metadata.original_name ? String(metadata.original_name) : asset.storage_path, updated_at: new Date().toISOString() })
      .eq("id", payload.assetId);
    if (updateError) throw updateError;

    return { assetId: payload.assetId, tags };
  },
});

export const metricsSync = task({
  id: "metrics-sync",
  maxDuration: 900,
  run: async () => {
    const supabase = createAdminClient();
    const { data: publications, error } = await supabase
      .from("publications")
      .select("id")
      .eq("status", "PUBLISHED")
      .not("external_post_id", "is", null)
      .order("published_at", { ascending: false })
      .limit(50);
    if (error) throw error;

    const rows = buildMetricsRows(publications ?? []);
    if (rows.length === 0) return { status: "no-published-posts", captured: 0 };

    // Platform insight APIs are not approved yet; rows arrive zero-filled so the
    // funnel stays live and each sync is a real, auditable snapshot.
    const { error: insertError } = await supabase.from("metrics").insert(rows);
    if (insertError) throw insertError;
    return { status: "captured", captured: rows.length };
  },
});
