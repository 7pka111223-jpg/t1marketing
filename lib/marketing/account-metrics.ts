// Import-free so it unit-tests under node:test. Validates the numbers an operator types in
// from their own Instagram/TikTok Insights screen.
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

export type NormalizedAccountMetrics = { platform: MetricPlatform } & Record<AccountMetricField, number>;

export type AccountMetricsResult =
  | { ok: true; value: NormalizedAccountMetrics }
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

  const value = { platform: platformRaw } as NormalizedAccountMetrics;
  for (const field of ACCOUNT_METRIC_FIELDS) {
    const raw = readField(record, field);
    if (raw === undefined || raw === null || raw === "") {
      value[field] = 0;
      continue;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed) || parsed < 0) {
      return { ok: false, error: `${field} must be a number of 0 or more.` };
    }
    value[field] = Math.round(parsed);
  }

  if (ACCOUNT_METRIC_FIELDS.every((field) => value[field] === 0)) {
    return { ok: false, error: "Enter at least one metric." };
  }

  return { ok: true, value };
}
