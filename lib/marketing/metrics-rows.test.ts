import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMetricsRows } from "./metrics-normalize.ts";

test("builds one zero-filled row per published publication when no insights exist", () => {
  const rows = buildMetricsRows([{ id: "pub-1" }, { id: "pub-2" }]);
  assert.equal(rows.length, 2);
  assert.equal(rows[0].publication_id, "pub-1");
  assert.equal(rows[0].reach, 0);
  assert.equal(rows[1].views, 0);
});

test("uses live insights when provided and zero-fills the rest", () => {
  const rows = buildMetricsRows([{ id: "pub-1" }, { id: "pub-2" }], {
    "pub-1": { views: 5000, reach: 4200, likes: 310 },
    "pub-2": null,
  });
  assert.equal(rows[0].views, 5000);
  assert.equal(rows[0].reach, 4200);
  assert.equal(rows[0].likes, 310);
  assert.equal(rows[0].comments, 0);
  assert.equal(rows[1].views, 0);
});

test("clamps negative and non-numeric insight values", () => {
  const rows = buildMetricsRows([{ id: "pub-1" }], { "pub-1": { views: -5, reach: Number.NaN } });
  assert.equal(rows[0].views, 0);
  assert.equal(rows[0].reach, 0);
});
