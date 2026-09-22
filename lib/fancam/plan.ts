// Import-free so it unit-tests under node:test.
//
// This is the "merge text → planner → JSON extract" half of the fan-cam chain. The operator gives
// three loose fields (event, reaction, an optional preset). The planner turns them into the two
// prompts the paid models actually need — one for the image edit, one for the motion pass — plus
// the caption, so the clip arrives with copy attached instead of needing a second AI round.
//
// Everything the planner returns is untrusted text: it is coerced, trimmed and capped here, and a
// response missing the two prompts is rejected rather than half-used.

export type FanCamInput = {
  event: string;
  reaction: string;
  sceneBrief: string;
  frameInstruction: string;
  durationSeconds: number;
};

export type FanCamPlan = {
  editPrompt: string;
  videoPrompt: string;
  negativePrompt: string;
  caption: string;
  altText: string;
};

const LIMITS = {
  editPrompt: 2000,
  videoPrompt: 1200,
  negativePrompt: 600,
  caption: 2200,
  altText: 400,
} as const;

// Kept short and concrete. The planner's job is scene description, not brand voice invention —
// brandSystemPrompt is prepended by the caller so the caption still sounds like TripleOne.
export const FANCAM_SYSTEM_PROMPT = `
You plan a single "fan cam" shot: one real person's photo is composited into a crowd scene, then that frame is animated into a short clip.
You do not generate the image or the video. You write the instructions for the two models that do.

Rules:
- The person in the supplied photo keeps their exact face, hair, skin tone, build and clothing. Never restyle, beautify, slim, lighten or age them. Say this explicitly in the edit prompt.
- Put the person in the crowd as a spectator. They are reacting to the event, not competing in it, unless the reaction text says otherwise.
- The edit prompt describes one still frame: where the person sits or stands, the lighting, the background crowd, lens and any broadcast overlay.
- The video prompt describes motion only over a few seconds: camera move, the person's reaction beat, crowd movement. No new subjects, no cuts, no text.
- The caption is for Instagram or TikTok. Short lines, no hashtag spam, no emoji walls.
Return ONLY a JSON object, no prose and no code fence, with exactly these string keys:
{"editPrompt":"","videoPrompt":"","negativePrompt":"","caption":"","altText":""}
`.trim();

export function buildPlannerPrompt(input: FanCamInput): string {
  const lines = [
    `EVENT: ${input.event.trim()}`,
    `REACTION OR SITUATION: ${input.reaction.trim()}`,
    `SCENE STARTING POINT: ${input.sceneBrief.trim()}`,
    `FRAMING: ${input.frameInstruction.trim()}`,
    `CLIP LENGTH: ${input.durationSeconds} seconds, so the video prompt must describe one continuous beat that fits in ${input.durationSeconds} seconds.`,
  ];
  return lines.join("\n");
}

// Models wrap JSON in fences, prefix it with "Here is", or return it inside a larger object. Pull
// the first balanced top-level object out of the text rather than trusting the whole response.
export function extractJsonObject(raw: string): unknown {
  const text = String(raw ?? "");
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let index = start; index < text.length; index += 1) {
    const character = text[index];
    if (inString) {
      if (escaped) escaped = false;
      else if (character === "\\") escaped = true;
      else if (character === '"') inString = false;
      continue;
    }
    if (character === '"') inString = true;
    else if (character === "{") depth += 1;
    else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, index + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

export function normalizePlan(input: unknown): FanCamPlan | null {
  if (!input || typeof input !== "object" || Array.isArray(input)) return null;
  const record = input as Record<string, unknown>;

  const plan: FanCamPlan = {
    editPrompt: text(record.editPrompt, LIMITS.editPrompt),
    videoPrompt: text(record.videoPrompt, LIMITS.videoPrompt),
    negativePrompt: text(record.negativePrompt, LIMITS.negativePrompt),
    caption: text(record.caption, LIMITS.caption),
    altText: text(record.altText, LIMITS.altText),
  };

  // Either prompt missing means a paid call would be made on a guess. Fail instead.
  if (!plan.editPrompt || !plan.videoPrompt) return null;
  return plan;
}

// The likeness rule is the one instruction that must not depend on the planner remembering it, so
// it is appended to whatever the planner wrote.
export const LIKENESS_INSTRUCTION =
  "Preserve the person from the supplied photo exactly: same face, facial structure, skin tone, hair and body type. Do not beautify, slim, lighten, age or restyle them. Do not replace them with a different person.";

export function withLikenessGuard(editPrompt: string): string {
  const trimmed = String(editPrompt ?? "").trim();
  if (!trimmed) return LIKENESS_INSTRUCTION;
  return `${trimmed}\n\n${LIKENESS_INSTRUCTION}`;
}

export function parsePlan(raw: string): FanCamPlan | null {
  return normalizePlan(extractJsonObject(raw));
}

function text(value: unknown, limit: number): string {
  if (value === undefined || value === null) return "";
  return String(value).trim().slice(0, limit);
}
