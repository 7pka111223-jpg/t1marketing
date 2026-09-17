import { PageHeader } from "@/components/page-header";
import { AssetLibrary } from "@/components/asset-library";
import { AssetUploader } from "@/components/asset-uploader";
import { FormatCards } from "@/components/format-cards";
import { getAssetLibrary, getRenderQueue } from "@/lib/data/marketing";
import { renderProgress } from "@/lib/marketing/render-status";

export default async function CreativePage() {
  const [assets, renders] = await Promise.all([getAssetLibrary(), getRenderQueue()]);
  return <>
    <PageHeader title="Creative Studio" copy="Existing TripleOne footage comes first. AI supports selection, copy, layout and graphics—not generic replacement athletes."/>
    <AssetUploader/>
    <FormatCards/>
    <section className="section grid grid-2">
      <AssetLibrary assets={assets}/>
      <div className="card card-dark"><div className="card-head"><h2 className="display card-title">Render Queue</h2><span className="badge badge-red">{renders.length}</span></div>
        {renders.length === 0
          ? <div className="empty" style={{ color: "#a3a3a3" }}>No renders queued yet. Creatives appear here with their render status.</div>
          : renders.map((item) => <div key={item.id} style={{ padding: "20px 0", borderBottom: "1px solid #262626" }}>
              <strong>{item.title}</strong>
              <div className="item-meta" style={{ color: "#a3a3a3", margin: "7px 0 12px" }}>{item.detail}</div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span className="badge">{item.status}</span>
                {item.status !== "FAILED" && <div className="progress" style={{ flex: 1 }}><span style={{ width: `${renderProgress(item.status)}%` }}/></div>}
              </div>
            </div>)}
      </div>
    </section>
  </>;
}
