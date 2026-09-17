import type {
  ApprovalItem,
  AssetItem,
  AudienceSignalRow,
  Campaign,
  ConvertDriver,
  DashboardMetric,
  Opportunity,
  RenderItem,
  WeekPlanItem,
} from "@/lib/types";

export const metrics: DashboardMetric[] = [
  { label: "Reach", value: "48.2K", delta: "+18% vs last month" },
  { label: "Profile visits", value: "2,741", delta: "+11% vs last month" },
  { label: "App signups", value: "112", delta: "+9% vs last month" },
  { label: "Memberships", value: "17", delta: "+4 this month" },
];

export const approvalItems: ApprovalItem[] = [
  {
    id: "apr-001",
    title: "Muscle-Up Transition",
    type: "Reel",
    stage: "Creative",
    hook: "Your pull isn't the problem.",
    script: "Beat 1 · Bar stays close to the chest.\nBeat 2 · Show the rep that fails at the transition.\nBeat 3 · Drill the turnover at the bar.\nBeat 4 · One clean rep, no cuts.",
    caption: "Most failed muscle-ups lose the rep at the transition. Keep the bar close, stay aggressive, and drill the turnover. احفظ الفيديو وجربه في التمرين الجاي.",
    cta: "Book a free assessment",
    objective: "Brand awareness",
    audience: "Intermediate calisthenics athletes",
    assets: 4,
    language: "Mixed AR-EG / EN",
    hypothesis: "Strong coaching hook + real member footage should drive saves and shares.",
  },
  {
    id: "apr-002",
    title: "5 Pull-Up Mistakes",
    type: "Carousel",
    stage: "Copy",
    hook: "5 mistakes killing your pull-up.",
    script: "Slide 1 · Title.\nSlides 2–6 · One mistake each, with the fix underneath.\nSlide 7 · Save this for your next pull session.\nSlide 8 · How to start.",
    caption: "Fix the basics before chasing more reps. Save this checklist for your next pull session.",
    cta: "Save this carousel",
    objective: "Authority",
    audience: "Beginner to intermediate athletes",
    assets: 7,
    language: "EN + AR-EG cues",
    hypothesis: "Checklist format should generate high saves and profile visits.",
  },
  {
    id: "apr-003",
    title: "First Strict Muscle-Up",
    type: "Reel",
    stage: "Brief",
    hook: "Weeks of work. One clean rep.",
    script: "Beat 1 · Training cut from the early weeks.\nBeat 2 · Chalk up.\nBeat 3 · The rep lands clean.\nBeat 4 · Coach reaction.",
    caption: "Member progress beats promises.",
    cta: "Start your first month",
    objective: "Social proof",
    audience: "Prospective members",
    assets: 3,
    language: "Mixed",
    hypothesis: "Authentic member progress should increase DMs and assessment intent.",
  },
];

export const opportunities: Opportunity[] = [
  { id: "opp-1", title: "First Muscle-Up Series", score: 84, reason: "Strong audience match, rising tutorial interest, and 12 relevant TripleOne clips already available.", format: "Reel", language: "Mixed", assets: 12, scores: { Trend: 87, Local: 78, Audience: 96, Intent: 62, Assets: 94, Brand: 98 } },
  { id: "opp-2", title: "Beginner Handstand Progression", score: 81, reason: "High save potential and a clear multi-part progression format for recurring content.", format: "Carousel", language: "AR-EG", assets: 14, scores: { Trend: 82, Local: 74, Audience: 93, Intent: 61, Assets: 96, Brand: 91 } },
  { id: "opp-3", title: "Calisthenics vs Gym", score: 77, reason: "Conversation-friendly topic with good TikTok fit. Needs a non-combative angle.", format: "Reel", language: "Mixed", assets: 9, scores: { Trend: 79, Local: 83, Audience: 84, Intent: 54, Assets: 78, Brand: 86 } },
  { id: "opp-4", title: "Your First Pull-Up", score: 89, reason: "Core beginner problem, strong membership relevance, and excellent existing footage coverage.", format: "Reel", language: "AR-EG", assets: 21, scores: { Trend: 86, Local: 92, Audience: 99, Intent: 79, Assets: 98, Brand: 97 } },
];

export const contentColumns = [
  { title: "Ideas", items: ["First pull-up", "Handstand wall drill", "Grip strength myth"] },
  { title: "Copy ready", items: ["5 Pull-Up Mistakes", "Why your dip stalls"] },
  { title: "Creative", items: ["Muscle-Up Transition", "Member PR"] },
  { title: "Approved", items: ["Max Hang Challenge"] },
];

