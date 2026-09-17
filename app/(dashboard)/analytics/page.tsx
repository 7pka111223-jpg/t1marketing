import { PageHeader } from "@/components/page-header";
import { SyncMetricsButton } from "@/components/sync-metrics-button";
import { getAnalytics } from "@/lib/data/marketing";

export default async function AnalyticsPage() {
  const { metrics, funnel, converts, languageNote } = await getAnalytics();
  return <>
    <PageHeader title="Analytics" copy="Optimize for recognition and membership outcomes, not views alone. Content IDs follow users through app signup, booking and membership where attribution is available." action={<SyncMetricsButton/>}/>
    <div className="grid grid-4">{metrics.map((m) => <div className="stat-card" key={m.label}><div className="stat-label">{m.label}</div><div className="display stat-value">{m.value}</div>{m.delta && <div className="stat-delta">{m.delta}</div>}</div>)}</div>
    <section className="section card"><div className="card-head"><h2 className="display card-title">Content → Membership</h2><span className="badge">Last 30 days</span></div>{funnel.length === 0 ? <div className="empty">No metrics yet. Run <span className="mono">Sync metrics</span> once posts are published, or populate <span className="mono">marketing.metrics</span> from platform analytics to build the funnel.</div> : <div className="funnel">{funnel.map((f) => <div className="funnel-step" key={f.label} style={{ ['--h' as string]: `${f.h}px` }}><span className="display funnel-value">{f.value}</span><span className="funnel-label">{f.label}</span></div>)}</div>}</section>
    <div className="grid grid-2 section">
      <div className="card"><h2 className="display card-title">What converts</h2>{converts.length === 0 ? <div className="empty">Attribution needs conversion data mapped to content IDs.</div> : converts.map((d) => <div className="score-row" key={d.label}><span>{d.label}</span><span className="progress"><span style={{ width: `${d.weight}%` }}/></span><span className="score-number">{d.value}</span></div>)}</div>
      <div className="card"><h2 className="display card-title">Language signal</h2><div className="note" style={{ marginTop: 16 }}>{languageNote}</div></div>
    </div>
  </>;
}
