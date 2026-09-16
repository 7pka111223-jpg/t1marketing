export function StatusBadge({ value }: { value: string }) {
  const v = value.toLowerCase();
  const cls = v.includes("approved") || v.includes("published") ? "badge-success" : v.includes("review") || v.includes("ready") ? "badge-warning" : v.includes("research") ? "badge-info" : "";
  return <span className={`badge ${cls}`}>{value.replaceAll("_", " ")}</span>;
}
