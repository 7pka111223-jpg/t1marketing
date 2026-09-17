import assert from "node:assert/strict";
import { test } from "node:test";
import { selectClearedAssets } from "./asset-selection.ts";

test("only returns marketing-cleared assets", () => {
  const result = selectClearedAssets([
    { id: "a", storage_path: "p/a", asset_type: "VIDEO", marketing_cleared: true, tags: null },
    { id: "b", storage_path: "p/b", asset_type: "PHOTO", marketing_cleared: false, tags: null },
  ]);
  assert.deepEqual(
    result.map((r) => r.id),
    ["a"],
  );
});

test("marks every returned asset as cleared", () => {
  const result = selectClearedAssets([
    { id: "a", storage_path: "p/a", asset_type: "VIDEO", marketing_cleared: true, tags: [] },
  ]);
  assert.equal(result[0]?.isCleared, true);
});
