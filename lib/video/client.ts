// OpenRouter video generation is asynchronous: submit, poll, then download. Reuses the same gateway
// base URL as the text adapter so the provider stays swappable.

function baseUrl(): string {
  return process.env.AI_BASE_URL ?? "https://openrouter.ai/api/v1";
}

function apiKey(): string {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error("OpenRouter is not configured. Set OPENROUTER_API_KEY.");
  return key;
}

export type FrameImage = { url: string; frameType: "first_frame" | "last_frame" };

export type PolledVideo = {
  jobId: string;
  status: string;
  unsignedUrls: string[];
  costUsd: number | null;
  error: string | null;
};

export async function submitVideo(request: {
  model: string;
  prompt: string;
  duration: number;
  resolution: string;
  aspectRatio: string;
  frameImages?: FrameImage[];
  callbackUrl?: string;
}): Promise<{ jobId: string; status: string }> {
  const body: Record<string, unknown> = {
    model: request.model,
    prompt: request.prompt,
    duration: request.duration,
    resolution: request.resolution,
    aspect_ratio: request.aspectRatio,
  };
  if (request.frameImages?.length) {
    body.frame_images = request.frameImages.map((frame) => ({
      type: "image_url",
      image_url: { url: frame.url },
      frame_type: frame.frameType,
    }));
  }
  if (request.callbackUrl) body.callback_url = request.callbackUrl;

  const response = await fetch(`${baseUrl()}/videos`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey()}`, "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const detail = await response.json().catch(() => null);
  if (!response.ok || !detail?.id) {
    throw new Error(`OpenRouter video submit failed (${response.status}): ${JSON.stringify(detail).slice(0, 300)}`);
  }
  return { jobId: String(detail.id), status: String(detail.status ?? "pending") };
}

export async function pollVideo(jobId: string): Promise<PolledVideo> {
  const response = await fetch(`${baseUrl()}/videos/${encodeURIComponent(jobId)}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  const detail = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`OpenRouter video poll failed (${response.status}): ${JSON.stringify(detail).slice(0, 300)}`);
  }
  return {
    jobId,
    status: String(detail?.status ?? "unknown"),
    unsignedUrls: Array.isArray(detail?.unsigned_urls) ? detail.unsigned_urls.map(String) : [],
    costUsd: typeof detail?.usage?.cost === "number" ? detail.usage.cost : null,
    error: detail?.error ? String(detail.error) : null,
  };
}

export async function downloadVideo(jobId: string, index = 0): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  const response = await fetch(`${baseUrl()}/videos/${encodeURIComponent(jobId)}/content?index=${index}`, {
    headers: { Authorization: `Bearer ${apiKey()}` },
  });
  if (!response.ok) throw new Error(`OpenRouter video download failed (${response.status})`);
  return {
    bytes: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") ?? "video/mp4",
  };
}
