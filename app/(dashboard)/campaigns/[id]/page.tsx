import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { CampaignActions } from "@/components/campaign-actions";
import { StatusBadge } from "@/components/status-badge";
import { getCampaignDetail } from "@/lib/data/marketing";

export default async function CampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const campaign = await getCampaignDetail(id);
  if (!campaign) notFound();

  const noOutcome = campaign.conversions.every((driver) => driver.value === 0);

  return <>
    <div style={{ marginBottom: 18 }}><Link className="eyebrow" href="/campaigns">← All campaigns</Link></div>
    <PageHeader title={campaign.name} copy={`${campaign.objective} · ${campaign.window} · utm_campaign=${campaign.slug || "unset"}`} action={<CampaignActions id={campaign.id} status={campaign.status}/>}/>
    <div className="grid grid-4">{campaign.metrics.map((metric) => <div className="stat-card" key={metric.label}><div className="stat-label">{metric.label}</div><div className="display stat-value">{metric.value}</div></div>)}</div>
    <div className="grid grid-2 section">
      <div className="card">
        <div className="card-head"><h2 className="display card-title">Attributed outcome</h2><StatusBadge value={campaign.status}/></div>
        {noOutcome
          ? <div className="empty">No attributed conversions yet. Send <span className="mono">utm_campaign={campaign.slug || "…"}</span> with app events to fill this in.</div>
          : campaign.conversions.map((driver) => <div className="score-row" key={driver.label}><span>{driver.label}</span><span className="progress"><span style={{ width: `${driver.weight}%` }}/></span><span className="score-number">{driver.value}</span></div>)}
      </div>
      <div className="card">
        <div className="card-head"><h2 className="display card-title">Linked content</h2><span className="badge">{campaign.content.length}</span></div>
        {campaign.content.length === 0
          ? <div className="empty">No content linked yet. Create content against this campaign from the Content board.</div>
          : campaign.content.map((item) => <div className="queue-item" key={item.id}>
              <div className="thumb"/>
              <div><div className="item-title">{item.title}</div><div className="item-meta">{item.type}</div></div>
              <StatusBadge value={item.status}/>
            </div>)}
      </div>
    </div>
  </>;
}
