import { createAdminClient } from "@/lib/supabase/admin";
import type { PublishRequest, PublishResult } from "./types";

// Publishing stays behind the human approval gate: only a marketing.publications
// row in APPROVED state can be published. Adapters throw until credentials exist.
export async function publish(request: PublishRequest): Promise<PublishResult> {
  if (request.platform === "instagram") return publishInstagram(request);
  if (request.platform === "tiktok") return publishTikTok(request);
  throw new Error(`Unsupported platform: ${request.platform}`);
}

export async function publishApprovedPublication(publicationId: string): Promise<PublishResult> {
  const supabase = createAdminClient();
  const { data: publication, error } = await supabase
    .from("publications")
    .select("id,platform,status,caption,content_item_id")
    .eq("id", publicationId)
    .single();
  if (error || !publication) throw new Error(error?.message ?? "Publication not found");
  if (publication.status !== "APPROVED") {
    throw new Error(`Publication is ${publication.status}; only APPROVED publications can be published.`);
  }

  const { data: creative } = await supabase
    .from("creatives")
    .select("output_path")
    .eq("content_item_id", publication.content_item_id)
    .eq("is_approved", true)
    .order("version", { ascending: false })
    .limit(1)
    .maybeSingle();
  const mediaUrl = creative?.output_path ?? "";
  if (!mediaUrl) throw new Error("No approved creative output path found for this publication.");

  await supabase.from("publications").update({ status: "PUBLISHING" }).eq("id", publicationId);
  try {
    const result = await publish({
      publicationId,
      platform: publication.platform === "INSTAGRAM" ? "instagram" : "tiktok",
      mediaUrl,
      caption: publication.caption ?? "",
    });
    await supabase
      .from("publications")
      .update({
        status: result.status === "published" ? "PUBLISHED" : "SCHEDULED",
        external_post_id: result.externalId,
        published_at: result.status === "published" ? new Date().toISOString() : null,
      })
      .eq("id", publicationId);
    return result;
  } catch (publishError) {
    await supabase
      .from("publications")
      .update({ status: "FAILED", error_message: publishError instanceof Error ? publishError.message : "Publish failed" })
      .eq("id", publicationId);
    throw publishError;
  }
}

async function publishInstagram(request: PublishRequest): Promise<PublishResult> {
  const token = process.env.INSTAGRAM_ACCESS_TOKEN;
  const accountId = process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID;
  if (!token || !accountId) {
    throw new Error("Instagram publishing is not configured. Set INSTAGRAM_ACCESS_TOKEN and INSTAGRAM_BUSINESS_ACCOUNT_ID after Meta app approval.");
  }
  const base = "https://graph.facebook.com/v21.0";
  const containerRes = await fetch(`${base}/${accountId}/media`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ image_url: request.mediaUrl, caption: request.caption, access_token: token }),
  });
  const container = await containerRes.json();
  if (!containerRes.ok || !container.id) throw new Error(`Instagram media container failed: ${JSON.stringify(container)}`);

  const publishRes = await fetch(`${base}/${accountId}/media_publish`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ creation_id: container.id, access_token: token }),
  });
  const published = await publishRes.json();
  if (!publishRes.ok || !published.id) throw new Error(`Instagram publish failed: ${JSON.stringify(published)}`);

  return { externalId: String(published.id), status: "published" };
}

async function publishTikTok(request: PublishRequest): Promise<PublishResult> {
  const token = process.env.TIKTOK_ACCESS_TOKEN;
  if (!token) {
    throw new Error("TikTok publishing is not configured. Set TIKTOK_ACCESS_TOKEN after TikTok Content Posting approval.");
  }
  const initRes = await fetch("https://open.tiktokapis.com/v2/post/publish/video/init/", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      post_info: { title: request.caption, privacy_level: "SELF_ONLY" },
      source_info: { source: "PULL_FROM_URL", video_url: request.mediaUrl },
    }),
  });
  const init = await initRes.json();
  const publishId = init?.data?.publish_id;
  if (!initRes.ok || !publishId) throw new Error(`TikTok publish init failed: ${JSON.stringify(init)}`);

  return { externalId: String(publishId), status: "processing" };
}
