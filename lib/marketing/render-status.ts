// Render stage of a marketing.creatives row. No imports: testable from node:test.
export const RENDER_STATUSES = ["PENDING", "RENDERING", "READY", "FAILED"] as const;

export type RenderStatus = (typeof RENDER_STATUSES)[number];

export function isRenderStatus(value: unknown): value is RenderStatus {
  return typeof value === "string" && (RENDER_STATUSES as readonly string[]).includes(value);
}

// Stage indicator for the render queue. FAILED is terminal but is never shown as a full
// bar — the UI omits the bar and shows the status badge instead.
export function renderProgress(status: string): number {
  if (status === "RENDERING") return 70;
  if (status === "READY") return 100;
  if (status === "PENDING") return 20;
  return 0;
}
