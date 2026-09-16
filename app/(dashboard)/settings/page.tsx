import { PageHeader } from "@/components/page-header";
import { connectionStatus } from "@/lib/config";

export default function SettingsPage() {
  return <>
    <PageHeader title="Settings" copy="Connection health, approval rules and budget guardrails."/>
    <div className="grid grid-2">
      <div className="card"><h2 className="display card-title">Connections</h2>{connectionStatus().map((c) => <div className="queue-item" key={c.name} style={{ gridTemplateColumns: "1fr auto" }}><div><div className="item-title">{c.name}</div><div className="item-meta">{c.role}</div></div><span className={`badge ${c.ok ? "badge-success" : ""}`}>{c.state}</span></div>)}</div>
      <div className="card"><h2 className="display card-title">Guardrails</h2><div className="form-row"><label>Monthly incremental budget cap</label><input value="$20" readOnly/></div><div className="form-row"><label>Public publishing</label><select defaultValue="approval"><option value="approval">Always require final approval</option></select></div><div className="form-row"><label>DM replies</label><select defaultValue="approval"><option value="approval">Draft only — human sends</option></select></div><div className="form-row"><label>Primary objectives</label><input value="Brand awareness, memberships" readOnly/></div></div>
    </div>
  </>;
}
