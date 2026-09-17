import assert from "node:assert/strict";
import { test } from "node:test";
import { isMetricPlatform, normalizeAccountMetrics } from "./account-metrics.ts";

test("accepts a normal weekly entry and fills the rest with zero", () => {
  const result = normalizeAccountMetrics({ platform: "instagram", reach: 12000, profileVisits: 340, followers: 4810 });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.platform, "INSTAGRAM");
  assert.equal(result.value.reach, 12000);
  assert.equal(result.value.profile_visits, 340);
  assert.equal(result.value.followers, 4810);
  assert.equal(result.value.likes, 0);
  assert.equal(result.value.saves, 0);
});

test("accepts snake_case field names too", () => {
  const result = normalizeAccountMetrics({ platform: "TIKTOK", profile_visits: 90 });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.profile_visits, 90);
});

test("rounds fractional input", () => {
  const result = normalizeAccountMetrics({ platform: "TIKTOK", reach: 1200.6 });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.reach, 1201);
});

test("rejects a missing or unknown platform", () => {
  assert.equal(normalizeAccountMetrics({ reach: 10 }).ok, false);
  assert.equal(normalizeAccountMetrics({ platform: "YOUTUBE", reach: 10 }).ok, false);
});

test("rejects negatives and non-numeric values", () => {
  assert.equal(normalizeAccountMetrics({ platform: "TIKTOK", reach: -5 }).ok, false);
  const nan = normalizeAccountMetrics({ platform: "TIKTOK", reach: "not a number" });
  assert.equal(nan.ok, false);
  if (!nan.ok) assert.match(nan.error, /reach must be a number/);
});

test("rejects an entry with nothing filled in", () => {
  const result = normalizeAccountMetrics({ platform: "INSTAGRAM" });
  assert.equal(result.ok, false);
  if (!result.ok) assert.match(result.error, /at least one metric/);
});

test("rejects junk that is not an object", () => {
  assert.equal(normalizeAccountMetrics(null).ok, false);
  assert.equal(normalizeAccountMetrics([]).ok, false);
  assert.equal(normalizeAccountMetrics("INSTAGRAM").ok, false);
});

test("isMetricPlatform is case-insensitive and strict", () => {
  assert.equal(isMetricPlatform("instagram"), true);
  assert.equal(isMetricPlatform("TikTok"), true);
  assert.equal(isMetricPlatform("youtube"), false);
  assert.equal(isMetricPlatform(null), false);
});
