// Import-free so it unit-tests under node:test.
//
// The project's brand rules prefer real TripleOne footage over generated imagery, so generating
// people is an explicit, per-request choice rather than a default. This gate refuses a prompt that
// looks like it would produce people unless the caller has confirmed it deliberately.
const PEOPLE_TERMS = [
  "athlete",
  "athletes",
  "member",
  "members",
  "coach",
  "instructor",
  "person",
  "people",
  "man",
  "woman",
  "guy",
  "girl",
  "male",
  "female",
  "gymnast",
  "trainee",
  "student",
  "crowd",
  "face",
  "faces",
  "body",
  "hands",
  "arms",
  "muscle-up",
  "muscle up",
  "pull-up",
  "pull up",
  "handstand",
  "squat",
];

export const NO_PEOPLE_INSTRUCTION =
  "Show only the gym environment and equipment — no people, no athletes and no faces.";

function escapeTerm(term: string): string {
  return term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function mentionsPeople(prompt: string): boolean {
  const text = String(prompt ?? "").toLowerCase();
  return PEOPLE_TERMS.some((term) => new RegExp(`\\b${escapeTerm(term)}\\b`).test(text));
}

export type PeopleGate = { ok: true } | { ok: false; reason: string };

export function peopleGate(prompt: string, allowPeople: boolean): PeopleGate {
  if (!mentionsPeople(prompt)) return { ok: true };
  if (allowPeople) return { ok: true };
  return {
    ok: false,
    reason:
      "This prompt looks like it would generate people. Confirm that you intend to generate people, or reword it to describe only the environment and equipment.",
  };
}

// When people are not allowed, the constraint has to travel inside the prompt: the model exposes
// no negative-prompt passthrough on OpenRouter (only aigc_watermark).
export function withPeopleConstraint(prompt: string, allowPeople: boolean): string {
  const trimmed = String(prompt ?? "").trim();
  if (allowPeople) return trimmed;
  return `${trimmed} ${NO_PEOPLE_INSTRUCTION}`.trim();
}
