"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

export function SyncMetricsButton() {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);

  async function sync() {
    setBusy(true);
    try {
      const response = await fetch("/api/metrics/sync", { method: "POST" });
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Metrics sync failed.", "error");
        return;
      }
      if (detail?.status === "no-published-posts") {
        push("No published posts to sync yet.", "success");
      } else {
        push(`Captured ${detail?.captured ?? 0} snapshots (${detail?.live ?? 0} with live platform data).`, "success");
      }
      router.refresh();
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(false);
    }
  }

  return <button className="btn btn-dark" onClick={sync} disabled={busy}>{busy ? "Syncing" : "Sync metrics"}</button>;
}
