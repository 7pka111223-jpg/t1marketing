import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import {
  approvalItems,
  assetLibrary,
  audienceSignals,
  audienceStats,
  calendarItems,
  campaigns,
  contentColumns,
  convertDrivers,
  funnel,
  metrics,
  opportunities,
  readyPosts,
  renderQueue,
  weekPlan,
} from "@/lib/mock-data";
import { isCampaignStatus } from "@/lib/marketing/campaign-status";
import { isRenderStatus } from "@/lib/marketing/render-status";
import { slugify } from "@/lib/marketing/slug";
import type {
  AnalyticsData,
  ApprovalItem,
  AssetItem,
  AudienceSignalRow,
  BoardCard,
  CalendarEntry,
  Campaign,
  CampaignDetail,
  ContentColumn,
  ConvertDriver,
  DashboardMetric,
  FunnelStep,
  Opportunity,
  ReadyPost,
  RenderItem,
  WeekPlanItem,
} from "@/lib/types";

const DEMO_LANGUAGE_NOTE =
  "AR-EG hooks currently lead Mixed/English variants on shares and booking intent in this demo dataset. Production recommendations require your connected platform + conversion data.";
const LIVE_LANGUAGE_NOTE =
  "Language performance needs connected platform metrics. Once marketing.metrics is populated, AR-EG vs English recommendations appear here.";

function demoMode() {
  return isDemoMode();
}

export async function getOpportunities(): Promise<Opportunity[]> {
  if (demoMode()) return opportunities;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("marketing")
      .from("opportunities")
      .select("id,title,total_score,reason,recommended_format,language_mode,asset_count,scores")
      .in("status", ["NEW", "SAVED", "APPROVED"])
      .order("total_score", { ascending: false })
      .limit(30);
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      score: Number(row.total_score ?? 0),
      reason: row.reason ?? "No research summary yet.",
      format: formatLabel(row.recommended_format),
      language: languageLabel(row.language_mode),
      assets: row.asset_count ?? 0,
      scores: normalizeScores(row.scores),
    }));
  } catch (error) {
    console.error("[marketing:getOpportunities]", error);
    return [];
  }
}

export async function getApprovalQueue(): Promise<ApprovalItem[]> {
  if (demoMode()) return approvalItems;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("marketing")
      .from("content_items")
      .select("id,title,content_type,status,objective,language_mode,brief,approved_hook,approved_script,approved_caption,approved_cta")
      .in("status", ["BRIEF_REVIEW", "COPY_REVIEW", "CREATIVE_REVIEW", "READY_TO_SCHEDULE"])
      .order("updated_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row: any) => {
      const brief = (row.brief ?? {}) as Record<string, unknown>;
      return {
        id: row.id,
        title: row.title,
        type: formatLabel(row.content_type),
        stage: stageFromStatus(row.status),
        hook: row.approved_hook || String(brief.hook ?? "Hook awaiting review"),
        script: row.approved_script || String(brief.script ?? "Script awaiting review"),
        caption: row.approved_caption || String(brief.caption ?? "Caption awaiting review"),
        cta: row.approved_cta || String(brief.cta ?? "CTA awaiting review"),
        objective: objectiveLabel(row.objective),
        audience: String(brief.audience ?? "TripleOne audience"),
        assets: Number(brief.asset_count ?? 0),
        language: languageLabel(row.language_mode),
        hypothesis: String(brief.performance_hypothesis ?? "Pending performance hypothesis."),
      };
    });
  } catch (error) {
    console.error("[marketing:getApprovalQueue]", error);
    return [];
  }
}

