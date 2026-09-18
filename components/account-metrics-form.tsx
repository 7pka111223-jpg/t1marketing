"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

export function AccountMetricsForm() {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    setBusy(true);
    try {
      const response = await fetch("/api/metrics/account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          platform: String(data.get("platform") ?? "INSTAGRAM"),
          reach: String(data.get("reach") ?? ""),
          profileVisits: String(data.get("profileVisits") ?? ""),
          followers: String(data.get("followers") ?? ""),
          views: String(data.get("views") ?? ""),
          likes: String(data.get("likes") ?? ""),
          comments: String(data.get("comments") ?? ""),
          shares: String(data.get("shares") ?? ""),
          saves: String(data.get("saves") ?? ""),
        }),
      });
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Could not save the numbers.", "error");
        return;
      }
      push("Account numbers saved.", "success");
      form.reset();
      router.refresh();
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(false);
    }
  }

  return <form className="card" onSubmit={submit}>
    <div className="card-head"><h2 className="display card-title">Enter weekly numbers</h2></div>
    <div className="note" style={{ marginBottom: 16 }}>Reach and profile visits are private to your account — read them off the Insights screen in the Instagram or TikTok app. Leave a field blank to keep its previous value; only the fields you fill in are updated.</div>
    <div className="grid grid-3">
      <div className="form-row"><label>Platform</label><select name="platform" defaultValue="INSTAGRAM"><option value="INSTAGRAM">Instagram</option><option value="TIKTOK">TikTok</option></select></div>
      <div className="form-row"><label>Reach</label><input name="reach" type="number" min="0" placeholder="0"/></div>
      <div className="form-row"><label>Profile visits</label><input name="profileVisits" type="number" min="0" placeholder="0"/></div>
      <div className="form-row"><label>Followers</label><input name="followers" type="number" min="0" placeholder="0"/></div>
      <div className="form-row"><label>Views</label><input name="views" type="number" min="0" placeholder="0"/></div>
      <div className="form-row"><label>Likes</label><input name="likes" type="number" min="0" placeholder="0"/></div>
      <div className="form-row"><label>Comments</label><input name="comments" type="number" min="0" placeholder="0"/></div>
      <div className="form-row"><label>Shares</label><input name="shares" type="number" min="0" placeholder="0"/></div>
      <div className="form-row"><label>Saves</label><input name="saves" type="number" min="0" placeholder="0"/></div>
    </div>
    <div className="actions" style={{ justifyContent: "flex-start" }}><button className="btn btn-primary" disabled={busy}>{busy ? "Saving" : "Save numbers"}</button></div>
  </form>;
}
