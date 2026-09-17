import { normalizePlatformMetrics } from "../lib/marketing/metrics-normalize.ts";

export function buildMetricsRows(publications: { id: string }[]) {
  return publications.map((publication) => ({
    publication_id: publication.id,
    ...normalizePlatformMetrics({ views: 0, reach: 0, likes: 0, comments: 0, shares: 0, saves: 0, profile_visits: 0, link_clicks: 0, follows: 0 }),
  }));
}
