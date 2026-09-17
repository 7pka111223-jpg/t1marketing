import assert from "node:assert/strict";
import { test } from "node:test";
import { canTransitionCampaign, isCampaignStatus, nextCampaignStatuses } from "./campaign-status.ts";

test("a draft can be launched or archived", () => {
  assert.equal(canTransitionCampaign("DRAFT", "ACTIVE"), true);
  assert.equal(canTransitionCampaign("DRAFT", "ARCHIVED"), true);
  assert.equal(canTransitionCampaign("DRAFT", "COMPLETED"), false);
});

test("a live campaign can pause, complete or archive", () => {
  assert.equal(canTransitionCampaign("ACTIVE", "PAUSED"), true);
  assert.equal(canTransitionCampaign("ACTIVE", "COMPLETED"), true);
  assert.equal(canTransitionCampaign("ACTIVE", "ARCHIVED"), true);
});

test("a paused campaign can resume", () => {
  assert.equal(canTransitionCampaign("PAUSED", "ACTIVE"), true);
});

test("archived is terminal", () => {
  assert.deepEqual(nextCampaignStatuses("ARCHIVED"), []);
  assert.equal(canTransitionCampaign("ARCHIVED", "ACTIVE"), false);
});

test("unknown statuses never transition", () => {
  assert.deepEqual(nextCampaignStatuses("BANANA"), []);
  assert.equal(canTransitionCampaign("BANANA", "ACTIVE"), false);
  assert.equal(canTransitionCampaign("DRAFT", "BANANA"), false);
  assert.equal(isCampaignStatus("DRAFT"), true);
  assert.equal(isCampaignStatus("draft"), false);
});