export async function getContentBoard(): Promise<ContentColumn[]> {
  if (demoMode()) return demoBoard();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("marketing")
      .from("content_items")
      .select("id,title,status,content_type")
      .neq("status", "ARCHIVED")
      .order("updated_at", { ascending: false })
      .limit(80);
    if (error) throw error;

    const groups: Record<string, BoardCard[]> = { Ideas: [], "Copy ready": [], Creative: [], Approved: [] };
    for (const row of data ?? []) {
      const card: BoardCard = { id: row.id, title: row.title, type: formatLabel(row.content_type), status: row.status };
      if (["IDEA", "RESEARCHED", "BRIEF_REVIEW"].includes(row.status)) groups.Ideas.push(card);
      else if (["BRIEF_APPROVED", "COPY_REVIEW"].includes(row.status)) groups["Copy ready"].push(card);
      else if (["COPY_APPROVED", "CREATIVE_REVIEW"].includes(row.status)) groups.Creative.push(card);
      else groups.Approved.push(card);
    }
    return Object.entries(groups).map(([title, items]) => ({ title, items }));
  } catch (error) {
    console.error("[marketing:getContentBoard]", error);
    return emptyBoard();
  }
}

export async function getDashboardMetrics(): Promise<DashboardMetric[]> {
  if (demoMode()) return metrics;
  try {
    const supabase = await createClient();
    const [metricsRes, conversionsRes] = await Promise.all([
      supabase.schema("marketing").from("metrics_latest").select("reach,profile_visits,views,likes,saves,shares"),
      supabase.schema("marketing").from("conversions").select("event_type"),
    ]);
    if (metricsRes.error) throw metricsRes.error;
    if (conversionsRes.error) throw conversionsRes.error;
    const rows = metricsRes.data ?? [];
    const conversions = conversionsRes.data ?? [];
    const sum = (key: string) => rows.reduce((total, row) => total + Number((row as Record<string, unknown>)[key] ?? 0), 0);
    const count = (type: string) => conversions.filter((c) => c.event_type === type).length;
    return [
      { label: "Reach", value: formatNumber(sum("reach")) },
      { label: "Profile visits", value: formatNumber(sum("profile_visits")) },
      { label: "App signups", value: formatNumber(count("SIGNUP")) },
      { label: "Memberships", value: formatNumber(count("MEMBERSHIP")) },
    ];
  } catch (error) {
    console.error("[marketing:getDashboardMetrics]", error);
    return emptyMetrics();
  }
}

export async function getWeekPlan(): Promise<WeekPlanItem[]> {
  if (demoMode()) return weekPlan;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("marketing")
      .from("content_items")
      .select("id,title,content_type,status,scheduled_at")
      .neq("status", "ARCHIVED")
      .order("scheduled_at", { ascending: true, nullsFirst: false })
      .limit(6);
    if (error) throw error;
    return (data ?? []).slice(0, 4).map((row: any) => ({
      day: row.scheduled_at ? dayLabel(new Date(row.scheduled_at)) : "TBD",
      title: row.title,
      type: formatLabel(row.content_type),
      state: planState(row.status),
    }));
  } catch (error) {
    console.error("[marketing:getWeekPlan]", error);
    return [];
  }
}

export async function getCalendarItems(weekOffset = 0): Promise<Record<number, CalendarEntry[]>> {
  if (demoMode()) return calendarItems;
  const empty = emptyCalendar();
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("marketing")
      .from("content_items")
      .select("id,title,content_type,scheduled_at")
      .not("scheduled_at", "is", null)
      .order("scheduled_at", { ascending: true });
    if (error) throw error;
    const { start, end } = weekRange(weekOffset);
    const grouped = emptyCalendar();
    for (const row of data ?? []) {
      const at = new Date(row.scheduled_at as string);
      if (Number.isNaN(at.getTime()) || at < start || at >= end) continue;
      const weekday = ((at.getDay() + 6) % 7) + 1;
      grouped[weekday].push({ id: row.id, title: row.title, type: formatLabel(row.content_type), time: formatTime(at) });
    }
    return grouped;
  } catch (error) {
    console.error("[marketing:getCalendarItems]", error);
    return empty;
  }
}

