import assert from "node:assert/strict";
import { test } from "node:test";
import { parsePostUrl } from "./post-url.ts";

test("parses an Instagram reel url", () => {
  const parsed = parsePostUrl("https://www.instagram.com/reel/C8xYzAbCdEf/");
  assert.deepEqual(parsed, { platform: "INSTAGRAM", externalId: "C8xYzAbCdEf" });
});

test("parses Instagram post and tv urls", () => {
  assert.deepEqual(parsePostUrl("https://instagram.com/p/C8xYzAbCdEf/"), { platform: "INSTAGRAM", externalId: "C8xYzAbCdEf" });
  assert.deepEqual(parsePostUrl("https://instagram.com/tv/C8xYzAbCdEf/"), { platform: "INSTAGRAM", externalId: "C8xYzAbCdEf" });
});

test("ignores query strings and tracking suffixes", () => {
  const parsed = parsePostUrl("https://www.instagram.com/reel/C8xYzAbCdEf/?igsh=abc123&utm_source=qr");
  assert.equal(parsed?.externalId, "C8xYzAbCdEf");
});

test("parses TikTok video and photo urls", () => {
  assert.deepEqual(parsePostUrl("https://www.tiktok.com/@triple_one111/video/7412345678901234567"), { platform: "TIKTOK", externalId: "7412345678901234567" });
  assert.deepEqual(parsePostUrl("https://tiktok.com/@triple_one111/photo/7412345678901234567"), { platform: "TIKTOK", externalId: "7412345678901234567" });
});

test("rejects empty or unparseable input", () => {
  assert.equal(parsePostUrl(""), null);
  assert.equal(parsePostUrl("   "), null);
  assert.equal(parsePostUrl("not a url"), null);
});

test("rejects other platforms and bare profile links", () => {
  assert.equal(parsePostUrl("https://youtube.com/watch?v=abc"), null);
  assert.equal(parsePostUrl("https://www.instagram.com/tripleonebars/"), null);
  assert.equal(parsePostUrl("https://www.tiktok.com/@triple_one111"), null);
});

test("rejects links whose id does not look valid", () => {
  assert.equal(parsePostUrl("https://www.instagram.com/reel/ab/"), null);
  assert.equal(parsePostUrl("https://www.tiktok.com/@triple_one111/video/abc"), null);
});
