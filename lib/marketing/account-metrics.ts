// Import-free so it unit-tests under node:test. Validates the numbers an operator types in from
// their own Instagram/TikTok Insights screen.
//
// A blank field means "leave this as it was", not "zero". That distinction matters: the operator
// usually updates only some numbers each week, and treating blanks as zero would silently wipe the
// reach that drives the top of the funnel. Only fields with a real value are returned here; the API
// fills the rest from the previous snapshot.
export const METRIC_PLATFORMS = ["INSTAGRAM", "TIKTOK"] as const;

export type MetricPlatform = (typeof METRIC_PLATFORMS)[number];

export const ACCOUNT_METRIC_FIELDS = [
  "reach",
  "profile_visits",
  "followers",
  "views",
  "likes",
  "comments",
  "shares",
  "saves",
] as const;

export type AccountMetricField = (typeof ACCOUNT_METRIC_FIELDS)[number];

export type ProvidedAccountMetrics = Partial<Record<AccountMetricField, number>>;

export type AccountMetricsInput = {
  platform: MetricPlatform;
  metrics: ProvidedAccountMetrics;
};

export type AccountMetricsResult =
  | { ok: true; value: AccountMetricsInput }
  | { ok: false; error: string };

export function isMetricPlatform(value: unknown): value is MetricPlatform {
  return typeof value === "string" && (METRIC_PLATFORMS as readonly string[]).includes(value.toUpperCase());
}

// camelCase input from the form is accepted alongside the snake_case column names.
function readField(input: Record<string, unknown>, field: AccountMetricField): unknown {
  if (field in input) return input[field];
  const camel = field.replace(/_([a-z])/g, (_match, letter: string) => letter.toUpperCase());
  return input[camel];
}

export function normalizeAccountMetrics(input: unknown): AccountMetricsResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Each entry must be an object." };
  }
  const record = input as Record<string, unknown>;

  const platformRaw = String(record.platform ?? "").trim().toUpperCase();
  if (!isMetricPlatform(platformRaw)) {
    return { ok: false, error: `platform must be one of ${METRIC_PLATFORMS.join(", ")}.` };
  }

  const metrics: ProvidedAccountMetrics = {};
  for (const field of ACCOUNT_METRIC_FIELDS) {
    const raw = readField(record, field);
    if (raw === undefined || raw === null) continue;
    const text = String(raw).trim();
    if (text === "") continue;
    const parsed = Number(text);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { ok: false, error: `${field} must be a number of 0 or more.` };
    }
    metrics[field] = Math.round(parsed);
  }

  if (Object.keys(metrics).length === 0) {
    return { ok: false, error: "Enter at least one metric." };
  }

  return { ok: true, value: { platform: platformRaw, metrics } };
}
