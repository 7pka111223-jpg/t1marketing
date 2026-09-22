import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { fanCamConfig, isDemoMode, videoConfig } from "@/lib/config";
import { generateText } from "@/lib/ai/openrouter";
import { brandSystemPrompt } from "@/lib/ai/prompts";
import { monthlyCapStatus, VIDEO_BUDGET_JOB_TYPES } from "@/lib/video/cost";
import { estimateFanCamCost, validateFanCamRequest } from "@/lib/fancam/cost";
import { findFrameShape, findScenePreset } from "@/lib/fancam/models";
import {
  FANCAM_SYSTEM_PROMPT,
  buildPlannerPrompt,
  parsePlan,
  withLikenessGuard,
} from "@/lib/fancam/plan";
import { submitFal } from "@/lib/fal/client";
import { isUuid } from "@/lib/marketing/conversion-ingest";

const BUCKET = "marketing-assets";
// The photo is handed to fal as a time-limited signed URL rather than uploaded to fal storage, so
// the original never leaves our bucket and the link dies on its own.
const SIGNED_URL_TTL_SECONDS = 3600;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}) as Record<string, unknown>);
  const event = String(body.event ?? "").trim();
  const reaction = String(body.reaction ?? "").trim();
  const presetId = String(body.presetId ?? "");
  const customScene = String(body.customScene ?? "").trim();
  const frameId = String(body.frame ?? "broadcast");
  const durationSeconds = Number(body.durationSeconds ?? 5);
  const withAudio = body.withAudio === true;
  const likenessConsent = body.likenessConsent === true;
  const portraitAssetId = String(body.portraitAssetId ?? "");
  const contentItemId = String(body.contentItemId ?? "");

  const imageModelId = fanCamConfig.imageModel;
  const videoModelId = fanCamConfig.videoModel;

  const validation = validateFanCamRequest({
    imageModelId,
    videoModelId,
    durationSeconds,
    withAudio,
    event,
    reaction,
  });
  if (!validation.ok) return NextResponse.json({ error: validation.error }, { status: 400 });

  // A fan cam puts a real, identifiable person into a scene that never happened. That is a
  // likeness decision, not a rendering setting, so it is refused without an explicit confirmation
  // and without a portrait that was already marked consent-cleared at intake.
  if (!likenessConsent) {
    return NextResponse.json(
      { error: "Confirm that the person in the photo has agreed to appear in a generated scene." },
      { status: 400 },
    );
  }
  if (!isUuid(portraitAssetId)) {
    return NextResponse.json({ error: "Choose a cleared photo from the asset library." }, { status: 400 });
  }

  const preset = findScenePreset(presetId);
  const sceneBrief = customScene || preset?.brief || "";
  if (!sceneBrief) {
    return NextResponse.json({ error: "Pick a scene preset or describe the scene." }, { status: 400 });
  }

  const frame = findFrameShape(frameId);
  const cost = estimateFanCamCost({ imageModelId, videoModelId, durationSeconds, withAudio });
  if (!cost) return NextResponse.json({ error: "Unknown fan cam model configuration." }, { status: 400 });

  if (isDemoMode()) {
    return NextResponse.json({
      ok: true,
      demo: true,
      estimateUsd: cost.totalUsd,
      breakdown: cost,
      frame: frame.ratio,
    });
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

  if (!fanCamConfig.configured) {
    return NextResponse.json({ error: "Fan cam needs FAL_KEY and OPENROUTER_API_KEY." }, { status: 503 });
  }

  // The portrait must be a photo that a human already cleared at intake. Re-checking here rather
  // than trusting the client means a forged asset id cannot launder an uncleared face into a clip.
  const { data: portrait, error: portraitError } = await supabase
    .schema("marketing")
    .from("assets")
    .select("id,storage_path,asset_type,marketing_cleared,consent_status")
    .eq("id", portraitAssetId)
    .maybeSingle();
  if (portraitError) return NextResponse.json({ error: portraitError.message }, { status: 400 });
  if (!portrait) return NextResponse.json({ error: "That photo is not in the asset library." }, { status: 404 });
  if (portrait.asset_type !== "PHOTO") {
    return NextResponse.json({ error: "The fan cam source has to be a photo." }, { status: 400 });
  }
  if (!portrait.marketing_cleared || portrait.consent_status !== "CLEARED") {
    return NextResponse.json(
      { error: "That photo is not marketing-cleared. Clear it in the asset library first." },
      { status: 403 },
    );
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const { data: spendRows, error: spendError } = await supabase
    .schema("marketing")
    .from("jobs")
    .select("cost_estimate_usd")
    .in("job_type", [...VIDEO_BUDGET_JOB_TYPES])
    .gte("created_at", monthStart.toISOString());
  if (spendError) return NextResponse.json({ error: spendError.message }, { status: 400 });

  const spentUsd = (spendRows ?? []).reduce(
    (total, row) => total + Number((row as { cost_estimate_usd: number }).cost_estimate_usd ?? 0),
    0,
  );
  const cap = monthlyCapStatus(spentUsd, cost.totalUsd, videoConfig.monthlyCapUsd);
  if (!cap.allowed) return NextResponse.json({ error: cap.reason }, { status: 402 });

  // Plan first. The planner is the cheap step, so a bad plan costs cents instead of a wasted image
  // edit and video render.
  let plan;
  try {
    const raw = await generateText([
      { role: "system", content: `${brandSystemPrompt}\n\n${FANCAM_SYSTEM_PROMPT}` },
      {
        role: "user",
        content: buildPlannerPrompt({
          event,
          reaction,
          sceneBrief,
          frameInstruction: frame.instruction,
          durationSeconds,
        }),
      },
    ]);
    plan = parsePlan(raw);
  } catch (error) {
    const message = error instanceof Error ? error.message : "The fan cam planner failed.";
    return NextResponse.json({ error: message }, { status: 502 });
  }
  if (!plan) {
    return NextResponse.json(
      { error: "The planner did not return a usable scene. Try rewording the event or reaction." },
      { status: 502 },
    );
  }

  const editPrompt = withLikenessGuard(`${plan.editPrompt}\n\n${frame.instruction}`);

  const metadata: Record<string, unknown> = {
    stage: "PLANNED",
    event,
    reaction,
    scene_brief: sceneBrief,
    preset_id: preset?.id ?? null,
    frame: frame.id,
    frame_ratio: frame.ratio,
    duration: durationSeconds,
    with_audio: withAudio,
    image_model: imageModelId,
    video_model: videoModelId,
    edit_prompt: editPrompt,
    video_prompt: plan.videoPrompt,
    negative_prompt: plan.negativePrompt,
    caption: plan.caption,
    alt_text: plan.altText,
    portrait_asset_id: portraitAssetId,
    likeness_consent: true,
    likeness_confirmed_by: userId,
    cost_breakdown: cost,
    content_item_id: isUuid(contentItemId) ? contentItemId : null,
  };

  // Record the spend before the first paid call, so a clip can never be generated untracked.
  const { data: job, error: jobError } = await supabase
    .schema("marketing")
    .from("jobs")
    .insert({
      provider: "fal",
      job_type: "FAN_CAM",
      entity_type: metadata.content_item_id ? "content_item" : null,
      entity_id: metadata.content_item_id,
      status: "SUBMITTING",
      cost_estimate_usd: cost.totalUsd,
      metadata,
    })
    .select("id")
    .single();
  if (jobError || !job) {
    return NextResponse.json({ error: jobError?.message ?? "Could not record the job." }, { status: 400 });
  }

  try {
    const signed = await supabase.storage
      .from(BUCKET)
      .createSignedUrl(String(portrait.storage_path), SIGNED_URL_TTL_SECONDS);
    if (signed.error || !signed.data?.signedUrl) {
      throw signed.error ?? new Error("Could not sign the portrait URL.");
    }

    const submission = await submitFal(imageModelId, {
      prompt: editPrompt,
      image_urls: [signed.data.signedUrl],
      num_images: 1,
      output_format: "jpeg",
    });

    await supabase
      .schema("marketing")
      .from("jobs")
      .update({
        status: "QUEUED",
        external_run_id: submission.requestId,
        metadata: {
          ...metadata,
          stage: "EDITING",
          image_request_id: submission.requestId,
          image_status_url: submission.statusUrl,
          image_response_url: submission.responseUrl,
        },
      })
      .eq("id", job.id);

    return NextResponse.json({
      ok: true,
      jobId: job.id,
      stage: "EDITING",
      estimateUsd: cost.totalUsd,
      breakdown: cost,
      remainingUsd: cap.remainingUsd,
      caption: plan.caption,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Fan cam submission failed.";
    await supabase
      .schema("marketing")
      .from("jobs")
      .update({ status: "FAILED", metadata: { ...metadata, stage: "FAILED", error: message } })
      .eq("id", job.id);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
