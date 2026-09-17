export const CAMPAIGN_STATUSES = ["DRAFT", "ACTIVE", "PAUSED", "COMPLETED", "ARCHIVED"] as const;

export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

// Campaign lifecycle: launch from draft, pause/resume while live, complete, then archive.
// ARCHIVED is terminal so a finished campaign can never be reopened by accident.
const TRANSITIONS: Record<CampaignStatus, CampaignStatus[]> = {
  DRAFT: ["ACTIVE", "ARCHIVED"],
  ACTIVE: ["PAUSED", "COMPLETED", "ARCHIVED"],
  PAUSED: ["ACTIVE", "COMPLETED", "ARCHIVED"],
  COMPLETED: ["ARCHIVED"],
  ARCHIVED: [],
};

export function isCampaignStatus(value: unknown): value is CampaignStatus {
  return typeof value === "string" && (CAMPAIGN_STATUSES as readonly string[]).includes(value);
}

export function nextCampaignStatuses(from: string): CampaignStatus[] {
  return isCampaignStatus(from) ? TRANSITIONS[from] : [];
}

export function canTransitionCampaign(from: string, to: string): boolean {
  return isCampaignStatus(from) && isCampaignStatus(to) && TRANSITIONS[from].includes(to);
}
