const METRIC_KEYS = ["views", "reach", "likes", "comments", "shares", "saves", "profile_visits", "link_clicks", "follows"] as const;

export type PlatformMetrics = Partial<Record<(typeof METRIC_KEYS)[number], number>>;

export function normalizePlatformMetrics(raw: Record<string, unknown>): PlatformMetrics {
  const result: PlatformMetrics = {};
  for (const key of METRIC_KEYS) {
    if (!(key in raw)) continue;
    const value = Number(raw[key]);
    result[key] = Number.isFinite(value) && value >= 0 ? value : 0;
  }
  return result;
}
