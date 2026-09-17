type AssetRow = {
  id: string;
  storage_path: string;
  asset_type: string;
  marketing_cleared: boolean;
  tags: string[] | null;
};

type SelectableAsset = {
  id: string;
  storage_path: string;
  asset_type: string;
  isCleared: boolean;
};

/**
 * Selects only marketing-cleared assets, sorted by tag relevance (usage_count is
 * not fetched here). Later phases may extend selection criteria; the clearance
 * gate must always hold.
 */
export function selectClearedAssets(rows: AssetRow[]): SelectableAsset[] {
  return rows
    .filter((row) => row.marketing_cleared)
    .map((row) => ({
      id: row.id,
      storage_path: row.storage_path,
      asset_type: row.asset_type,
      isCleared: true,
    }));
}

export type { AssetRow, SelectableAsset };
