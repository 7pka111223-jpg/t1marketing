import { PageHeader } from "@/components/page-header";
import { OpportunityActions } from "@/components/opportunity-actions";
import { ScanButton } from "@/components/scan-button";
import { getOpportunities } from "@/lib/data/marketing";

export default async function ResearchPage(){ const opportunities = await getOpportunities(); return <>
  <PageHeader title="Research" copy="Signals become ranked content opportunities. The score favors New Cairo relevance, audience fit, membership intent and footage you already own." action={<ScanButton/>}/>
  <div className="grid grid-4" style={{ marginBottom: 24 }}>
    {[[String(opportunities.length),'Opportunities'],[String(opportunities.filter(x=>x.score>=80).length),'High-opportunity'],[String(opportunities.reduce((a,x)=>a+x.assets,0)),'Matched assets'],[opportunities.length ? String(Math.round(opportunities.reduce((a,x)=>a+x.score,0)/opportunities.length)) : '0','Avg score']].map(([v,l])=><div className="stat-card" key={l}><div className="stat-label">{l}</div><div className="display stat-value">{v}</div></div>)}
  </div>
  {opportunities.map((o)=><article className="opportunity" key={o.id}>
    <div className="big-score display">{o.score}</div>
    <div><div className="eyebrow">Recommended {o.format} · {o.language}</div><h2 className="display op-title">{o.title}</h2><div className="op-copy">{o.reason}</div><div style={{ marginTop: 9 }}><span className="badge badge-dark">{o.assets} assets available</span></div></div>
    <div className="scores-mini">{Object.entries(o.scores).slice(0,4).map(([k,v])=><div className="score-row" key={k} style={{ gridTemplateColumns: "78px 1fr 28px" }}><span className="score-label">{k}</span><span className="progress"><span style={{ width: `${v}%` }}/></span><span className="score-number">{v}</span></div>)}</div>
    <OpportunityActions id={o.id}/>
  </article>)}
</> }
