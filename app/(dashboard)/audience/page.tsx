import { PageHeader } from "@/components/page-header";
import { getAudience } from "@/lib/data/marketing";

export default async function AudiencePage() {
  const { stats, rows } = await getAudience();
  return <>
    <PageHeader title="Audience" copy="Turn recurring DMs and questions into content signals. DM replies stay human-approved in V1."/>
    <div className="grid grid-3">{stats.map((s) => <div className="stat-card" key={s.label}><div className="stat-label">{s.label}</div><div className="display stat-value">{s.value}</div></div>)}</div>
    <section className="section table-wrap"><table><thead><tr><th>Signal</th><th>Category</th><th>Count</th><th>Momentum</th><th>Recommendation</th></tr></thead><tbody>{rows.length === 0 ? <tr><td colSpan={5}><div className="empty">No audience signals captured yet.</div></td></tr> : rows.map((r) => <tr key={`${r.signal}-${r.category}`}><td>{r.signal}</td><td>{r.category}</td><td>{r.count}</td><td><span className="badge badge-success">{r.momentum}</span></td><td>{r.recommendation}</td></tr>)}</tbody></table></section>
  </>;
}
