import assert from "node:assert/strict";
import { test } from "node:test";
import { buildMetricsRows } from "./metrics-sync-row-builder.ts";

test("builds one zero-filled row per published publication", () => {
  const rows = buildMetricsRows([
    { id: "p1" },
    { id: "p2" },
  ]);
  assert.deepEqual(
    rows.map((r) => ({ publication_id: r.publication_id, views: r.views })),
    [
      { publication_id: "p1", views: 0 },
      { publication_id: "p2", views: 0 },
    ],
  );
});
