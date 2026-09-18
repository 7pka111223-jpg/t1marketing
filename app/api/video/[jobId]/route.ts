import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/config";
import { downloadVideo, pollVideo } from "@/lib/video/client";

const BUCKET = "marketing-assets";

// One poll per call. The job can be driven by a scheduled Trigger task or by pressing "Check
// status" in the UI, so the feature works whether or not Trigger.dev is deployed.
export async function POST(_request: NextRequest, context: { params: Promise<{ jobId: string }> }) {
  const { jobId } = await context.params;

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, jobId, status: "completed" });
  }

  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const userId = claims?.claims?.sub;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase.schema("marketing").from("members").select("role").eq("user_id", userId).maybeSingle();
  if (!member) return NextResponse.json({ error: "Not on the marketing access list." }, { status: 403 });

  const { data: job, error: readError } = await supabase
    .schema("marketing")
    .from("jobs")
    .select("id,status,external_run_id,cost_estimate_usd,metadata")
    .eq("id", jobId)
    .maybeSingle();
  if (readError) return NextResponse.json({ error: readError.message }, { status: 400 });
  if (!job) return NextResponse.json({ error: "Job not found." }, { status: 404 });
  if (job.status === "COMPLETED") return NextResponse.json({ ok: true, status: "COMPLETED" });
  if (!job.external_run_id) {
    return NextResponse.json({ error: `Job is ${job.status} and has no provider run id yet.` }, { status: 409 });
  }

  const metadata = (job.metadata ?? {}) as Record<string, unknown>;

  try {
    const polled = await pollVideo(String(job.external_run_id));

    if (polled.status === "failed" || polled.status === "cancelled" || polled.status === "expired") {
      await supabase
        .schema("marketing")
        .from("jobs")
        .update({ status: "FAILED", metadata: { ...metadata, error: polled.error ?? polled.status } })
        .eq("id", job.id);
      return NextResponse.json({ ok: false, status: "FAILED", error: polled.error ?? polled.status }, { status: 200 });
    }

    if (polled.status !== "completed") {
      await supabase.schema("marketing").from("jobs").update({ status: "RUNNING" }).eq("id", job.id);
      return NextResponse.json({ ok: true, status: polled.status });
    }

    const download = await downloadVideo(String(job.external_run_id));
    const storagePath = `${userId}/generated/${job.id}.mp4`;
    const upload = await supabase.storage.from(BUCKET).upload(storagePath, download.bytes, {
      contentType: download.contentType,
      upsert: false,
    });
    if (upload.error) throw upload.error;

    const contentItemId = typeof metadata.content_item_id === "string" ? metadata.content_item_id : null;
    const { data: asset, error: assetError } = await supabase
      .schema("marketing")
      .from("assets")
      .insert({
        storage_provider: "SUPABASE",
        storage_path: storagePath,
        asset_type: "VIDEO",
        mime_type: download.contentType,
        duration_seconds: typeof metadata.duration === "number" ? metadata.duration : null,
        // Generated media is never auto-cleared: a human has to clear it before it can be used.
        marketing_cleared: false,
        consent_status: "UNKNOWN",
        tags: [],
        metadata: {
          generated: true,
          model: metadata.model ?? null,
          prompt: metadata.prompt ?? null,
          resolution: metadata.resolution ?? null,
          aspect_ratio: metadata.aspect_ratio ?? null,
          allow_people: metadata.allow_people === true,
          job_id: job.id,
        },
      })
      .select("id")
      .single();
    if (assetError) throw assetError;

    if (contentItemId) {
      const link = await supabase
        .schema("marketing")
        .from("asset_usage")
        .upsert(
          { content_item_id: contentItemId, asset_id: asset.id, usage_role: "SOURCE" },
          { onConflict: "content_item_id,asset_id,usage_role", ignoreDuplicates: true },
        );
      if (link.error) console.error("[api:video:link]", link.error);
    }

    await supabase
      .schema("marketing")
      .from("jobs")
      .update({
        status: "COMPLETED",
        cost_estimate_usd: polled.costUsd ?? Number(job.cost_estimate_usd ?? 0),
        metadata: { ...metadata, asset_id: asset.id, storage_path: storagePath, actual_cost_usd: polled.costUsd },
      })
      .eq("id", job.id);

    return NextResponse.json({ ok: true, status: "COMPLETED", assetId: asset.id, costUsd: polled.costUsd });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Video finalisation failed.";
    console.error("[api:video:sync]", error);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
