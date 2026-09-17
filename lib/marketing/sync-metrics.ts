import { createAdminClient } from "@/lib/supabase/admin";
import { insightsConfig } from "@/lib/config";
import { fetchPublicationInsights } from "@/lib/insights";
import { buildMetricsRows, type PlatformMetrics } from "./metrics-normalize";

export type MetricsSyncResult = {
  status: "captured" | "no-published-posts";
  captured: number;
  live: number;
  insights: boolean;
};

// Snapshots marketing.metrics for every published post. Shared by the scheduled
// Trigger.dev task and the manual dashboard sync so both paths behave identically.
export async function syncPublicationMetrics(): Promise<MetricsSyncResult> {
  const supabase = createAdminClient();
  const { data: publications, error } = await supabase
    .from("publications")
    .select("id,platform,external_post_id")
    .eq("status", "PUBLISHED")
    .not("external_post_id", "is", null)
    .order("published_at", { ascending: false })
    .limit(50);
  if (error) throw error;

  const rows = publications ?? [];
  if (rows.length === 0) {
    return { status: "no-published-posts", captured: 0, live: 0, insights: insightsConfig.configured };
  }

  const insights: Record<string, PlatformMetrics | null> = {};
  let live = 0;
  if (insightsConfig.configured) {
    for (const publication of rows) {
      try {
        const metrics = await fetchPublicationInsights(publication.platform, publication.external_post_id);
        insights[publication.id] = metrics;
        if (metrics) live += 1;
      } catch (insightsError) {
        console.error("[metrics:insights]", publication.id, insightsError);
        insights[publication.id] = null;
      }
    }
  }

  const metricRows = buildMetricsRows(rows, insights);
  const { error: insertError } = await supabase.from("metrics").insert(metricRows);
  if (insertError) throw insertError;

  return { status: "captured", captured: metricRows.length, live, insights: insightsConfig.configured };
}
