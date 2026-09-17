import type { CampaignStatus } from "@/lib/marketing/campaign-status";

export type ContentStatus =
  | "IDEA"
  | "RESEARCHED"
  | "BRIEF_REVIEW"
  | "BRIEF_APPROVED"
  | "COPY_REVIEW"
  | "COPY_APPROVED"
  | "CREATIVE_REVIEW"
  | "CREATIVE_APPROVED"
  | "READY_TO_SCHEDULE"
  | "SCHEDULED"
  | "PUBLISHED"
  | "ANALYZED";

export type ApprovalDecision = "APPROVE" | "EDIT" | "RELOOP" | "REJECT";

export type Opportunity = {
  id: string;
  title: string;
  score: number;
  reason: string;
  format: "Reel" | "Carousel" | "Story";
  language: "Mixed" | "AR-EG" | "EN";
  assets: number;
  scores: Record<string, number>;
};

export type ApprovalItem = {
  id: string;
  title: string;
  type: "Reel" | "Carousel" | "Story";
  stage: "Brief" | "Copy" | "Creative" | "Publish";
  hook: string;
  script: string;
  caption: string;
  cta: string;
  objective: string;
  audience: string;
  assets: number;
  language: string;
  hypothesis: string;
};

export type DashboardMetric = { label: string; value: string; delta?: string };

export type WeekPlanItem = {
  day: string;
  title: string;
  type: string;
  state: "approved" | "review" | "draft" | "idea";
};

export type CalendarEntry = { id: string; title: string; type: string; time: string };

export type AudienceSignalRow = {
  signal: string;
  category: string;
  count: string;
  momentum: string;
  recommendation: string;
};

export type FunnelStep = { label: string; value: string; h: number };

export type ConvertDriver = { label: string; value: number; weight: number };

export type AnalyticsData = {
  metrics: DashboardMetric[];
  funnel: FunnelStep[];
  converts: ConvertDriver[];
  languageNote: string;
};

export type AssetItem = { id: string; name: string; kind: string; meta: string; badge: string };

export type Campaign = {
  id: string;
  name: string;
  objective: string;
  status: CampaignStatus;
  window: string;
  contentCount: number;
};

export type CampaignOption = { id: string; name: string };

export type CampaignContent = { id: string; title: string; type: string; status: string };

export type CampaignDetail = {
  id: string;
  name: string;
  slug: string;
  objective: string;
  status: CampaignStatus;
  window: string;
  metrics: DashboardMetric[];
  conversions: ConvertDriver[];
  content: CampaignContent[];
};

export type BoardCard = { id: string; title: string; type: string; status: string };

export type RenderItem = { id: string; title: string; detail: string; status: string };

export type ReadyPost = {
  id: string;
  title: string;
  platform: string;
  scheduled: string;
  hook: string;
  script: string;
  caption: string;
  cta: string;
};

export type PostFile = { name: string; url: string };

export type ContentColumn = { title: string; items: BoardCard[] };
