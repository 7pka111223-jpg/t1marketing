import { PageHeader } from "@/components/page-header";
import { NewContentButton } from "@/components/new-content-dialog";
import { getContentBoard } from "@/lib/data/marketing";

export default async function ContentPage(){ const contentColumns = await getContentBoard(); return <>
  <PageHeader title="Content" copy="Move ideas through briefs, copy, creative and approval without losing version history." action={<NewContentButton/>}/>
  <div className="kanban">{contentColumns.map((col)=><section className="kanban-col" key={col.title}><div className="kanban-head"><div className="kanban-title">{col.title}</div><span className="badge">{col.items.length}</span></div>{col.items.map((item,i)=><article className="kanban-card" key={item.id}><span className="badge badge-dark">{item.type}</span><h4>{item.title}</h4><div style={{ marginTop: 12 }}><div className="progress"><span style={{ width: `${Math.min(96, 35 + i*12)}%` }}/></div></div></article>)}</section>)}</div>
</> }