export async function getAudience(): Promise<{ stats: DashboardMetric[]; rows: AudienceSignalRow[] }> {
  if (demoMode()) return { stats: audienceStats, rows: audienceSignals };
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("marketing")
      .from("signals")
      .select("id,title,kind,summary,momentum,payload,observed_at")
      .order("observed_at", { ascending: false })
      .limit(30);
    if (error) throw error;
    const rows: AudienceSignalRow[] = (data ?? []).map((row: any) => {
      const payload = (row.payload ?? {}) as Record<string, unknown>;
      return {
        signal: row.title,
        category: titleCase(String(row.kind ?? "Signal")),
        count: String(payload.count ?? 0),
        momentum: momentumLabel(row.momentum),
        recommendation: String(payload.recommendation ?? row.summary ?? "Review for content fit"),
      };
    });
    const stats: DashboardMetric[] = [
      { label: "New leads", value: formatNumber(rows.length) },
      { label: "DM questions", value: formatNumber(rows.filter((r) => /question/i.test(r.category)).length) },
      { label: "Repeated topics", value: formatNumber(rows.filter((r) => Number(r.count) >= 5).length) },
    ];
    return { stats, rows };
  } catch (error) {
    console.error("[marketing:getAudience]", error);
    return { stats: emptyMetrics().slice(1), rows: [] };
  }
}

export async function getAnalytics(): Promise<AnalyticsData> {
  if (demoMode()) {
    return { metrics, funnel, converts: convertDrivers, languageNote: DEMO_LANGUAGE_NOTE };
  }
  try {
    const supabase = await createClient();
    const [metricsRes, conversionsRes, contentRes] = await Promise.all([
      supabase.schema("marketing").from("metrics_latest").select("reach,profile_visits,likes,comments,shares,saves"),
      supabase.schema("marketing").from("conversions").select("event_type,content_item_id"),
      supabase.schema("marketing").from("content_items").select("id,title"),
    ]);
    if (metricsRes.error) throw metricsRes.error;
    if (conversionsRes.error) throw conversionsRes.error;
    if (contentRes.error) throw contentRes.error;

    const rows = metricsRes.data ?? [];
    const conversions = conversionsRes.data ?? [];
    const titles = new Map((contentRes.data ?? []).map((c) => [c.id, c.title]));
    const sum = (key: string) => rows.reduce((total, row) => total + Number((row as Record<string, unknown>)[key] ?? 0), 0);
    const count = (type: string) => conversions.filter((c) => c.event_type === type).length;

    const steps = [
      { label: "Reach", value: sum("reach") },
      { label: "Engaged", value: sum("likes") + sum("comments") + sum("shares") + sum("saves") },
      { label: "Profile", value: sum("profile_visits") },
      { label: "App visit", value: count("APP_VISIT") },
      { label: "Signup", value: count("SIGNUP") },
      { label: "Booking", value: count("BOOKING") },
      { label: "Member", value: count("MEMBERSHIP") },
    ];

    return {
      metrics: [
        { label: "Reach", value: formatNumber(sum("reach")) },
        { label: "Profile visits", value: formatNumber(sum("profile_visits")) },
        { label: "App signups", value: formatNumber(count("SIGNUP")) },
        { label: "Memberships", value: formatNumber(count("MEMBERSHIP")) },
      ],
      funnel: buildFunnel(steps),
      converts: buildConverts(conversions, titles),
      languageNote: LIVE_LANGUAGE_NOTE,
    };
  } catch (error) {
    console.error("[marketing:getAnalytics]", error);
    return { metrics: emptyMetrics(), funnel: [], converts: [], languageNote: LIVE_LANGUAGE_NOTE };
  }
}

export async function getAssetLibrary(): Promise<AssetItem[]> {
  if (demoMode()) return assetLibrary;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("marketing")
      .from("assets")
      .select("id,storage_path,asset_type,tags,metadata,marketing_cleared")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []).map((row: any) => {
      const metadata = (row.metadata ?? {}) as Record<string, unknown>;
      const fallbackName = String(row.storage_path ?? "").split("/").pop() ?? "Untitled asset";
      const tags = (row.tags ?? []) as string[];
      return {
        id: row.id,
        name: String(metadata.original_name ?? fallbackName),
        kind: assetKind(row.asset_type),
        meta: `${tags.slice(0, 2).join(", ") || titleCase(row.asset_type)} · ${row.marketing_cleared ? "marketing cleared" : "clearance pending"}`,
        badge: "Indexed",
      };
    });
  } catch (error) {
    console.error("[marketing:getAssetLibrary]", error);
    return [];
  }
}