export const weekPlan: WeekPlanItem[] = [
  { day: "MON", title: "Muscle-Up Transition", type: "Reel", state: "approved" },
  { day: "WED", title: "5 Pull-Up Mistakes", type: "Carousel", state: "review" },
  { day: "FRI", title: "First Strict Muscle-Up", type: "Reel", state: "draft" },
  { day: "SUN", title: "Max Hang Challenge", type: "Challenge", state: "idea" },
];

export const calendarItems: Record<number, { id: string; title: string; type: string; time: string }[]> = {
  1: [{ id: "cal-1", title: "Muscle-Up Transition", type: "Reel", time: "19:00" }],
  3: [{ id: "cal-3", title: "5 Pull-Up Mistakes", type: "Carousel", time: "18:00" }],
  5: [{ id: "cal-5", title: "First Strict Muscle-Up", type: "Reel", time: "20:00" }],
  7: [{ id: "cal-7", title: "Max Hang Challenge", type: "Story + Reel", time: "18:30" }],
};

export const funnel = [
  { label: "Reach", value: "48.2K", h: 230 },
  { label: "Engaged", value: "4,318", h: 200 },
  { label: "Profile", value: "2,741", h: 175 },
  { label: "App visit", value: "486", h: 150 },
  { label: "Signup", value: "112", h: 125 },
  { label: "Booking", value: "38", h: 100 },
  { label: "Member", value: "17", h: 78 },
];

export const audienceStats: DashboardMetric[] = [
  { label: "New leads", value: "31" },
  { label: "DM questions", value: "14" },
  { label: "Repeated topics", value: "6" },
];

export const audienceSignals: AudienceSignalRow[] = [
  { signal: "Is calisthenics good for beginners?", category: "Beginner", count: "14", momentum: "↑ 36%", recommendation: "Create FAQ Reel" },
  { signal: "How much is membership?", category: "Pricing", count: "11", momentum: "↑ 8%", recommendation: "Improve profile CTA" },
  { signal: "Do I need to be strong first?", category: "Objection", count: "9", momentum: "↑ 19%", recommendation: "Beginner story series" },
  { signal: "Where are you in New Cairo?", category: "Location", count: "7", momentum: "Stable", recommendation: "Safe DM template" },
];

export const convertDrivers: ConvertDriver[] = [
  { label: "Member progress", value: 7, weight: 100 },
  { label: "Education", value: 5, weight: 71 },
  { label: "Challenges", value: 3, weight: 43 },
  { label: "Offers", value: 2, weight: 29 },
];

export const assetLibrary: AssetItem[] = [
  { id: "asset-1", name: "Coach correcting muscle-up transition", kind: "VID", meta: "Vertical · 92% relevance · marketing cleared", badge: "Unused" },
  { id: "asset-2", name: "Member first strict muscle-up", kind: "IMG", meta: "Vertical · 88% relevance · marketing cleared", badge: "Unused" },
  { id: "asset-3", name: "Tuesday pull session", kind: "VID", meta: "Vertical · 84% relevance · marketing cleared", badge: "Unused" },
  { id: "asset-4", name: "Handstand wall drills", kind: "IMG", meta: "Vertical · 80% relevance · marketing cleared", badge: "Unused" },
];

export const campaigns: Campaign[] = [
  { id: "cmp-1", name: "New Cairo Beginners", objective: "Brand awareness + memberships", status: "ACTIVE", window: "12 Sep → 30 Nov", contentCount: 6 },
  { id: "cmp-2", name: "Muscle-Up Season", objective: "Memberships", status: "DRAFT", window: "No dates set", contentCount: 2 },
  { id: "cmp-3", name: "Ramadan Reset", objective: "Brand awareness", status: "COMPLETED", window: "1 Mar → 10 Apr", contentCount: 9 },
];

export const renderQueue: RenderItem[] = [
  { id: "render-1", title: "Muscle-Up Transition", detail: "REEL · v1 · cut + subtitles + branded titles", status: "RENDERING" },
  { id: "render-2", title: "5 Pull-Up Mistakes", detail: "CAROUSEL · v1 · 8-slide carousel", status: "PENDING" },
  { id: "render-3", title: "Max Hang Challenge", detail: "REEL · v2 · member PR cut", status: "READY" },
];
