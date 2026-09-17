import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizePlatformMetrics } from "./metrics-normalize.ts";

test("keeps non-negative numeric metrics and drops the rest", () => {
  const result = normalizePlatformMetrics({ views: 100, likes: -5, comments: "7", shares: null });
  assert.equal(result.views, 100);
  assert.equal(result.likes, 0);
  assert.equal(result.comments, 7);
  assert.equal(result.shares, 0);
});

test("drops unknown keys", () => {
  const result = normalizePlatformMetrics({ views: 10, oops: true });
  assert.equal("oops" in result, false);
  assert.equal(result.views, 10);
});
