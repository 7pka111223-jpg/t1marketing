import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizePlatformMetrics } from "./metrics-normalize.ts";

test("empty input defaults every metric to 0, never undefined", () => {
  const result = normalizePlatformMetrics({});
  for (const key of ["views", "reach", "likes", "comments", "shares", "saves", "profile_visits", "link_clicks", "follows"]) {
    assert.equal(result[key as keyof typeof result], 0, `${key} must default to 0`);
  }
});
