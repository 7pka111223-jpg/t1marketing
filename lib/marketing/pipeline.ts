// Position of a content item in the editorial pipeline. No imports, so this stays
// trivially testable from node:test.
export const CONTENT_PIPELINE = [
  "IDEA",
  "RESEARCHED",
  "BRIEF_REVIEW",
  "BRIEF_APPROVED",
  "COPY_REVIEW",
  "COPY_APPROVED",
  "CREATIVE_REVIEW",
  "CREATIVE_APPROVED",
  "READY_TO_SCHEDULE",
  "SCHEDULED",
  "PUBLISHED",
  "ANALYZED",
  "ARCHIVED",
] as const;

export type PipelineStatus = (typeof CONTENT_PIPELINE)[number];

// How far the item has moved through the pipeline, 0–100. Unknown statuses are 0 so a
// bad value shows an empty bar rather than a misleading one.
export function contentProgress(status: string): number {
  const index = CONTENT_PIPELINE.indexOf(status as PipelineStatus);
  if (index < 0) return 0;
  return Math.round((index / (CONTENT_PIPELINE.length - 1)) * 100);
}
