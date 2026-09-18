import assert from "node:assert/strict";
import { test } from "node:test";
import { estimateVideoCost, monthlyCapStatus, validateVideoRequest } from "./cost.ts";

test("prices an H3 clip per second", () => {
  assert.equal(estimateVideoCost("minimax/hailuo-3", { duration: 5, resolution: "2K" }), 0.65);
  assert.equal(estimateVideoCost("minimax/hailuo-3", { duration: 10, resolution: "2K" }), 1.3);
});

test("charges for reference images on H3", () => {
  assert.equal(estimateVideoCost("minimax/hailuo-3", { duration: 5, resolution: "2K", referenceImages: 2 }), 0.73);
});

test("prices H3 Max by resolution and never charges for references", () => {
  assert.equal(estimateVideoCost("minimax/hailuo-3-max", { duration: 5, resolution: "480p" }), 0.25);
  assert.equal(estimateVideoCost("minimax/hailuo-3-max", { duration: 5, resolution: "768p" }), 0.4);
  assert.equal(estimateVideoCost("minimax/hailuo-3-max", { duration: 5, resolution: "480p", referenceImages: 3 }), 0.25);
});

test("returns null for an unknown model", () => {
  assert.equal(estimateVideoCost("nope/nope", { duration: 5, resolution: "2K" }), null);
});

test("allows a clip that fits inside the cap", () => {
  const status = monthlyCapStatus(9, 0.65, 10);
  assert.equal(status.allowed, true);
  assert.equal(status.remainingUsd, 1);
});

test("refuses a clip that would exceed the cap, and says why", () => {
  const status = monthlyCapStatus(9.5, 0.65, 10);
  assert.equal(status.allowed, false);
  assert.equal(status.remainingUsd, 0.5);
  assert.match(status.reason ?? "", /only \$0\.50/);
});

test("refuses everything once the cap is spent", () => {
  const status = monthlyCapStatus(10, 0.25, 10);
  assert.equal(status.allowed, false);
  assert.equal(status.remainingUsd, 0);
});

test("accepts a supported duration, resolution and aspect ratio", () => {
  assert.equal(validateVideoRequest({ modelId: "minimax/hailuo-3", duration: 5, resolution: "2K", aspectRatio: "9:16" }).ok, true);
  assert.equal(validateVideoRequest({ modelId: "minimax/hailuo-3-max", duration: 15, resolution: "480p", aspectRatio: "16:9" }).ok, true);
});

test("rejects combinations the model does not support", () => {
  const tooShort = validateVideoRequest({ modelId: "minimax/hailuo-3", duration: 4, resolution: "2K", aspectRatio: "9:16" });
  assert.equal(tooShort.ok, false);

  const wrongResolution = validateVideoRequest({ modelId: "minimax/hailuo-3", duration: 5, resolution: "1080p", aspectRatio: "9:16" });
  assert.equal(wrongResolution.ok, false);

  const wrongRatio = validateVideoRequest({ modelId: "minimax/hailuo-3", duration: 5, resolution: "2K", aspectRatio: "9:21" });
  assert.equal(wrongRatio.ok, false);

  assert.equal(validateVideoRequest({ modelId: "unknown/model", duration: 5, resolution: "2K", aspectRatio: "9:16" }).ok, false);
});
