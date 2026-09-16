import type { ContentStatus } from "@/lib/types";

export const nextStatus: Partial<Record<ContentStatus, ContentStatus>> = {
  IDEA: "RESEARCHED",
  RESEARCHED: "BRIEF_REVIEW",
  BRIEF_REVIEW: "BRIEF_APPROVED",
  BRIEF_APPROVED: "COPY_REVIEW",
  COPY_REVIEW: "COPY_APPROVED",
  COPY_APPROVED: "CREATIVE_REVIEW",
  CREATIVE_REVIEW: "CREATIVE_APPROVED",
  CREATIVE_APPROVED: "READY_TO_SCHEDULE",
  READY_TO_SCHEDULE: "SCHEDULED",
  SCHEDULED: "PUBLISHED",
  PUBLISHED: "ANALYZED",
};

export function advanceStatus(status: ContentStatus) {
  return nextStatus[status] ?? status;
}
