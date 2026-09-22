"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast";
import { FRAME_SHAPES, SCENE_PRESETS, findFrameShape } from "@/lib/fancam/models";
import { estimateFanCamCost } from "@/lib/fancam/cost";
import type { FanCamJob, PortraitAsset, VideoBudget } from "@/lib/types";

const STAGE_COPY: Record<string, string> = {
  PLANNED: "Planning",
  EDITING: "Building the frame",
  SUBMITTING_VIDEO: "Frame ready, queuing clip",
  RENDERING: "Animating",
  COMPLETED: "Done",
  FAILED: "Failed",
};

export function FanCamStudio({
  jobs,
  portraits,
  budget,
  imageModel,
  videoModel,
  configured,
}: {
  jobs: FanCamJob[];
  portraits: PortraitAsset[];
  budget: VideoBudget;
  imageModel: string;
  videoModel: string;
  configured: boolean;
}) {
  const router = useRouter();
  const { push } = useToast();
  const [portraitAssetId, setPortraitAssetId] = useState(portraits[0]?.id ?? "");
  const [event, setEvent] = useState("");
  const [reaction, setReaction] = useState("");
  const [presetId, setPresetId] = useState(SCENE_PRESETS[0].id);
  const [customScene, setCustomScene] = useState("");
  const [frame, setFrame] = useState(FRAME_SHAPES[0].id);
  const [durationSeconds, setDurationSeconds] = useState(5);
  const [withAudio, setWithAudio] = useState(false);
  const [likenessConsent, setLikenessConsent] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);

  const cost = estimateFanCamCost({ imageModelId: imageModel, videoModelId: videoModel, durationSeconds, withAudio });
  const estimate = cost?.totalUsd ?? 0;
  const overBudget = estimate > budget.remainingUsd;
  const noPortraits = portraits.length === 0;
  const blocked = !likenessConsent || overBudget || noPortraits || !portraitAssetId;

  async function submit(formEvent: FormEvent<HTMLFormElement>) {
    formEvent.preventDefault();
    setBusy("submit");
    try {
      const response = await fetch("/api/fancam/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          portraitAssetId,
          event,
          reaction,
          presetId,
          customScene,
          frame,
          durationSeconds,
          withAudio,
          likenessConsent,
        }),
      });
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Could not queue the fan cam.", "error");
        return;
      }
      push(
        detail?.demo
          ? `Demo: this fan cam would cost $${estimate.toFixed(2)}.`
          : `Queued at $${estimate.toFixed(2)} — the frame builds first, then the clip.`,
        "success",
      );
      setEvent("");
      setReaction("");
      setLikenessConsent(false);
      router.refresh();
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(null);
    }
  }

  async function advance(job: FanCamJob) {
    setBusy(`job:${job.id}`);
    try {
      const response = await fetch(`/api/fancam/${job.id}`, { method: "POST" });
      const detail = await response.json().catch(() => null);
      if (!response.ok) {
        push(detail?.error ?? "Could not check the fan cam.", "error");
        return;
      }
      const stage = String(detail?.stage ?? "");
      push(
        stage === "COMPLETED"
          ? "Fan cam finished and saved to the asset library, uncleared."
          : `Now ${STAGE_COPY[stage] ?? stage.toLowerCase() ?? "running"}.`,
        stage === "FAILED" ? "error" : "success",
      );
      router.refresh();
    } catch {
      push("Could not reach the server.", "error");
    } finally {
      setBusy(null);
    }
  }

  return <section className="card section">
    <div className="card-head">
      <div>
        <div className="eyebrow">Fan cam</div>
        <h2 className="display card-title" style={{ marginTop: 6 }}>Put a member in the crowd</h2>
      </div>
      <span className="badge">${budget.remainingUsd.toFixed(2)} left of ${budget.capUsd.toFixed(2)}</span>
    </div>

    <div className="note" style={{ marginBottom: 16 }}>
      A cleared photo becomes a spectator in a scene that never happened: a planner writes the shot, an
      image model composites the face into one frame, then a video model animates it. It draws on the
      <strong> same monthly video budget</strong> as plain generation, and the clip lands in the asset
      library <strong>uncleared</strong> until a human clears it.
    </div>

    {!configured && <div className="note" style={{ marginBottom: 16 }}>Needs <code>FAL_KEY</code> and <code>OPENROUTER_API_KEY</code> before it can run live.</div>}
    {noPortraits && <div className="note" style={{ marginBottom: 16 }}>No consent-cleared photos yet. Upload one through <strong>Asset intake</strong> above — the clearance checkbox there is what makes a photo eligible.</div>}

    <form onSubmit={submit}>
      <div className="grid grid-2">
        <div className="form-row">
          <label>Whose face</label>
          <select value={portraitAssetId} onChange={(element) => setPortraitAssetId(element.target.value)} disabled={noPortraits}>
            {portraits.map((portrait) => <option value={portrait.id} key={portrait.id}>{portrait.name} · {portrait.uploadedAt}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label>Scene</label>
          <select value={presetId} onChange={(element) => setPresetId(element.target.value)}>
            {SCENE_PRESETS.map((preset) => <option value={preset.id} key={preset.id}>{preset.label}</option>)}
          </select>
        </div>
      </div>

      <div className="form-row">
        <label>Event</label>
        <input value={event} onChange={(element) => setEvent(element.target.value)} placeholder="e.g. the national street workout final, last rep of the night" required minLength={8}/>
      </div>
      <div className="form-row">
        <label>Reaction or situation</label>
        <input value={reaction} onChange={(element) => setReaction(element.target.value)} placeholder="e.g. on their feet, both arms up, shouting" required minLength={4}/>
      </div>
      <div className="form-row">
        <label>Override the scene (optional)</label>
        <textarea value={customScene} onChange={(element) => setCustomScene(element.target.value)} placeholder="Leave empty to use the preset above. Anything written here replaces it."/>
      </div>

      <div className="grid grid-3">
        <div className="form-row">
          <label>Frame</label>
          <select value={frame} onChange={(element) => setFrame(element.target.value as typeof frame)}>
            {FRAME_SHAPES.map((shape) => <option value={shape.id} key={shape.id}>{shape.label} · {shape.ratio}</option>)}
          </select>
        </div>
        <div className="form-row">
          <label>Seconds</label>
          <select value={durationSeconds} onChange={(element) => setDurationSeconds(Number(element.target.value))}>
            <option value={5}>5s</option>
            <option value={10}>10s</option>
          </select>
        </div>
        <div className="form-row">
          <label>Audio</label>
          <select value={withAudio ? "on" : "off"} onChange={(element) => setWithAudio(element.target.value === "on")}>
            <option value="off">Off — cheaper</option>
            <option value="on">On — crowd noise</option>
          </select>
        </div>
      </div>

      <label style={{ display: "flex", alignItems: "flex-start", gap: 10, textTransform: "none", letterSpacing: 0, fontSize: 13, fontWeight: 600, color: "#404040", marginBottom: 14 }}>
        <input style={{ width: 18, minHeight: 18, marginTop: 1 }} type="checkbox" checked={likenessConsent} onChange={(element) => setLikenessConsent(element.target.checked)}/>
        <span>This person has agreed to have their likeness placed in a <strong>generated scene they were never at</strong>. Marketing clearance on the photo is not the same permission.</span>
      </label>

      <div className="actions" style={{ justifyContent: "flex-start", alignItems: "center" }}>
        <span className="mono" style={{ fontSize: 13 }}>
          Estimated ${estimate.toFixed(2)}
          {cost && ` · frame $${cost.imageUsd.toFixed(2)} + clip $${cost.videoUsd.toFixed(2)}`}
        </span>
        <button className="btn btn-primary" disabled={busy !== null || blocked}>{busy === "submit" ? "Queuing" : "Build fan cam"}</button>
        {overBudget && <span className="item-meta">Over the remaining ${budget.remainingUsd.toFixed(2)} budget.</span>}
        {!likenessConsent && !overBudget && <span className="item-meta">Confirm the likeness checkbox.</span>}
      </div>
    </form>

    {jobs.length > 0 && <div className="table-wrap" style={{ marginTop: 20 }}><table>
      <thead><tr><th>Created</th><th>Stage</th><th>Event</th><th>Frame</th><th>Cost</th><th/></tr></thead>
      <tbody>{jobs.map((job) => <tr key={job.id}>
        <td className="item-meta">{job.createdAt}</td>
        <td><span className="badge">{job.error ?? STAGE_COPY[job.stage] ?? job.stage}</span></td>
        <td>
          {job.event || "—"}
          {job.caption && <div className="item-meta" style={{ marginTop: 6 }}>{job.caption}</div>}
        </td>
        <td className="item-meta">{job.frameRatio} · {job.duration ?? "—"}s</td>
        <td className="mono">${job.costUsd.toFixed(2)}</td>
        <td>{job.status !== "COMPLETED" && job.status !== "FAILED" && <button type="button" className="btn btn-ghost" onClick={() => advance(job)} disabled={busy !== null}>Check status</button>}</td>
      </tr>)}</tbody>
    </table></div>}

    <div className="item-meta" style={{ marginTop: 16 }}>
      Frame: {findFrameShape(frame).label} · Models: {imageModel} → {videoModel}
    </div>
  </section>;
}
