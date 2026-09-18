"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { VIDEO_MODELS, findVideoModel } from "@/lib/video/models";
import { estimateVideoCost } from "@/lib/video/cost";
import { mentionsPeople } from "@/lib/video/people-guard";
import type { VideoBudget, VideoGeneration } from "@/lib/types";

export function VideoGenerator({ jobs, budget }: { jobs: VideoGeneration[]; budget: VideoBudget }) {
  const router = useRouter();
  const { push } = useToast();
  const [modelId, setModelId] = useState(VIDEO_MODELS[0].id);
  const [duration, setDuration] = useState(VIDEO_MODELS[0].durations[0]);
  const [resolution, setResolution] = useState(VIDEO_MODELS[0].resolutions[0]);
  const [aspectRatio, setAspectRatio] = useState("9:16");
  const [prompt, setPrompt] = useState("");
  const [allowPeople, setAllowPeople] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const model = findVideoModel(modelId) ?? VIDEO_MODELS[0];
  const estimate = estimateVideoCost(modelId, { duration, resolution }) ?? 0;
  const overBudget = estimate > budget.remainingUsd;
  const needsConfirmation = mentionsPeople(prompt) && !allowPeople;

  function switchModel(nextId: string) {
    const next = findVideoModel(nextId);
    setModelId(nextId);
    if (!next) return;
    setResolution(next.resolutions[0]);
    if (!next.durations.includes(duration)) setDuration(next.durations[0]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy("submit");
    try {
      const response = await fetch("/api/video/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, modelId, duration, resolution, aspectRatio, allowPeople }),
      });
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Could not queue the clip.", "error");
        return;
      }
      push(detail?.demo ? `Demo: this clip would cost $${estimate.toFixed(2)}.` : `Queued at $${estimate.toFixed(2)} — generation takes a few minutes.`, "success");
      setPrompt("");
      router.refresh();
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function check(job: VideoGeneration) {
    setBusy(`job:${job.id}`);
    try {
      const response = await fetch(`/api/video/${job.id}`, { method: "POST" });
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Could not check the job.", "error");
        return;
      }
      push(detail?.status === "COMPLETED" ? "Clip finished and saved to the asset library." : `Still ${detail?.status ?? "running"}.`, "success");
      router.refresh();
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(null);
    }
  }

  return <section className="card section">
    <div className="card-head">
      <h2 className="display card-title">AI video</h2>
      <span className="badge">${budget.remainingUsd.toFixed(2)} left of ${budget.capUsd.toFixed(2)}</span>
    </div>
    <div className="note" style={{ marginBottom: 16 }}>Generated clips land in the asset library <strong>uncleared</strong> — a human has to clear them before they can be used. The monthly cap is enforced before anything is submitted.</div>

    <form onSubmit={submit}>
      <div className="form-row">
        <label>Prompt</label>
        <textarea value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="e.g. branded motion graphics — the TripleOne wordmark assembling over chalk dust in a shaft of light" required minLength={10}/>
      </div>
      <div className="grid grid-3">
        <div className="form-row"><label>Model</label><select value={modelId} onChange={(event) => switchModel(event.target.value)}>{VIDEO_MODELS.map((item) => <option value={item.id} key={item.id}>{item.label}</option>)}</select></div>
        <div className="form-row"><label>Seconds</label><select value={duration} onChange={(event) => setDuration(Number(event.target.value))}>{model.durations.map((value) => <option value={value} key={value}>{value}s</option>)}</select></div>
        <div className="form-row"><label>Resolution</label><select value={resolution} onChange={(event) => setResolution(event.target.value)}>{model.resolutions.map((value) => <option value={value} key={value}>{value}</option>)}</select></div>
        <div className="form-row"><label>Aspect ratio</label><select value={aspectRatio} onChange={(event) => setAspectRatio(event.target.value)}>{model.aspectRatios.map((value) => <option value={value} key={value}>{value}</option>)}</select></div>
      </div>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, textTransform: "none", letterSpacing: 0, fontSize: 13, fontWeight: 600, color: "#404040", marginBottom: 14 }}>
        <input style={{ width: 18, minHeight: 18, marginTop: 1 }} type="checkbox" checked={allowPeople} onChange={(event) => setAllowPeople(event.target.checked)}/>
        <span>This clip should <strong>generate people</strong>. TripleOne&apos;s brand rules prefer real footage of real athletes, so confirm this deliberately.</span>
      </label>

      <div className="actions" style={{ justifyContent: "flex-start", alignItems: "center" }}>
        <span className="mono" style={{ fontSize: 13 }}>Estimated ${estimate.toFixed(2)}</span>
        <button className="btn btn-primary" disabled={busy !== null || overBudget || needsConfirmation}>{busy === "submit" ? "Queuing" : "Generate clip"}</button>
        {overBudget && <span className="item-meta">Over the remaining ${budget.remainingUsd.toFixed(2)} budget.</span>}
        {needsConfirmation && <span className="item-meta">Confirm the people checkbox or reword the prompt.</span>}
      </div>
    </form>

    {jobs.length > 0 && <div className="table-wrap" style={{ marginTop: 20 }}><table>
      <thead><tr><th>Created</th><th>Status</th><th>Model</th><th>Clip</th><th>Cost</th><th/></tr></thead>
      <tbody>{jobs.map((job) => <tr key={job.id}>
        <td className="item-meta">{job.createdAt}</td>
        <td><span className="badge">{job.error ?? job.status}</span></td>
        <td>{job.model}</td>
        <td className="item-meta">{job.duration ?? "—"}s · {job.resolution ?? "—"}</td>
        <td className="mono">${job.costUsd.toFixed(2)}</td>
        <td>{job.status !== "COMPLETED" && job.status !== "FAILED" && <button className="btn btn-ghost" onClick={() => check(job)} disabled={busy !== null}>Check status</button>}</td>
      </tr>)}</tbody>
    </table></div>}
  </section>;
}