export async function getRenderQueue(): Promise<RenderItem[]> {
  if (demoMode()) return renderQueue;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("marketing")
      .from("creatives")
      .select("id,creative_type,version,render_status,content_items(title)")
      .order("created_at", { ascending: false })
      .limit(20);
    if (error) throw error;
    return (data ?? []).map((row: any) => {
      const title = row.content_items?.title ?? "Untitled creative";
      const version = row.version ?? 1;
      return {
        id: row.id,
        title: String(title),
        detail: `${String(row.creative_type)} · v${version}`,
        status: isRenderStatus(row.render_status) ? row.render_status : "PENDING",
      };
    });
  } catch (error) {
    console.error("[marketing:getRenderQueue]", error);
    return [];
  }
}

export async function getReadyToPost(): Promise<ReadyPost[]> {
  if (demoMode()) return readyPosts;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("marketing")
      .from("publications")
      .select("id,platform,status,scheduled_at,caption,content_items(title,approved_hook,approved_script,approved_caption,approved_cta)")
      .eq("status", "APPROVED")
      .order("scheduled_at", { ascending: true })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map((row: any) => {
      const item = (row.content_items ?? {}) as Record<string, unknown>;
      const at = row.scheduled_at ? new Date(row.scheduled_at) : null;
      const scheduled = at && !Number.isNaN(at.getTime()) ? `${dayLabel(at)} ${formatTime(at)}` : "Not scheduled";
      return {
        id: row.id,
        title: String(item.title ?? "Untitled post"),
        platform: platformLabel(row.platform),
        scheduled,
        hook: String(item.approved_hook ?? ""),
        script: String(item.approved_script ?? ""),
        caption: String(row.caption || item.approved_caption || ""),
        cta: String(item.approved_cta ?? ""),
      };
    });
  } catch (error) {
    console.error("[marketing:getReadyToPost]", error);
    return [];
  }
}

export async function getCampaigns(): Promise<Campaign[]> {
  if (demoMode()) return campaigns;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .schema("marketing")
      .from("campaigns")
      .select("id,name,objective,status,starts_at,ends_at,content_items(count)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (error) throw error;
    return (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name,
      objective: objectiveLabel(row.objective),
      status: isCampaignStatus(row.status) ? row.status : "DRAFT",
      window: campaignWindow(row.starts_at, row.ends_at),
      contentCount: Number(row.content_items?.[0]?.count ?? 0),
    }));
  } catch (error) {
    console.error("[marketing:getCampaigns]", error);
    return [];
  }
}

