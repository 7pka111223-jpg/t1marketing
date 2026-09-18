import assert from "node:assert/strict";
import { test } from "node:test";
import { isMetricPlatform, normalizeAccountMetrics } from "./account-metrics.ts";

test("returns only the fields that were filled in", () => {
  const result = normalizeAccountMetrics({ platform: "instagram", reach: 12000, profileVisits: 340 });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.platform, "INSTAGRAM");
  assert.deepEqual(result.value.metrics, { reach: 12000, profile_visits: 340 });
});

test("a blank field is omitted rather than turned into zero", () => {
  const blank = normalizeAccountMetrics({ platform: "TIKTOK", reach: "", followers: 4810 });
  assert.equal(blank.ok, true);
  if (!blank.ok) return;
  assert.equal("reach" in blank.value.metrics, false);
  assert.equal(blank.value.metrics.followers, 4810);

  const whitespace = normalizeAccountMetrics({ platform: "TIKTOK", reach: "   ", followers: 10 });
  assert.equal(whitespace.ok, true);
  if (!whitespace.ok) return;
  assert.equal("reach" in whitespace.value.metrics, false);
});

test("an explicit zero is kept, because zero is a real number", () => {
  const result = normalizeAccountMetrics({ platform: "TIKTOK", shares: 0 });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.metrics.shares, 0);
});

test("accepts snake_case field names too", () => {
  const result = normalizeAccountMetrics({ platform: "TIKTOK", profile_visits: 90 });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.metrics.profile_visits, 90);
});

test("rounds fractional input", () => {
  const result = normalizeAccountMetrics({ platform: "TIKTOK", reach: 1200.6 });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.metrics.reach, 1201);
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
