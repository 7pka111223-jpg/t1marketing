import assert from "node:assert/strict";
import { test } from "node:test";
import { normalizeConversionEvent, isUuid } from "./conversion-ingest.ts";

const CONTENT_ID = "11111111-1111-1111-1111-111111111111";

test("normalizes a valid event and defaults optional fields to null", () => {
  const result = normalizeConversionEvent({
    eventType: "signup",
    externalEventId: "evt-1",
    utmSource: "instagram",
    utmMedium: "organic_social",
    utmCampaign: "summer_push",
    utmContent: CONTENT_ID,
  });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.event_type, "SIGNUP");
  assert.equal(result.value.external_event_id, "evt-1");
  assert.equal(result.value.source, "instagram");
  assert.equal(result.value.utm_campaign, "summer_push");
  assert.equal(result.value.content_item_id, CONTENT_ID);
  assert.equal(result.value.occurred_at, null);
  assert.equal(result.value.publication_id, null);
});

test("accepts snake_case aliases", () => {
  const result = normalizeConversionEvent({ event_type: "MEMBERSHIP", external_event_id: "x", occurred_at: "2026-01-02T03:04:05Z" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.event_type, "MEMBERSHIP");
  assert.equal(result.value.occurred_at, "2026-01-02T03:04:05.000Z");
});

test("rejects an unknown event type", () => {
  const result = normalizeConversionEvent({ eventType: "PURCHASE" });
  assert.equal(result.ok, false);
});

test("rejects non-object input", () => {
  assert.equal(normalizeConversionEvent(null).ok, false);
  assert.equal(normalizeConversionEvent("SIGNUP").ok, false);
  assert.equal(normalizeConversionEvent([]).ok, false);
});

test("refuses emails as the anonymous reference", () => {
  const result = normalizeConversionEvent({ eventType: "SIGNUP", anonymousOrUserRef: "member@example.com" });
  assert.equal(result.ok, false);
});

test("refuses phone numbers as the anonymous reference", () => {
  const result = normalizeConversionEvent({ eventType: "BOOKING", ref: "+20 100 123 4567" });
  assert.equal(result.ok, false);
});

test("accepts a hashed opaque reference", () => {
  const result = normalizeConversionEvent({ eventType: "APP_VISIT", ref: "sha256:9f86d081" });
  assert.equal(result.ok, true);
});

test("rejects a malformed explicit content id", () => {
  const result = normalizeConversionEvent({ eventType: "SIGNUP", contentItemId: "not-a-uuid" });
  assert.equal(result.ok, false);
});

test("keeps a non-uuid utm_content without setting content_item_id", () => {
  const result = normalizeConversionEvent({ eventType: "SIGNUP", utmContent: "reel-hook-01" });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.utm_content, "reel-hook-01");
  assert.equal(result.value.content_item_id, null);
});

test("rejects an unparseable occurredAt", () => {
  const result = normalizeConversionEvent({ eventType: "SIGNUP", occurredAt: "not-a-date" });
  assert.equal(result.ok, false);
});

test("caps external_event_id length", () => {
  const result = normalizeConversionEvent({ eventType: "SIGNUP", externalEventId: "y".repeat(500) });
  assert.equal(result.ok, true);
  if (!result.ok) return;
  assert.equal(result.value.external_event_id?.length, 200);
});

test("isUuid recognizes canonical uuids", () => {
  assert.equal(isUuid(CONTENT_ID), true);
  assert.equal(isUuid("reel-hook-01"), false);
});
