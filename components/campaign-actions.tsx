"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { nextCampaignStatuses } from "@/lib/marketing/campaign-status";

const LABELS: Record<string, string> = {
  ACTIVE: "Activate",
  PAUSED: "Pause",
  COMPLETED: "Complete",
  ARCHIVED: "Archive",
};

export function CampaignActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState<string | null>(null);

  const next = nextCampaignStatuses(status);
  if (next.length === 0) return <span className="item-meta">Archived</span>;

  async function move(target: string) {
    setBusy(target);
    try {
      const response = await fetch(`/api/campaigns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: target }),
      });
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Could not update the campaign.", "error");
        return;
      }
      push(`Campaign moved to ${target.toLowerCase()}.`, "success");
      router.refresh();
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(null);
    }
  }

  return <div className="actions">{next.map((target) => <button key={target} className="btn btn-secondary" disabled={busy !== null} onClick={() => move(target)}>{busy === target ? "Saving" : LABELS[target] ?? target}</button>)}</div>;
}
