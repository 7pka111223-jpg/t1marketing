"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { useToast } from "@/components/toast";
import type { CampaignOption } from "@/lib/types";

export function NewContentButton({ campaigns = [] }: { campaigns?: CampaignOption[] }) {
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
      const response = await fetch("/api/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: String(data.get("title") ?? ""),
          contentType: String(data.get("contentType") ?? "REEL"),
          pillar: String(data.get("pillar") ?? "EDUCATION"),
          objective: String(data.get("objective") ?? "BRAND_AWARENESS"),
          languageMode: String(data.get("languageMode") ?? "MIXED"),
          campaignId: String(data.get("campaignId") ?? ""),
        }),
      });
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Could not create content.", "error");
        return;
      }
      push("Content item created in the Ideas column.", "success");
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
    <button className="btn btn-primary" onClick={() => setOpen(true)}><Plus size={15}/>New content</button>
    {open && <div className="modal-backdrop" onClick={() => setOpen(false)}>
      <form className="modal-card" onClick={(event) => event.stopPropagation()} onSubmit={submit}>
        <div className="card-head"><h2 className="display card-title">New content</h2><button type="button" className="btn btn-ghost" onClick={() => setOpen(false)} aria-label="Close"><X size={16}/></button></div>
        <div className="form-row"><label>Title</label><input name="title" required placeholder="e.g. First Pull-Up breakdown"/></div>
        <div className="form-row"><label>Format</label><select name="contentType" defaultValue="REEL"><option value="REEL">Reel</option><option value="CAROUSEL">Carousel</option><option value="STORY">Story</option><option value="STATIC">Static</option></select></div>
        <div className="form-row"><label>Pillar</label><select name="pillar" defaultValue="EDUCATION"><option value="EDUCATION">Education</option><option value="COMMUNITY">Community</option><option value="CULTURE">Culture</option><option value="CHALLENGE">Challenge</option><option value="CONVERSION">Conversion</option></select></div>
        <div className="form-row"><label>Objective</label><select name="objective" defaultValue="BRAND_AWARENESS"><option value="BRAND_AWARENESS">Brand awareness</option><option value="MEMBERSHIPS">Memberships</option><option value="BOTH">Both</option></select></div>
        <div className="form-row"><label>Language</label><select name="languageMode" defaultValue="MIXED"><option value="MIXED">Mixed (AR-EG + EN)</option><option value="AR_EG">Egyptian Arabic</option><option value="EN">English</option></select></div>
        {campaigns.length > 0 && <div className="form-row"><label>Campaign</label><select name="campaignId" defaultValue=""><option value="">No campaign</option>{campaigns.map((campaign) => <option value={campaign.id} key={campaign.id}>{campaign.name}</option>)}</select></div>}
        <div className="actions" style={{ justifyContent: "flex-end" }}><button type="button" className="btn btn-secondary" onClick={() => setOpen(false)}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? "Creating" : "Create"}</button></div>
      </form>
    </div>}
  </>;
}
