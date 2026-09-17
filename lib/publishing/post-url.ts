// Import-free so it unit-tests under node:test. Parses the post URL a human pastes after
// posting by hand, so the publication keeps an external id that per-post metrics can use later.
export type ParsedPost = { platform: "INSTAGRAM" | "TIKTOK"; externalId: string };

const INSTAGRAM_PREFIXES = ["p", "reel", "reels", "tv"];
const TIKTOK_PREFIXES = ["video", "photo"];
const INSTAGRAM_CODE = /^[A-Za-z0-9_-]{5,}$/;
const TIKTOK_ID = /^\d{5,}$/;

export function parsePostUrl(url: string): ParsedPost | null {
  const trimmed = url.trim();
  if (!trimmed) return null;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return null;
  }

  const host = parsed.hostname.toLowerCase().replace(/^www\./, "");
  const segments = parsed.pathname.split("/").filter(Boolean);

  if (host === "instagram.com" || host.endsWith(".instagram.com")) {
    const index = segments.findIndex((segment) => INSTAGRAM_PREFIXES.includes(segment.toLowerCase()));
    const code = index >= 0 ? segments[index + 1] : undefined;
    return code && INSTAGRAM_CODE.test(code) ? { platform: "INSTAGRAM", externalId: code } : null;
  }

  if (host === "tiktok.com" || host.endsWith(".tiktok.com")) {
    const index = segments.findIndex((segment) => TIKTOK_PREFIXES.includes(segment.toLowerCase()));
    const id = index >= 0 ? segments[index + 1] : undefined;
    return id && TIKTOK_ID.test(id) ? { platform: "TIKTOK", externalId: id } : null;
  }

  return null;
}
