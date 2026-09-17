// Import-free so it unit-tests under node:test. Shapes an untrusted model response into a
// brief: values are coerced to trimmed strings, capped, and anything unusable is dropped.
export type GeneratedBrief = {
  hook: string;
  script: string;
  caption: string;
  cta: string;
  audience: string;
  performanceHypothesis: string;
};

const LIMITS = {
  hook: 300,
  script: 4000,
  caption: 2200,
  cta: 200,
  audience: 300,
  performanceHypothesis: 600,
} as const;

export function normalizeBrief(input: unknown): GeneratedBrief | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;

  const brief: GeneratedBrief = {
    hook: text(record.hook, LIMITS.hook),
    script: text(record.script, LIMITS.script),
    caption: text(record.caption, LIMITS.caption),
    cta: text(record.cta, LIMITS.cta),
    audience: text(record.audience, LIMITS.audience),
    performanceHypothesis: text(record.performanceHypothesis, LIMITS.performanceHypothesis),
  };

  // A response with no copy at all is not a usable brief.
  if (!brief.hook && !brief.script && !brief.caption) return null;
  return brief;
}

function text(value: unknown, limit: number): string {
  if (value === undefined || value === null) return "";
  return String(value).trim().slice(0, limit);
}
