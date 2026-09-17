import assert from "node:assert/strict";
import { test } from "node:test";
import { parseInstagramInsights, parseTikTokInsights } from "./parse.ts";

test("reads Instagram values[0].value entries", () => {
  const raw = parseInstagramInsights({
    data: [
      { name: "reach", period: "lifetime", values: [{ value: 1200 }] },
      { name: "likes", period: "lifetime", values: [{ value: 84 }] },
      { name: "saved", period: "lifetime", values: [{ value: 12 }] },
    ],
  });
  assert.equal(raw.reach, 1200);
  assert.equal(raw.likes, 84);
  assert.equal(raw.saves, 12);
});

test("reads Instagram total_value entries", () => {
  const raw = parseInstagramInsights({ data: [{ name: "shares", total_value: { value: 7 } }] });
  assert.equal(raw.shares, 7);
});

test("prefers plays over impressions for views", () => {
  const raw = parseInstagramInsights({
    data: [
      { name: "impressions", values: [{ value: 999 }] },
      { name: "plays", values: [{ value: 400 }] },
    ],
  });
  assert.equal(raw.views, 400);
});

test("drops unmapped Instagram metrics and tolerates junk", () => {
  assert.deepEqual(parseInstagramInsights({ data: [{ name: "xyz", values: [{ value: 5 }] }] }), {});
  assert.deepEqual(parseInstagramInsights({ data: "nope" }), {});
  assert.deepEqual(parseInstagramInsights(null), {});
});

test("reads TikTok video fields", () => {
  const raw = parseTikTokInsights({
    data: { videos: [{ id: "123", view_count: 5000, like_count: 300, comment_count: 20, share_count: 9 }] },
  });
  assert.equal(raw.views, 5000);
  assert.equal(raw.likes, 300);
  assert.equal(raw.comments, 20);
  assert.equal(raw.shares, 9);
});

test("ignores TikTok error payloads and empty results", () => {
  assert.deepEqual(parseTikTokInsights({ error: { code: "access_token_invalid", message: "bad" } }), {});
  assert.deepEqual(parseTikTokInsights({ data: { videos: [] } }), {});
  assert.deepEqual(parseTikTokInsights({ error: { code: "ok" }, data: { videos: [] } }), {});
});
