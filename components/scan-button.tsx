"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

export function ScanButton() {
  const router = useRouter();
  const { push } = useToast();
  const [busy, setBusy] = useState(false);

  async function scan() {
    setBusy(true);
    try {
      const response = await fetch("/api/opportunities/scan", { method: "POST" });
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Signal scan failed.", "error");
        return;
      }
      push(detail?.demo ? "Demo scan complete. Connect the AI gateway for live results." : `Signal scan created ${detail?.created ?? 0} opportunities.`, "success");
      router.refresh();
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(false);
    }
  }

  return <button className="btn btn-dark" onClick={scan} disabled={busy}>{busy ? "Scanning" : "Run signal scan"}</button>;
}
