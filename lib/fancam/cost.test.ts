import { test } from "node:test";
import assert from "node:assert/strict";
import { estimateFanCamCost, validateFanCamRequest } from "./cost.ts";
import { DEFAULT_IMAGE_MODEL, DEFAULT_VIDEO_MODEL, PLANNER_ALLOWANCE_USD } from "./models.ts";

const base = {
  imageModelId: DEFAULT_IMAGE_MODEL,
  videoModelId: DEFAULT_VIDEO_MODEL,
  durationSeconds: 5,
  withAudio: false,
};

test("a 5s silent fan cam is the frame, the clip and the planner allowance", () => {
  const cost = estimateFanCamCost(base);
  // Nano Banana edit $0.039 + Kling v3 Standard 5 × $0.084 + $0.01 planner.
  assert.equal(cost?.imageUsd, 0.04);
  assert.equal(cost?.videoUsd, 0.42);
  assert.equal(cost?.plannerUsd, PLANNER_ALLOWANCE_USD);
  assert.equal(cost?.totalUsd, 0.47);
});

test("audio costs more per second", () => {
  const silent = estimateFanCamCost(base);
  const loud = estimateFanCamCost({ ...base, withAudio: true });
  assert.ok((loud?.videoUsd ?? 0) > (silent?.videoUsd ?? 0));
  assert.equal(loud?.videoUsd, 0.63);
});

test("doubling the length doubles only the clip", () => {
  const short = estimateFanCamCost(base);
  const long = estimateFanCamCost({ ...base, durationSeconds: 10 });
  assert.equal(long?.videoUsd, (short?.videoUsd ?? 0) * 2);
  assert.equal(long?.imageUsd, short?.imageUsd);
});

test("an unknown model estimates nothing rather than guessing zero", () => {
  assert.equal(estimateFanCamCost({ ...base, imageModelId: "fal-ai/nope" }), null);
  assert.equal(estimateFanCamCost({ ...base, videoModelId: "fal-ai/nope" }), null);
});

const validBase = { ...base, event: "National street workout final", reaction: "On their feet" };

test("a well-formed request validates", () => {
  assert.deepEqual(validateFanCamRequest(validBase), { ok: true });
});

test("an unsupported duration is refused before anything is submitted", () => {
  const result = validateFanCamRequest({ ...validBase, durationSeconds: 7 });
  assert.equal(result.ok, false);
  assert.match((result as { error: string }).error, /5s or 10s/);
});

test("thin event or reaction text is refused", () => {
  assert.equal(validateFanCamRequest({ ...validBase, event: "final" }).ok, false);
  assert.equal(validateFanCamRequest({ ...validBase, reaction: " " }).ok, false);
});

test("an unknown model is refused", () => {
  assert.equal(validateFanCamRequest({ ...validBase, videoModelId: "fal-ai/nope" }).ok, false);
});
