"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useToast } from "@/components/toast";

export function NewCampaignButton() {
  const router = useRouter();
  const { push } = useToast();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    try {
      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: String(data.get("name") ?? ""),
          objective: String(data.get("objective") ?? "BRAND_AWARENESS"),
          startsAt: String(data.get("startsAt") ?? ""),
          endsAt: String(data.get("endsAt") ?? ""),
        }),
      });
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Could not create the campaign.", "error");
        return;
      }
      push("Campaign created as a draft.", "success");
      form.reset();
      setOpen(false);
      router.refresh();
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(false);
    }
  }

  return <>
    <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={15}/>New campaign</button>
    {open && <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <form className="modal-card" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <div className="card-head"><h2 className="display card-title">New campaign</h2><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} aria-label="Close"><X size={16}/></button></div>
        <div className="form-row"><label>Name</label><input name="name" required placeholder="e.g. New Cairo Beginners"/></div>
        <div className="form-row"><label>Objective</label><select name="objective" defaultValue="BRAND_AWARENESS"><option value="BRAND_AWARENESS">Brand awareness</option><option value="MEMBERSHIPS">Memberships</option><option value="BOTH">Both</option></select></div>
        <div className="form-row"><label>Starts</label><input type="date" name="startsAt"/></div>
        <div className="form-row"><label>Ends</label><input type="date" name="endsAt"/></div>
        <div className="actions" style={{ justifyContent: "flex-end" }}><button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Creating" : "Create"}</button></div>
      </form>
    </div>}
  </>;
}