export async function getCampaignDetail(id: string): Promise<CampaignDetail | null> {
  if (demoMode()) return demoCampaignDetail(id);
  try {
    const supabase = await createClient();
    const [campaignRes, summaryRes, contentRes] = await Promise.all([
      supabase.schema("marketing").from("campaigns").select("id,name,slug,objective,status,starts_at,ends_at").eq("id", id).maybeSingle(),
      supabase.schema("marketing").from("attribution_campaign_summary").select("reach,engagement,app_visits,signups,bookings,memberships").eq("id", id).maybeSingle(),
      supabase.schema("marketing").from("content_items").select("id,title,content_type,status").eq("campaign_id", id).order("updated_at", { ascending: false }).limit(50),
    ]);
    if (campaignRes.error) throw campaignRes.error;
    if (!campaignRes.data) return null;
    // The summary view depends on migrations 002/004; a missing view degrades to no attribution
    // instead of hiding the campaign and its linked content.
    if (summaryRes.error) console.error("[marketing:getCampaignDetail:summary]", summaryRes.error);
    if (contentRes.error) console.error("[marketing:getCampaignDetail:content]", contentRes.error);

    const campaign = campaignRes.data;
    const summary = (summaryRes.data ?? {}) as Record<string, unknown>;
    const total = (key: string) => Number(summary[key] ?? 0);

    return {
      id: campaign.id,
      name: campaign.name,
      slug: campaign.slug ?? "",
      objective: objectiveLabel(campaign.objective),
      status: isCampaignStatus(campaign.status) ? campaign.status : "DRAFT",
      window: campaignWindow(campaign.starts_at, campaign.ends_at),
      metrics: [
        { label: "Reach", value: formatNumber(total("reach")) },
        { label: "Engagement", value: formatNumber(total("engagement")) },
        { label: "Signups", value: formatNumber(total("signups")) },
        { label: "Memberships", value: formatNumber(total("memberships")) },
      ],
      conversions: weighted([
        { label: "App visits", value: total("app_visits") },
        { label: "Signups", value: total("signups") },
        { label: "Bookings", value: total("bookings") },
        { label: "Memberships", value: total("memberships") },
      ]),
      content: (contentRes.data ?? []).map((row: any) => ({ id: row.id, title: row.title, type: formatLabel(row.content_type), status: String(row.status) })),
    };
  } catch (error) {
    console.error("[marketing:getCampaignDetail]", error);
    return null;
  }
}

const DEMO_CONTENT_STATUS: Record<string, string> = {
  Ideas: "IDEA",
  "Copy ready": "COPY_REVIEW",
  Creative: "CREATIVE_REVIEW",
  Approved: "READY_TO_SCHEDULE",
};

function demoCampaignDetail(id: string): CampaignDetail | null {
  const campaign = campaigns.find((entry) => entry.id === id);
  if (!campaign) return null;
  return {
    id: campaign.id,
    name: campaign.name,
    slug: slugify(campaign.name),
    objective: campaign.objective,
    status: campaign.status,
    window: campaign.window,
    metrics,
    conversions: weighted([
      { label: "App visits", value: 486 },
      { label: "Signups", value: 112 },
      { label: "Bookings", value: 38 },
      { label: "Memberships", value: 17 },
    ]),
    content: contentColumns.flatMap((column) =>
      column.items.map((title, index) => ({
        id: `${column.title}-${index}`,
        title,
        type: index % 2 === 0 ? "Reel" : "Carousel",
        status: DEMO_CONTENT_STATUS[column.title] ?? "IDEA",
      })),
    ),
  };
}

function weighted(rows: { label: string; value: number }[]): ConvertDriver[] {
  const max = Math.max(1, ...rows.map((row) => row.value));
  return rows.map((row) => ({ ...row, weight: Math.round((row.value / max) * 100) }));
}

function demoBoard(): ContentColumn[] {
  return contentColumns.map((col) => ({
    title: col.title,
    items: col.items.map((title, index) => ({
      id: `${col.title}-${index + 1}`,
      title,
      type: index % 2 === 0 ? "Reel" : "Carousel",
      status: DEMO_CONTENT_STATUS[col.title] ?? "IDEA",
    })),
  }));
}

function emptyBoard(): ContentColumn[] {
  return ["Ideas", "Copy ready", "Creative", "Approved"].map((title) => ({ title, items: [] }));
}

function emptyCalendar(): Record<number, CalendarEntry[]> {
  return { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 7: [] };
}

function emptyMetrics(): DashboardMetric[] {
  return [
    { label: "Reach", value: "0" },
    { label: "Profile visits", value: "0" },
    { label: "App signups", value: "0" },
    { label: "Memberships", value: "0" },
  ];
}

function buildFunnel(steps: { label: string; value: number }[]): FunnelStep[] {
  const max = Math.max(1, ...steps.map((step) => step.value));
  return steps.map((step) => ({
    label: step.label,
    value: formatNumber(step.value),
    h: Math.round(60 + (step.value / max) * 170),
  }));
}

