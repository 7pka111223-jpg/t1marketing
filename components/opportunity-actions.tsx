"use client";
import { Bookmark, Plus, X } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";

export function OpportunityActions({ id }: { id: string }) {
  const router = useRouter();
  const { push } = useToast();
  const [state, setState] = useState<"idle" | "creating" | "created">("idle");
  const [busy, setBusy] = useState(false);

  async function create() {
    setState("creating");
    try {
      const response = await fetch(`/api/opportunities/${id}/create`, { method: "POST" });
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Could not create content.", "error");
        setState("idle");
        return;
      }
      setState("created");
      push("Content item created from this opportunity.", "success");
      router.refresh();
    } catch {
      push("Could not reach the server.", "error");
      setState("idle");
    }
  }

  async function update(status: "SAVED" | "IGNORED") {
    setBusy(true);
    try {
      const response = await fetch(`/api/opportunities/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Could not update the opportunity.", "error");
        return;
      }
      push(status === "SAVED" ? "Opportunity saved." : "Opportunity ignored.", "success");
      router.refresh();
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(false);
    }
  }

  return <div className="actions">
    <button className="btn btn-primary" onClick={create} disabled={state !== "idle"}><Plus size={14}/>{state === "created" ? "Created" : state === "creating" ? "Creating" : "Create"}</button>
    <button className="btn btn-secondary" aria-label="Save opportunity" disabled={busy} onClick={() => update("SAVED")}><Bookmark size={14}/></button>
    <button className="btn btn-ghost" aria-label="Ignore opportunity" disabled={busy} onClick={() => update("IGNORED")}><X size={14}/></button>
  </div>;
}
