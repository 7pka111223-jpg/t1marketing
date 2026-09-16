import Link from "next/link";
import { ArrowRight, CheckCircle2, CircleDashed, Clock3 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatusBadge } from "@/components/status-badge";
import { getApprovalQueue, getDashboardMetrics, getWeekPlan } from "@/lib/data/marketing";

export default async function CommandCenter() {
  const [metrics, queue, week] = await Promise.all([getDashboardMetrics(), getApprovalQueue(), getWeekPlan()]);
  return <>
    <PageHeader title="Command Center" copy="Run the week from one screen. Approve what matters; let the system handle the repetitive work." action={<Link href="/approvals" className="btn btn-primary">Review queue <ArrowRight size={15}/></Link>} />
    <div className="grid grid-4">{metrics.map((m) => <div className="stat-card" key={m.label}><div className="stat-label">{m.label}</div><div className="display stat-value">{m.value}</div>{m.delta && <div className="stat-delta">{m.delta}</div>}</div>)}</div>
    <div className="grid grid-2 section">
      <section className="card">
        <div className="card-head"><h2 className="display card-title">Needs You</h2><span className="badge badge-red">{queue.length} pending</span></div>
        {queue.length === 0 ? <div className="empty">Queue clear. Nothing is waiting on approval.</div> : queue.map((item) => <div className="queue-item" key={item.id}><div className="thumb"><span className="display">{item.type === "Reel" ? "9:16" : "4:5"}</span></div><div><div className="item-title">{item.title}</div><div className="item-meta">{item.type} · {item.objective} · {item.assets} source assets</div></div><div className="actions"><StatusBadge value={`${item.stage}_REVIEW`}/><Link className="btn btn-secondary" href="/approvals">Review</Link></div></div>)}
      </section>
      <section className="card card-dark">
        <div className="card-head"><h2 className="display card-title">This Week</h2><span className="badge badge-red">{week.length} planned</span></div>
        {week.length === 0 ? <div className="note">Nothing scheduled yet. Approve a brief to start the week.</div> : week.map((item) => <div key={`${item.day}-${item.title}`} style={{ display: "grid", gridTemplateColumns: "48px 1fr auto", gap: 12, padding: "14px 0", borderBottom: "1px solid #262626", alignItems: "center" }}><strong className="mono" style={{ color: "#a3a3a3" }}>{item.day}</strong><div><div style={{ fontWeight: 800 }}>{item.title}</div><div style={{ color: "#a3a3a3", fontSize: 12 }}>{item.type}</div></div>{item.state === "approved" ? <CheckCircle2 size={18} color="#16a34a"/> : item.state === "review" ? <Clock3 size={18} color="#f59e0b"/> : <CircleDashed size={18} color="#737373"/>}</div>)}
      </section>
    </div>
    <section className="section">
      <h2 className="display section-title">Operating Loop</h2>
      <div className="grid grid-4">{[["01","Research","Detect signals, questions and opportunities."],["02","Create","Turn approved ideas into copy and creative."],["03","Publish","Final approval gates every public action."],["04","Learn","Tie performance back to app signups and memberships."]].map(([n,t,c])=><div className="card" key={n}><div className="mono" style={{ color: "#e10600", fontWeight: 800 }}>{n}</div><h3 className="display" style={{ fontSize: 30, margin: "12px 0 8px" }}>{t}</h3><div style={{ color: "#525252", lineHeight: 1.5, fontSize: 13 }}>{c}</div></div>)}</div>
    </section>
  </>;
}
