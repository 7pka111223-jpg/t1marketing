import assert from "node:assert/strict";
import { test } from "node:test";
import { nextPublicationStatus, canDeliver } from "./publication-flow.ts";

test("scheduling a READY_TO_SCHEDULE item moves it to SCHEDULED", () => {
  assert.equal(nextPublicationStatus("READY_TO_SCHEDULE"), "SCHEDULED");
});

test("human approval moves a SCHEDULED publication to APPROVED", () => {
  assert.equal(nextPublicationStatus("SCHEDULED"), "APPROVED");
});

test("delivery is only allowed from APPROVED", () => {
  assert.equal(canDeliver("APPROVED").ok, true);
  assert.equal(canDeliver("SCHEDULED").ok, false);
  assert.equal(canDeliver("DRAFT").ok, false);
  assert.equal(canDeliver("PUBLISHED").ok, false);
});
