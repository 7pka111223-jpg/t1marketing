"use client";

import { useMemo, useState } from "react";
import type { AssetItem } from "@/lib/types";

export function AssetLibrary({ assets }: { assets: AssetItem[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return assets;
    return assets.filter((asset) => `${asset.name} ${asset.meta} ${asset.kind}`.toLowerCase().includes(needle));
  }, [assets, query]);

  return <div className="card">
    <div className="card-head"><h2 className="display card-title">Asset Library</h2><span className="badge badge-success">Indexed</span></div>
    <div className="form-row"><label>Search media</label><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="e.g. muscle-up transition, beginner pull-up, member PR"/></div>
    {assets.length === 0
      ? <div className="empty">No indexed media yet. Upload marketing-cleared TripleOne footage to begin.</div>
      : filtered.length === 0
        ? <div className="empty">No media matches “{query.trim()}”.</div>
        : filtered.map((asset) => <div className="queue-item" key={asset.id}>
            <div className="thumb"><span className="mono">{asset.kind}</span></div>
            <div><div className="item-title">{asset.name}</div><div className="item-meta">{asset.meta}</div></div>
            <span className="badge">{asset.badge}</span>
          </div>)}
  </div>;
}
