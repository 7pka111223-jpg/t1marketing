"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { ApprovalItem, ApprovalDecision } from "@/lib/types";
import { Check, Pencil, RefreshCw, X } from "lucide-react";

const targets = ["Hook", "Script", "Caption", "Arabic", "Footage", "Edit", "CTA", "Entire item"];

export function ApprovalWorkspace({ initial }: { initial: ApprovalItem[] }) {
  const router = useRouter();
  const [items, setItems] = useState(initial);
  const [activeId, setActiveId] = useState(initial[0]?.id);
  const [target, setTarget] = useState("Hook");
  const [lastAction, setLastAction] = useState<string | null>(null);
  const active = useMemo(() => items.find((x) => x.id === activeId) ?? items[0], [items, activeId]);

  if (!active) return <div className="card empty">Approval queue cleared.</div>;

  async function decide(decision: ApprovalDecision) {
    setLastAction(`${decision}${decision === "RELOOP" ? ` · ${target}` : ""}`);
    try {
      const response = await fetch(`/api/approvals/${active.id}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ decision, reloopTarget: decision === "RELOOP" ? target : null }) });
      if (!response.ok) {
        const detail = await response.json().catch(() => null);
        setLastAction(`${decision} failed${detail?.error ? `: ${detail.error}` : ""}`);
        return;
      }
    } catch { /* demo mode stays local */ }
    if (decision === "APPROVE" || decision === "REJECT") {
      const next = items.filter((x) => x.id !== active.id);
      setItems(next);
      setActiveId(next[0]?.id);
    }
    router.refresh();
  }

  return <>
    <div style={{ display: "flex", gap: 8, marginBottom: 14, overflowX: "auto" }}>
      {items.map((item) => <button key={item.id} className={`btn ${item.id === active.id ? "btn-dark" : "btn-secondary"}`} onClick={() => setActiveId(item.id)}>{item.type} · {item.title}</button>)}
    </div>
    {lastAction && <div className="note" style={{ marginBottom: 14 }}>Last action: <strong>{lastAction}</strong>. In demo mode this is local; with Supabase configured it is stored in the approval audit trail.</div>}
    <div className="approval-layout">
      <div className="preview">
        <div className="preview-inner">
          <div className="preview-kicker">{active.type} · {active.objective}</div>
          <h2 className="display preview-title">{active.hook}</h2>
          <div className="preview-copy">{active.type === "Reel" ? `${active.assets} TripleOne source clips selected` : "Brand template preview"}</div>
        </div>
      </div>
      <div className="card review-panel">
        <div className="review-block"><div className="review-label">Stage</div><span className="badge badge-red">{active.stage} review</span></div>
        <div className="review-block"><div className="review-label">Audience</div><div className="review-value">{active.audience}</div></div>
        <div className="review-block"><div className="review-label">Language</div><div className="review-value">{active.language}</div></div>
        <div className="review-block"><div className="review-label">Caption</div><div className="review-value">{active.caption}</div></div>
        <div className="review-block"><div className="review-label">Performance hypothesis</div><div className="review-value">{active.hypothesis}</div></div>
        <div className="review-block">
          <div className="review-label">Reloop only what needs work</div>
          <div className="reloop-grid">{targets.map((t) => <button key={t} onClick={() => setTarget(t)} className={`reloop-choice ${target === t ? "selected" : ""}`}>{t}</button>)}</div>
        </div>
        <div className="review-block actions" style={{ justifyContent: "flex-start" }}>
          <button className="btn btn-primary" onClick={() => decide("APPROVE")}><Check size={15}/>Approve</button>
          <button className="btn btn-secondary" onClick={() => decide("EDIT")}><Pencil size={15}/>Edit</button>
          <button className="btn btn-dark" onClick={() => decide("RELOOP")}><RefreshCw size={15}/>Reloop</button>
          <button className="btn btn-danger" onClick={() => decide("REJECT")}><X size={15}/>Reject</button>
        </div>
      </div>
    </div>
  </>;
}
