const METRIC_KEYS = ["views", "reach", "likes", "comments", "shares", "saves", "profile_visits", "link_clicks", "follows"] as const;

export type PlatformMetrics = Partial<Record<(typeof METRIC_KEYS)[number], number>>;

export function normalizePlatformMetrics(raw: Record<string, unknown>): PlatformMetrics {
  const result: PlatformMetrics = {};
  for (const key of METRIC_KEYS) {
    if (!(key in raw)) {
      result[key] = 0;
      continue;
    }
    const value = Number(raw[key]);
    result[key] = Number.isFinite(value) && value >= 0 ? value : 0;
  }
  return result;
}

// One row per publication for marketing.metrics. Publications without live insights
// (platform not configured, or no data yet) still produce a zero-filled snapshot so
// the funnel stays live and each sync is an auditable point in time.
export function buildMetricsRows(
  publications: { id: string }[],
  insights: Record<string, PlatformMetrics | null | undefined> = {},
) {
  return publications.map((publication) => ({
    publication_id: publication.id,
    ...normalizePlatformMetrics((insights[publication.id] ?? {}) as Record<string, unknown>),
  }));
}