function buildConverts(
  conversions: { event_type: string; content_item_id: string | null }[],
  titles: Map<string, string>,
): ConvertDriver[] {
  const counts = new Map<string, number>();
  for (const conversion of conversions) {
    if (!["SIGNUP", "BOOKING", "MEMBERSHIP"].includes(conversion.event_type)) continue;
    const key = conversion.content_item_id ? titles.get(conversion.content_item_id) ?? "Direct / untracked" : "Direct / untracked";
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4);
  const max = Math.max(1, ...rows.map(([, value]) => value));
  return rows.map(([label, value]) => ({ label, value, weight: Math.round((value / max) * 100) }));
}

function weekRange(offset: number) {
  const now = new Date();
  const weekday = (now.getDay() + 6) % 7;
  const start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - weekday + offset * 7);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(start.getDate() + 7);
  return { start, end };
}

function planState(status: string): WeekPlanItem["state"] {
  if (["BRIEF_APPROVED", "COPY_APPROVED", "CREATIVE_APPROVED", "READY_TO_SCHEDULE", "SCHEDULED", "PUBLISHED", "ANALYZED"].includes(status)) return "approved";
  if (status.endsWith("REVIEW")) return "review";
  if (["IDEA", "RESEARCHED"].includes(status)) return "idea";
  return "draft";
}

function normalizeScores(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object") return {};
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([k, v]) => [titleCase(k), Number(v ?? 0)]));
}

function titleCase(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatLabel(value: string | null): "Reel" | "Carousel" | "Story" {
  if (value === "CAROUSEL") return "Carousel";
  if (value === "STORY") return "Story";
  return "Reel";
}

function platformLabel(value: string | null) {
  if (value === "INSTAGRAM") return "Instagram";
  if (value === "TIKTOK") return "TikTok";
  return "Unknown platform";
}

function languageLabel(value: string | null): "Mixed" | "AR-EG" | "EN" {
  if (value === "AR_EG") return "AR-EG";
  if (value === "EN") return "EN";
  return "Mixed";
}

function objectiveLabel(value: string | null) {
  if (value === "MEMBERSHIPS") return "Memberships";
  if (value === "BOTH") return "Brand awareness + memberships";
  return "Brand awareness";
}

function stageFromStatus(value: string): ApprovalItem["stage"] {
  if (value === "BRIEF_REVIEW") return "Brief";
  if (value === "COPY_REVIEW") return "Copy";
  if (value === "CREATIVE_REVIEW") return "Creative";
  return "Publish";
}

function assetKind(value: string | null) {
  if (value === "VIDEO") return "VID";
  if (value === "PHOTO") return "IMG";
  if (value === "AUDIO") return "AUD";
  return "GFX";
}

function momentumLabel(value: number | null) {
  if (value === null || value === undefined) return "Stable";
  if (value > 2) return "Rising";
  if (value < -2) return "Falling";
  return "Stable";
}

const compactFormatter = new Intl.NumberFormat("en", { notation: "compact", maximumFractionDigits: 1 });
function formatNumber(value: number) {
  return compactFormatter.format(value);
}

const timeFormatter = new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false, timeZone: "Africa/Cairo" });
function formatTime(date: Date) {
  return timeFormatter.format(date);
}

const dayFormatter = new Intl.DateTimeFormat("en", { weekday: "short", timeZone: "Africa/Cairo" });
function dayLabel(date: Date) {
  return dayFormatter.format(date).toUpperCase();
}

const dayMonthFormatter = new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", timeZone: "Africa/Cairo" });

function formatDay(value: unknown): string | null {
  if (!value) return null;
  const date = new Date(String(value));
  return Number.isNaN(date.getTime()) ? null : dayMonthFormatter.format(date);
}

function campaignWindow(startsAt: unknown, endsAt: unknown): string {
  const start = formatDay(startsAt);
  const end = formatDay(endsAt);
  if (!start && !end) return "No dates set";
  if (start && end) return `${start} → ${end}`;
  return start ? `From ${start}` : `Until ${end}`;
}
