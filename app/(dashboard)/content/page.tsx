import { PageHeader } from "@/components/page-header";
import { NewContentButton } from "@/components/new-content-dialog";
import { StatusBadge } from "@/components/status-badge";
import { getCampaigns, getContentBoard } from "@/lib/data/marketing";
import { contentProgress } from "@/lib/marketing/pipeline";

export default async function ContentPage(){
  const [contentColumns, campaigns] = await Promise.all([getContentBoard(), getCampaigns()]);
  const campaignOptions = campaigns.filter((campaign) => campaign.status !== "ARCHIVED").map((campaign) => ({ id: campaign.id, name: campaign.name }));
  return <>
  <PageHeader title="Content" copy="Move ideas through briefs, copy, creative and approval without losing version history." action={<NewContentButton campaigns={campaignOptions}/>}/>
  <div className="kanban">{contentColumns.map((col)=><section className="kanban-col" key={col.title}><div className="kanban-head"><div className="kanban-title">{col.title}</div><span className="badge">{col.items.length}</span></div>{col.items.map((item)=><article className="kanban-card" key={item.id}><span className="badge badge-dark">{item.type}</span><h4>{item.title}</h4><div style={{ marginTop: 12 }}><div className="progress"><span style={{ width: `${contentProgress(item.status)}%` }}/></div><div style={{ marginTop: 8 }}><StatusBadge value={item.status}/></div></div></article>)}</section>)}</div>
</> }
