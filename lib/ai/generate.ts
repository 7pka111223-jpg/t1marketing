import { generateText } from "@/lib/ai/openrouter";
import { brandSystemPrompt } from "@/lib/ai/prompts";
import { aiConfig } from "@/lib/config";
import { normalizeBrief, type GeneratedBrief } from "./brief";

export type { GeneratedBrief };

export type GeneratedOpportunity = {
  title: string;
  reason: string;
  format: "REEL" | "CAROUSEL" | "STORY" | "STATIC";
  languageMode: "EN" | "AR_EG" | "MIXED";
  scores: Record<string, number>;
  totalScore: number;
};

const FORMATS = ["REEL", "CAROUSEL", "STORY", "STATIC"];
const LANGUAGES = ["EN", "AR_EG", "MIXED"];

export async function generateOpportunities(context: string, count = 6): Promise<GeneratedOpportunity[]> {
  if (!aiConfig.configured) throw new Error("AI gateway is not configured.");
  const raw = await generateText([
    { role: "system", content: brandSystemPrompt },
    {
      role: "user",
      content: `Return ${count} ranked content opportunities for TripleOneBars as strict JSON.`,
    },
    {
      role: "user",
      content: `Output an array of objects. Each object must have: title (string), reason (string, max 40 words), format (one of REEL|CAROUSEL|STORY|STATIC), languageMode (one of EN|AR_EG|MIXED), scores (object with numeric 0-100 values for trend, local, audience, intent, assets, brand), totalScore (0-100). Respond with JSON only, no prose. Context (may be empty):\n${context}`,
    },
  ]);
  const parsed = extractJson(raw);
  if (!Array.isArray(parsed)) return [];
  return parsed.map(normalizeOpportunity).filter((item): item is GeneratedOpportunity => item !== null);
}

export async function generateBrief(input: { title: string; format: string; languageMode: string; objective: string }): Promise<GeneratedBrief | null> {
  if (!aiConfig.configured) return null;
  const raw = await generateText([
    { role: "system", content: brandSystemPrompt },
    {
      role: "user",
      content: `Write a content brief as strict JSON with exactly these keys: hook, script, caption, cta, audience, performanceHypothesis.
- hook: one line, under 12 words, specific to the drill.
- script: a beat-by-beat shooting script of 3-6 short lines, suited to the format.
- caption: invites a save or a visit.
- cta: one short line naming the single action to take.
- audience: who this is for.
- performanceHypothesis: what should happen and why, in one sentence.
Use Egyptian Arabic naturally when the language mode is AR_EG or MIXED; never translate literally. Only JSON, no prose. Title: ${input.title}. Format: ${input.format}. Language mode: ${input.languageMode}. Objective: ${input.objective}.`,
    },
  ]);
  return normalizeBrief(extractJson(raw));
}

function normalizeOpportunity(input: unknown): GeneratedOpportunity | null {
  if (!input || typeof input !== "object") return null;
  const record = input as Record<string, unknown>;
  const title = String(record.title ?? "").trim();
  if (!title) return null;
  const rawScores = (record.scores ?? {}) as Record<string, unknown>;
  const scores: Record<string, number> = {};
  for (const [key, value] of Object.entries(rawScores)) scores[key] = clamp(Number(value));
  const format = FORMATS.includes(String(record.format)) ? (String(record.format) as GeneratedOpportunity["format"]) : "REEL";
  const languageMode = LANGUAGES.includes(String(record.languageMode)) ? (String(record.languageMode) as GeneratedOpportunity["languageMode"]) : "MIXED";
  const values = Object.values(scores);
  const average = values.length ? values.reduce((total, value) => total + value, 0) / values.length : 0;
  return {
    title: title.slice(0, 200),
    reason: String(record.reason ?? "").slice(0, 600),
    format,
    languageMode,
    scores,
    totalScore: clamp(Number(record.totalScore ?? average)),
  };
}

function extractJson(text: string): unknown {
  if (!text) return null;
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.search(/[[{]/);
  if (start === -1) return null;
  const end = Math.max(candidate.lastIndexOf("]"), candidate.lastIndexOf("}"));
  if (end <= start) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

function clamp(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}
