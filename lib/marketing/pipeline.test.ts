import assert from "node:assert/strict";
import { test } from "node:test";
import { contentProgress, CONTENT_PIPELINE } from "./pipeline.ts";

test("a brand new idea shows no progress", () => {
  assert.equal(contentProgress("IDEA"), 0);
});

test("progress increases along the pipeline", () => {
  assert.equal(contentProgress("COPY_REVIEW") > contentProgress("BRIEF_REVIEW"), true);
  assert.equal(contentProgress("PUBLISHED") > contentProgress("CREATIVE_REVIEW"), true);
});

test("the final stage is 100", () => {
  assert.equal(contentProgress(CONTENT_PIPELINE[CONTENT_PIPELINE.length - 1]), 100);
  assert.equal(contentProgress("ARCHIVED"), 100);
});

test("unknown statuses do not invent progress", () => {
  assert.equal(contentProgress("BANANA"), 0);
  assert.equal(contentProgress(""), 0);
});
