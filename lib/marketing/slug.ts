// Campaign slugs are what the main app sends as utm_campaign, so they must be stable and
// URL-safe. Unicode letters are preserved (not stripped) so Egyptian Arabic campaign names
// keep meaning instead of collapsing to an empty slug.
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-+$/g, "");
}
