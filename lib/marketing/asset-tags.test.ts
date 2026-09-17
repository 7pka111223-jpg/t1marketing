import assert from "node:assert/strict";
import { test } from "node:test";
import { deriveAssetTags } from "./asset-tags.ts";

test("derives lowercase tags from the file name", () => {
  assert.deepEqual(deriveAssetTags("Muscle-Up_Transition FINAL.mp4"), [
    "muscle",
    "transition",
    "final",
  ]);
});

test("drops short tokens and extension", () => {
  assert.deepEqual(deriveAssetTags("the PR.mp4"), ["the"]);
});

test("falls back to storage path when no original name", () => {
  assert.deepEqual(deriveAssetTags(null, "u1/123-abc.mp4"), ["123", "abc"]);
});
