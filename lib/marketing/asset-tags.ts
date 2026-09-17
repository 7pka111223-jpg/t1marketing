export function deriveAssetTags(originalName: string | null | undefined, storagePath?: string): string[] {
  const source = originalName && originalName.trim() ? originalName : (storagePath ?? "");
  const name = source
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/, "")
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
  return name;
}
