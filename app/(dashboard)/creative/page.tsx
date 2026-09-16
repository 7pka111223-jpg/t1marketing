import { PageHeader } from "@/components/page-header";
import { AssetUploader } from "@/components/asset-uploader";
import { FormatCards } from "@/components/format-cards";
import { getAssetLibrary } from "@/lib/data/marketing";

export default async function CreativePage() {
  const assets = await getAssetLibrary();
  return <>
    <PageHeader title="Creative Studio" copy="Existing TripleOne footage comes first. AI supports selection, copy, layout and graphics—not generic replacement athletes."/>
    <AssetUploader/>
    <FormatCards/>
    <section className="section grid grid-2">
      <div className="card"><div className="card-head"><h2 className="display card-title">Asset Library</h2><span className="badge badge-success">Indexed</span></div><div className="form-row"><label>Search media</label><input placeholder="e.g. muscle-up transition, beginner pull-up, member PR"/></div>{assets.length === 0 ? <div className="empty">No indexed media yet. Upload marketing-cleared TripleOne footage to begin.</div> : assets.map((a) => <div className="queue-item" key={a.id}><div className="thumb"><span className="mono">{a.kind}</span></div><div><div className="item-title">{a.name}</div><div className="item-meta">{a.meta}</div></div><span className="badge">{a.badge}</span></div>)}</div>
      <div className="card card-dark"><div className="card-head"><h2 className="display card-title">Render Queue</h2><span className="badge badge-red">2</span></div><div style={{ padding:'20px 0', borderBottom:'1px solid #262626' }}><strong>Muscle-Up Transition</strong><div className="item-meta" style={{ color:'#a3a3a3', margin:'7px 0 12px' }}>Cut + subtitles + branded titles</div><div className="progress"><span style={{ width:'72%' }}/></div></div><div style={{ padding:'20px 0' }}><strong>5 Pull-Up Mistakes</strong><div className="item-meta" style={{ color:'#a3a3a3', margin:'7px 0 12px' }}>8-slide carousel · T1 EDU 01</div><div className="progress"><span style={{ width:'38%' }}/></div></div></div>
    </section>
  </>;
}
