// Pure parsers for platform insight payloads. No imports: they only reshape JSON into
// raw metric keys, and normalizePlatformMetrics validates/clamps the values afterwards.
// Order matters where two platform metrics map to one marketing metric (first wins).

const INSTAGRAM_METRIC_MAP: Record<string, string> = {
  plays: "views",
  impressions: "views",
  reach: "reach",
  likes: "likes",
  comments: "comments",
  shares: "shares",
  saved: "saves",
  profile_visits: "profile_visits",
  follows: "follows",
  link_clicks: "link_clicks",
};

const TIKTOK_METRIC_MAP: Record<string, string> = {
  view_count: "views",
  like_count: "likes",
  comment_count: "comments",
  share_count: "shares",
};

function readInstagramValue(entry: unknown): number | null {
  const values = (entry as { values?: unknown })?.values;
  if (Array.isArray(values) && values.length > 0) {
    const value = (values[0] as { value?: unknown })?.value;
    if (value !== undefined && value !== null) return Number(value);
  }
  // Aggregate metrics (e.g. total_interactions) report total_value instead of values.
  const total = (entry as { total_value?: { value?: unknown } })?.total_value;
  if (total && total.value !== undefined && total.value !== null) return Number(total.value);
  return null;
}

export function parseInstagramInsights(payload: unknown): Record<string, number> {
  const entries = (payload as { data?: unknown })?.data;
  if (!Array.isArray(entries)) return {};

  const byName = new Map<string, number>();
  for (const entry of entries) {
    const name = (entry as { name?: unknown })?.name;
    if (typeof name !== "string") continue;
    const value = readInstagramValue(entry);
    if (value === null) continue;
    byName.set(name, value);
  }

  const raw: Record<string, number> = {};
  for (const [name, target] of Object.entries(INSTAGRAM_METRIC_MAP)) {
    if (raw[target] !== undefined) continue;
    const value = byName.get(name);
    if (value !== undefined) raw[target] = value;
  }
  return raw;
}

export function parseTikTokInsights(payload: unknown): Record<string, number> {
  const error = (payload as { error?: { code?: unknown } })?.error;
  if (error && typeof error.code === "string" && error.code !== "ok") return {};

  const videos = (payload as { data?: { videos?: unknown } })?.data?.videos;
  const video = Array.isArray(videos) ? videos[0] : null;
  if (!video || typeof video !== "object") return {};

  const raw: Record<string, number> = {};
  for (const [name, target] of Object.entries(TIKTOK_METRIC_MAP)) {
    const value = (video as Record<string, unknown>)[name];
    if (value !== undefined && value !== null) raw[target] = Number(value);
  }
  return raw;
}
