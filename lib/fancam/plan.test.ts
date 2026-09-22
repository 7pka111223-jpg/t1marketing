import { test } from "node:test";
import assert from "node:assert/strict";
import {
  LIKENESS_INSTRUCTION,
  buildPlannerPrompt,
  extractJsonObject,
  normalizePlan,
  parsePlan,
  withLikenessGuard,
} from "./plan.ts";

const goodPlan = {
  editPrompt: "Seat the person in the lower bowl, arena key light from the ring.",
  videoPrompt: "Slow push in as they rise out of the seat, crowd blurs behind.",
  negativePrompt: "text, watermark, extra limbs",
  caption: "Front row for the last rep.",
  altText: "A spectator standing and cheering in a floodlit arena crowd.",
};

test("buildPlannerPrompt carries every operator field into the planner", () => {
  const prompt = buildPlannerPrompt({
    event: "National street workout final",
    reaction: "On their feet, arms up",
    sceneBrief: "Floodlit city park, scoreboard glow",
    frameInstruction: "Compose as a single horizontal 16:9 broadcast frame.",
    durationSeconds: 5,
  });
  assert.match(prompt, /National street workout final/);
  assert.match(prompt, /On their feet, arms up/);
  assert.match(prompt, /scoreboard glow/);
  assert.match(prompt, /16:9 broadcast frame/);
  assert.match(prompt, /5 seconds/);
});

test("extractJsonObject pulls the object out of a fenced response", () => {
  const raw = 'Here is the plan:\n```json\n{"editPrompt":"a","videoPrompt":"b"}\n```\nHope that helps.';
  assert.deepEqual(extractJsonObject(raw), { editPrompt: "a", videoPrompt: "b" });
});

test("extractJsonObject survives braces inside strings", () => {
  const raw = '{"editPrompt":"a } brace { inside","videoPrompt":"b"}';
  assert.deepEqual(extractJsonObject(raw), { editPrompt: "a } brace { inside", videoPrompt: "b" });
});

test("extractJsonObject survives escaped quotes inside strings", () => {
  const raw = '{"editPrompt":"they said \\"go\\"","videoPrompt":"b"}';
  assert.deepEqual(extractJsonObject(raw), { editPrompt: 'they said "go"', videoPrompt: "b" });
});

test("extractJsonObject returns null when there is no object or it is malformed", () => {
  assert.equal(extractJsonObject("no json at all"), null);
  assert.equal(extractJsonObject('{"editPrompt": '), null);
});

test("normalizePlan trims and keeps a complete plan", () => {
  const plan = normalizePlan({ ...goodPlan, editPrompt: `  ${goodPlan.editPrompt}  ` });
  assert.equal(plan?.editPrompt, goodPlan.editPrompt);
  assert.equal(plan?.caption, goodPlan.caption);
});

test("normalizePlan rejects a plan missing either prompt, so no paid call runs on a guess", () => {
  assert.equal(normalizePlan({ ...goodPlan, editPrompt: "" }), null);
  assert.equal(normalizePlan({ ...goodPlan, videoPrompt: "   " }), null);
  assert.equal(normalizePlan(null), null);
  assert.equal(normalizePlan([goodPlan]), null);
});

test("normalizePlan caps long fields", () => {
  const plan = normalizePlan({ ...goodPlan, caption: "x".repeat(5000) });
  assert.equal(plan?.caption.length, 2200);
});

test("parsePlan goes from raw model text to a plan in one step", () => {
  const plan = parsePlan(`\`\`\`json\n${JSON.stringify(goodPlan)}\n\`\`\``);
  assert.equal(plan?.videoPrompt, goodPlan.videoPrompt);
});

test("withLikenessGuard always appends the likeness rule", () => {
  assert.match(withLikenessGuard("Seat them in the crowd."), /Seat them in the crowd\./);
  assert.match(withLikenessGuard("Seat them in the crowd."), /Do not beautify/);
  assert.equal(withLikenessGuard("   "), LIKENESS_INSTRUCTION);
});
