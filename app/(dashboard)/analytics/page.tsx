import { PageHeader } from "@/components/page-header";
import { SyncMetricsButton } from "@/components/sync-metrics-button";
import { AccountMetricsForm } from "@/components/account-metrics-form";
import { getAccountMetrics, getAnalytics } from "@/lib/data/marketing";

export default async function AnalyticsPage() {
  const [{ metrics, funnel, converts, languageNote }, account] = await Promise.all([getAnalytics(), getAccountMetrics()]);
  return <>
    <PageHeader title="Analytics" copy="Optimize for recognition and membership outcomes, not views alone. Content IDs follow users through app signup, booking and membership where attribution is available." action={<SyncMetricsButton/>}/>
    <div className="grid grid-4">{metrics.map((m) => <div className="stat-card" key={m.label}><div className="stat-label">{m.label}</div><div className="display stat-value">{m.value}</div>{m.delta && <div className="stat-delta">{m.delta}</div>}</div>)}</div>
    <section className="section card"><div className="card-head"><h2 className="display card-title">Content → Membership</h2><span className="badge">Last 30 days</span></div>{funnel.length === 0 ? <div className="empty">No metrics yet. Run <span className="mono">Sync metrics</span> once posts are published, or add account numbers below to build the funnel.</div> : <div className="funnel">{funnel.map((f) => <div className="funnel-step" key={f.label} style={{ ['--h' as string]: `${f.h}px` }}><span className="display funnel-value">{f.value}</span><span className="funnel-label">{f.label}</span></div>)}</div>}</section>
    <section className="section card">
      <div className="card-head"><h2 className="display card-title">Account numbers</h2><span className="badge">{account.length}</span></div>
      {account.length === 0
        ? <div className="empty">Nothing entered yet. Add reach and profile visits from your Insights screen below.</div>
        : <div className="table-wrap"><table>
            <thead><tr><th>Platform</th><th>Captured</th><th>Reach</th><th>Profile visits</th><th>Followers</th><th>Source</th></tr></thead>
            <tbody>{account.map((row) => <tr key={row.platform}>
              <td className="item-title">{row.platform}</td>
              <td className="item-meta">{row.capturedAt}</td>
              <td className="mono">{row.reach}</td>
              <td className="mono">{row.profileVisits}</td>
              <td className="mono">{row.followers}</td>
              <td><span className="badge">{row.source}</span></td>
            </tr>)}</tbody>
          </table></div>}
    </section>
    <div className="grid grid-2 section">
      <div className="card"><h2 className="display card-title">What converts</h2>{converts.length === 0 ? <div className="empty">Attribution needs conversion data mapped to content IDs.</div> : converts.map((d) => <div className="score-row" key={d.label}><span>{d.label}</span><span className="progress"><span style={{ width: `${d.weight}%` }}/></span><span className="score-number">{d.value}</span></div>)}</div>
      <div className="card"><h2 className="display card-title">Language signal</h2><div className="note" style={{ marginTop: 16 }}>{languageNote}</div></div>
    </div>
    <section className="section"><AccountMetricsForm/></section>
  </>;
}
