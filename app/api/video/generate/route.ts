import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode, videoConfig } from "@/lib/config";
import { estimateVideoCost, monthlyCapStatus, validateVideoRequest } from "@/lib/video/cost";
import { findVideoModel } from "@/lib/video/models";
import { peopleGate, withPeopleConstraint } from "@/lib/video/people-guard";
import { submitVideo } from "@/lib/video/client";
import { isUuid } from "@/lib/marketing/conversion-ingest";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({} as Record<string, unknown>));
  const prompt = String(body.prompt ?? "").trim();
  const modelId = String(body.modelId ?? "minimax/hailuo-3");
  const duration = Number(body.duration ?? 5);
  const resolution = String(body.resolution ?? "2K");
  const aspectRatio = String(body.aspectRatio ?? "9:16");
  const allowPeople = body.allowPeople === true;
  const contentItemId = String(body.contentItemId ?? "");

  if (prompt.length < 10) {
    return NextResponse.json({ error: "Describe the clip in at least 10 characters." }, { status: 400 });
  }

  const combination = validateVideoRequest({ modelId, duration, resolution, aspectRatio });
  if (!combination.ok) return NextResponse.json({ error: combination.error }, { status: 400 });

  const gate = peopleGate(prompt, allowPeople);
  if (!gate.ok) return NextResponse.json({ error: gate.reason }, { status: 400 });

  const estimateUsd = estimateVideoCost(modelId, { duration, resolution });
  if (estimateUsd === null) return NextResponse.json({ error: "Unknown video model." }, { status: 400 });

  const model = findVideoModel(modelId)!;
  const guardedPrompt = withPeopleConstraint(prompt, allowPeople);
  const metadata = {
    model: modelId,
    prompt: guardedPrompt,
    duration,
    resolution,
    aspect_ratio: aspectRatio,
    allow_people: allowPeople,
    content_item_id: isUuid(contentItemId) ? contentItemId : null,
  };

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, estimateUsd, model: model.label, prompt: guardedPrompt });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  if (!videoConfig.configured) {
    return NextResponse.json({ error: "Video generation needs OPENROUTER_API_KEY." }, { status: 503 });
  }

  const monthStart = new Date();
  monthStart.setUTCDate(1);
  monthStart.setUTCHours(0, 0, 0, 0);
  const { data: spendRows, error: spendError } = await supabase
    .schema("marketing")
    .from("jobs")
    .select("cost_estimate_usd")
    .eq("provider", "openrouter")
    .eq("job_type", "VIDEO_GENERATION")
    .gte("created_at", monthStart.toISOString());
  if (spendError) return NextResponse.json({ error: spendError.message }, { status: 400 });

  const spentUsd = (spendRows ?? []).reduce((total, row) => total + Number((row as { cost_estimate_usd: number }).cost_estimate_usd ?? 0), 0);
  const cap = monthlyCapStatus(spentUsd, estimateUsd, videoConfig.monthlyCapUsd);
  if (!cap.allowed) return NextResponse.json({ error: cap.reason }, { status: 402 });

  // Record the spend before submitting, so a clip can never be generated untracked. If the submit
  // then fails the row is marked FAILED rather than left looking in-flight.
  const { data: job, error: jobError } = await supabase
    .schema("marketing")
    .from("jobs")
    .insert({
      provider: "openrouter",
      job_type: "VIDEO_GENERATION",
      entity_type: metadata.content_item_id ? "content_item" : null,
      entity_id: metadata.content_item_id,
      status: "SUBMITTING",
      cost_estimate_usd: estimateUsd,
      metadata,
    })
    .select("id")
    .single();
  if (jobError || !job) {
    return NextResponse.json({ error: jobError?.message ?? "Could not record the job." }, { status: 400 });
  }

  try {
    const submitted = await submitVideo({
      model: modelId,
      prompt: guardedPrompt,
      duration,
      resolution,
      aspectRatio,
    });
    await supabase
      .schema("marketing")
      .from("jobs")
      .update({ status: "QUEUED", external_run_id: submitted.jobId })
      .eq("id", job.id);
    return NextResponse.json({ ok: true, jobId: job.id, estimateUsd, remainingUsd: cap.remainingUsd, status: "QUEUED" });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video submission failed.";
    await supabase
      .schema("marketing")
      .from("jobs")
      .update({ status: "FAILED", metadata: { ...metadata, error: message } })
      .eq("id", job.id);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
