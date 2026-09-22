import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { downloadFalFile, firstImageUrl, resultFal, statusFal, submitFal, videoUrl } from "@/lib/fal/client";

const BUCKET = "marketing-assets";

// One step per call, so no request ever blocks on a model.
//
//   EDITING   — the composited still frame is rendering on fal
//   RENDERING — the frame is done and the motion pass is rendering
//   COMPLETED — the clip is downloaded into our bucket and indexed as an uncleared asset
//
// The job can be driven by "Check status" in the UI or by a scheduled Trigger task, so the feature
// works whether or not Trigger.dev is deployed.
export async function POST(_request: NextRequest, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, jobId, stage: "COMPLETED", status: "COMPLETED" });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .schema("marketing")
    .from("members")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  const { data: job, error: readError } = await supabase
    .schema("marketing")
    .from("jobs")
    .select("id,status,job_type,cost_estimate_usd,metadata")
    .eq("id", jobId)
    .eq("job_type", "FAN_CAM")
    .maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 400 });
  if (!job) return NextResponse.json({ error: "Fan cam job not found." }, { status: 404 });
  if (job.status === "COMPLETED") return NextResponse.json({ ok: true, status: "COMPLETED", stage: "COMPLETED" });

  const metadata = (job.metadata ?? {}) as Record<string, unknown>;
  const stage = String(metadata.stage ?? "");

  async function fail(message: string) {
    await supabase
      .schema("marketing")
      .from("jobs")
      .update({ status: "FAILED", metadata: { ...metadata, stage: "FAILED", error: message } })
      .eq("id", job!.id);
    return NextResponse.json({ ok: false, status: "FAILED", stage: "FAILED", error: message }, { status: 200 });
  }

  try {
    if (stage === "EDITING") {
      const statusUrl = String(metadata.image_status_url ?? "");
      const responseUrl = String(metadata.image_response_url ?? "");
      if (!statusUrl || !responseUrl) return await fail("The image step has no fal request URLs.");

      const falStatus = await statusFal(statusUrl);
      if (falStatus.status !== "COMPLETED") {
        await supabase.schema("marketing").from("jobs").update({ status: "RUNNING" }).eq("id", job.id);
        return NextResponse.json({ ok: true, status: "RUNNING", stage: "EDITING", falStatus: falStatus.status });
      }

      const result = await resultFal(responseUrl);
      const frameUrl = firstImageUrl(result);
      if (!frameUrl) return await fail("The image edit returned no frame.");

      // Claim the transition before spending. Two concurrent polls — a double-click, or the UI and
      // a Trigger task landing together — would otherwise both submit the motion pass and bill for
      // two clips. Only the call that actually moves the row off EDITING proceeds; the loser
      // returns without spending. SUBMITTING_VIDEO is a resumable state, so a submit that then
      // throws is retried by the next poll rather than stranding the job.
      const claim = await supabase
        .schema("marketing")
        .from("jobs")
        .update({ status: "RUNNING", metadata: { ...metadata, stage: "SUBMITTING_VIDEO", frame_url: frameUrl } })
        .eq("id", job.id)
        .contains("metadata", { stage: "EDITING" })
        .select("id");
      if (claim.error) return await fail(claim.error.message);
      if ((claim.data ?? []).length === 0) {
        return NextResponse.json({ ok: true, status: "RUNNING", stage: "RENDERING", claimed: false });
      }

      return await submitMotionPass(supabase, {
        jobId: job.id,
        userId,
        frameUrl,
        metadata: { ...metadata, stage: "SUBMITTING_VIDEO", frame_url: frameUrl },
      });
    }

    // Resuming after a submit that failed mid-flight: the frame is already rendered and paid for,
    // so the retry starts from the stored frame rather than re-editing the image.
    if (stage === "SUBMITTING_VIDEO") {
      const frameUrl = String(metadata.frame_url ?? "");
      if (!frameUrl) return await fail("The job lost the composited frame before the motion pass.");
      return await submitMotionPass(supabase, { jobId: job.id, userId, frameUrl, metadata });
    }

    if (stage === "RENDERING") {
      const statusUrl = String(metadata.video_status_url ?? "");
      const responseUrl = String(metadata.video_response_url ?? "");
      if (!statusUrl || !responseUrl) return await fail("The video step has no fal request URLs.");

      const falStatus = await statusFal(statusUrl);
      if (falStatus.status !== "COMPLETED") {
        return NextResponse.json({ ok: true, status: "RUNNING", stage: "RENDERING", falStatus: falStatus.status });
      }

      const result = await resultFal(responseUrl);
      const clipUrl = videoUrl(result);
      if (!clipUrl) return await fail("The video pass returned no clip.");

      const assetId = await storeGeneratedAsset(supabase, {
        userId,
        jobId: job.id,
        url: clipUrl,
        kind: "VIDEO",
        extension: "mp4",
        metadata,
      });

      const contentItemId = typeof metadata.content_item_id === "string" ? metadata.content_item_id : null;
      if (contentItemId) {
        const link = await supabase
          .schema("marketing")
          .from("asset_usage")
          .upsert(
            { content_item_id: contentItemId, asset_id: assetId, usage_role: "SOURCE" },
            { onConflict: "content_item_id,asset_id,usage_role", ignoreDuplicates: true },
          );
        if (link.error) console.error("[api:fancam:link]", link.error);
      }

      await supabase
        .schema("marketing")
        .from("jobs")
        .update({
          status: "COMPLETED",
          metadata: { ...metadata, stage: "COMPLETED", asset_id: assetId },
        })
        .eq("id", job.id);

      return NextResponse.json({ ok: true, status: "COMPLETED", stage: "COMPLETED", assetId });
    }

    return NextResponse.json({ error: `Fan cam job is at stage ${stage || "unknown"}.` }, { status: 409 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fan cam step failed.";
    console.error("[api:fancam:step]", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

// Archives the composited frame, then submits the motion pass. Split out because it is reached
// both from a fresh EDITING → RENDERING transition and from resuming a SUBMITTING_VIDEO job.
async function submitMotionPass(
  supabase: Awaited<ReturnType<typeof createClient>>,
  options: { jobId: string; userId: string; frameUrl: string; metadata: Record<string, unknown> },
): Promise<NextResponse> {
  const { metadata } = options;

  // assets.storage_path is unique, so a resumed job must not re-insert the frame it already
  // archived. The id is persisted the moment the archive succeeds, not after the submit, so a
  // submit that throws cannot make the next retry collide on that constraint.
  let frameAssetId = typeof metadata.frame_asset_id === "string" ? metadata.frame_asset_id : null;
  if (!frameAssetId) {
    frameAssetId = await storeGeneratedAsset(supabase, {
      userId: options.userId,
      jobId: options.jobId,
      url: options.frameUrl,
      kind: "PHOTO",
      extension: "jpg",
      metadata,
    });
    metadata.frame_asset_id = frameAssetId;
    await supabase
      .schema("marketing")
      .from("jobs")
      .update({ metadata: { ...metadata } })
      .eq("id", options.jobId);
  }

  const videoInput: Record<string, unknown> = {
    prompt: String(metadata.video_prompt ?? ""),
    start_image_url: options.frameUrl,
    duration: String(metadata.duration ?? 5),
  };
  const negative = String(metadata.negative_prompt ?? "");
  if (negative) videoInput.negative_prompt = negative;
  // Only sent when the operator asked for audio — fal rejects unknown fields on some endpoints.
  if (metadata.with_audio === true) videoInput.generate_audio = true;

  const submission = await submitFal(String(metadata.video_model ?? ""), videoInput);

  await supabase
    .schema("marketing")
    .from("jobs")
    .update({
      status: "RUNNING",
      external_run_id: submission.requestId,
      metadata: {
        ...metadata,
        stage: "RENDERING",
        frame_asset_id: frameAssetId,
        video_request_id: submission.requestId,
        video_status_url: submission.statusUrl,
        video_response_url: submission.responseUrl,
      },
    })
    .eq("id", options.jobId);

  return NextResponse.json({ ok: true, status: "RUNNING", stage: "RENDERING", frameAssetId });
}

// Generated media is never auto-cleared: a human has to clear it before it can be used, exactly as
// with plain video generation.
async function storeGeneratedAsset(
  supabase: Awaited<ReturnType<typeof createClient>>,
  options: {
    userId: string;
    jobId: string;
    url: string;
    kind: "PHOTO" | "VIDEO";
    extension: string;
    metadata: Record<string, unknown>;
  },
): Promise<string> {
  const download = await downloadFalFile(options.url);
  const storagePath = `${options.userId}/fancam/${options.jobId}-${options.kind.toLowerCase()}.${options.extension}`;
  const upload = await supabase.storage.from(BUCKET).upload(storagePath, download.bytes, {
    contentType: download.contentType,
    upsert: true,
  });
  if (upload.error) throw upload.error;

  const { data: asset, error: assetError } = await supabase
    .schema("marketing")
    .from("assets")
    .insert({
      storage_provider: "SUPABASE",
      storage_path: storagePath,
      asset_type: options.kind,
      mime_type: download.contentType,
      duration_seconds:
        options.kind === "VIDEO" && typeof options.metadata.duration === "number" ? options.metadata.duration : null,
      marketing_cleared: false,
      consent_status: "UNKNOWN",
      tags: ["fan-cam", "generated"],
      metadata: {
        generated: true,
        workflow: "fan_cam",
        job_id: options.jobId,
        image_model: options.metadata.image_model ?? null,
        video_model: options.metadata.video_model ?? null,
        event: options.metadata.event ?? null,
        reaction: options.metadata.reaction ?? null,
        frame_ratio: options.metadata.frame_ratio ?? null,
        caption: options.metadata.caption ?? null,
        alt_text: options.metadata.alt_text ?? null,
        // Kept on the generated file itself so the likeness trail survives independently of the job row.
        portrait_asset_id: options.metadata.portrait_asset_id ?? null,
        likeness_confirmed_by: options.metadata.likeness_confirmed_by ?? null,
      },
    })
    .select("id")
    .single();
  if (assetError) throw assetError;
  return asset.id as string;
}
