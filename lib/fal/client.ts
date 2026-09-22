// fal queue API. Every fal model is submitted the same way — POST the endpoint id, poll, fetch the
// result — so one thin client covers both the image edit and the image-to-video pass.
//
// The submit response carries status_url and response_url. We store and reuse those verbatim
// instead of rebuilding them from the endpoint id: fal's request paths are keyed on the *app* root
// (`fal-ai/kling-video`), not the full endpoint (`fal-ai/kling-video/v3/standard/image-to-video`),
// and reconstructing that rule by hand is how you end up polling a 404.

const QUEUE_BASE = "https://queue.fal.run";

function apiKey(): string {
  const key = process.env.FAL_KEY ?? process.env.FAL_API_KEY;
  if (!key) throw new Error("fal is not configured. Set FAL_KEY.");
  return key;
}

function headers(): Record<string, string> {
  return { Authorization: `Key ${apiKey()}`, "Content-Type": "application/json" };
}

export type FalSubmission = {
  requestId: string;
  statusUrl: string;
  responseUrl: string;
  cancelUrl: string | null;
};

export type FalStatus = {
  /** IN_QUEUE | IN_PROGRESS | COMPLETED | (anything else fal introduces) */
  status: string;
  queuePosition: number | null;
  error: string | null;
};

export async function submitFal(endpointId: string, input: Record<string, unknown>): Promise<FalSubmission> {
  const response = await fetch(`${QUEUE_BASE}/${endpointId}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(input),
  });
  const detail = await response.json().catch(() => null);
  if (!response.ok || !detail?.request_id) {
    throw new Error(`fal submit failed (${response.status}): ${truncate(detail)}`);
  }

  const requestId = String(detail.request_id);
  return {
    requestId,
    // Fall back to the documented shape only if fal ever stops returning the convenience URLs.
    statusUrl: String(detail.status_url ?? `${QUEUE_BASE}/${endpointId}/requests/${requestId}/status`),
    responseUrl: String(detail.response_url ?? `${QUEUE_BASE}/${endpointId}/requests/${requestId}`),
    cancelUrl: detail.cancel_url ? String(detail.cancel_url) : null,
  };
}

export async function statusFal(statusUrl: string): Promise<FalStatus> {
  const response = await fetch(statusUrl, { headers: { Authorization: `Key ${apiKey()}` } });
  const detail = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`fal status failed (${response.status}): ${truncate(detail)}`);
  }
  return {
    status: String(detail?.status ?? "UNKNOWN"),
    queuePosition: typeof detail?.queue_position === "number" ? detail.queue_position : null,
    error: detail?.error ? truncate(detail.error) : null,
  };
}

export async function resultFal(responseUrl: string): Promise<Record<string, unknown>> {
  const response = await fetch(responseUrl, { headers: { Authorization: `Key ${apiKey()}` } });
  const detail = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`fal result failed (${response.status}): ${truncate(detail)}`);
  }
  return (detail ?? {}) as Record<string, unknown>;
}

// fal returns generated media as public CDN URLs with no auth header, so the bytes are fetched
// plainly and then re-stored in our own private bucket.
export async function downloadFalFile(url: string): Promise<{ bytes: ArrayBuffer; contentType: string }> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`fal file download failed (${response.status})`);
  return {
    bytes: await response.arrayBuffer(),
    contentType: response.headers.get("content-type") ?? "application/octet-stream",
  };
}

/** Pulls `images[0].url` out of an image-model result. */
export function firstImageUrl(result: Record<string, unknown>): string | null {
  const images = result.images;
  if (!Array.isArray(images) || images.length === 0) return null;
  const first = images[0] as Record<string, unknown> | null;
  const url = first?.url;
  return typeof url === "string" && url ? url : null;
}

/** Pulls `video.url` (fal's video models return a single object, not an array). */
export function videoUrl(result: Record<string, unknown>): string | null {
  const video = result.video as Record<string, unknown> | undefined;
  const url = video?.url;
  if (typeof url === "string" && url) return url;
  // A couple of fal video endpoints return `videos: [{url}]` instead.
  const videos = result.videos;
  if (Array.isArray(videos) && videos.length > 0) {
    const candidate = (videos[0] as Record<string, unknown>)?.url;
    if (typeof candidate === "string" && candidate) return candidate;
  }
  return null;
}

function truncate(value: unknown): string {
  return JSON.stringify(value ?? null).slice(0, 300);
}
