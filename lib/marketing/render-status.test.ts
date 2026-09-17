import assert from "node:assert/strict";
import { test } from "node:test";
import { isRenderStatus, renderProgress } from "./render-status.ts";

test("recognizes only real render statuses", () => {
  assert.equal(isRenderStatus("RENDERING"), true);
  assert.equal(isRenderStatus("rendering"), false);
  assert.equal(isRenderStatus("DONE"), false);
  assert.equal(isRenderStatus(null), false);
});

test("stage progress reflects the render state", () => {
  assert.equal(renderProgress("PENDING"), 20);
  assert.equal(renderProgress("RENDERING"), 70);
  assert.equal(renderProgress("READY"), 100);
});

test("failed renders report no progress rather than a full bar", () => {
  assert.equal(renderProgress("FAILED"), 0);
  assert.equal(renderProgress("UNKNOWN"), 0);
});
