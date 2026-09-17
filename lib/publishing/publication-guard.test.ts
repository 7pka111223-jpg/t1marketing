import assert from "node:assert/strict";
import { test } from "node:test";
import { canSchedule, canApprovePublication } from "./publication-guard.ts";

test("scheduling requires READY_TO_SCHEDULE or SCHEDULED", () => {
  assert.equal(canSchedule("READY_TO_SCHEDULE", "2026-09-20T10:00:00Z").ok, true);
  assert.equal(canSchedule("SCHEDULED", "2026-09-21T10:00:00Z").ok, true);
  assert.equal(canSchedule("CREATIVE_REVIEW", "2026-09-20T10:00:00Z").ok, false);
});

test("scheduling requires a future date", () => {
  const result = canSchedule("READY_TO_SCHEDULE", "2020-01-01T00:00:00Z");
  assert.equal(result.ok, false);
});

test("publishing requires an APPROVED publication", () => {
  assert.equal(canApprovePublication("DRAFT").ok, false);
  assert.equal(canApprovePublication("APPROVED").ok, false);
  assert.equal(canApprovePublication("SCHEDULED").ok, true);
});
