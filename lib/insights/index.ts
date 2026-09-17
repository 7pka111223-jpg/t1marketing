import { normalizePlatformMetrics, type PlatformMetrics } from "../marketing/metrics-normalize";
import { parseInstagramInsights, parseTikTokInsights } from "./parse";

const GRAPH_VERSION = "v21.0";
const INSTAGRAM_METRICS = ["reach", "likes", "comments", "shares", "saved", "plays"];

// Returns null when the platform is not configured or the post has no data, so the
// caller can snapshot zero-filled rows instead of failing the whole sync.
export async function fetchPublicationInsights(
  platform: string | null,
  externalPostId: string | null,
): Promise<PlatformMetrics | null> {
  if (!externalPostId) return null;
  if (platform === "INSTAGRAM") return fetchInstagramInsights(externalPostId);
  if (platform === "TIKTOK") return fetchTikTokInsights(externalPostId);
  return null;
}

async function fetchInstagramInsights(mediaId: string): Promise<PlatformMetrics | null> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  if (!token) return null;
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION}/${mediaId}/insights`);
  url.searchParams.set("metric", INSTAGRAM_METRICS.join(","));
  url.searchParams.set("access_token", token);
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Instagram insights failed (${response.status}): ${await response.text()}`);
  return normalizePlatformMetrics(parseInstagramInsights(await response.json()));
}

async function fetchTikTokInsights(videoId: string): Promise<PlatformMetrics | null> {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) return null;
  const response = await fetch(
    "https://open.tiktokapis.com/v2/video/query/?fields=id,view_count,like_count,comment_count,share_count",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ filters: { video_ids: [videoId] } }),
    },
  );
  if (!response.ok) throw new Error(`TikTok insights failed (${response.status}): ${await response.text()}`);
  return normalizePlatformMetrics(parseTikTokInsights(await response.json()));
}
