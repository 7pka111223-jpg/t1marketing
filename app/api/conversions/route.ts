import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "node:crypto";
import { isDemoMode, ingestConfig } from "@/lib/config";
import { createAdminClient } from "@/lib/supabase/admin";
import { normalizeConversionEvent, type NormalizedConversion } from "@/lib/marketing/conversion-ingest";

const MAX_BATCH = 200;
const MAX_BODY_BYTES = 256 * 1024;

function authorized(request: NextRequest): boolean {
  const secret = process.env.MARKETING_INGEST_SECRET;
  if (!secret) return false;
  const header = request.headers.get("authorization") ?? "";
  const provided = header.toLowerCase().startsWith("bearer ")
    ? header.slice(7).trim()
    : (request.headers.get("x-marketing-ingest-key") ?? "").trim();
  if (!provided) return false;
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

function toList(body: unknown): unknown[] | null {
  if (Array.isArray(body)) return body;
  if (body && typeof body === "object") {
    const events = (body as { events?: unknown }).events;
    if (Array.isArray(events)) return events;
    // A single event object is a batch of one.
    return [body];
  }
  return null;
}

function unique(values: (string | null)[]): string[] {
  return [...new Set(values.filter((value): value is string => Boolean(value)))];
}

async function existingIds(admin: ReturnType<typeof createAdminClient>, table: string, ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set();
  const { data, error } = await admin.from(table).select("id").in("id", ids);
  if (error) throw error;
  return new Set((data ?? []).map((row: { id: string }) => row.id));
}

// Prefer an explicit campaign id the caller proved exists; otherwise fall back to the
// campaign slug carried in utm_campaign. Unresolvable values stay null (utm_campaign keeps
// the raw trace) rather than failing the batch.
function resolveCampaignId(row: NormalizedConversion, existing: Set<string>, bySlug: Map<string, string>): string | null {
  if (row.campaign_id && existing.has(row.campaign_id)) return row.campaign_id;
  if (row.utm_campaign) return bySlug.get(row.utm_campaign.toLowerCase()) ?? null;
  return null;
}

export async function POST(request: NextRequest) {
  if (!isDemoMode()) {
    if (!ingestConfig.configured) {
      return NextResponse.json({ error: "Conversion ingest is not configured." }, { status: 503 });
    }
    if (!authorized(request)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const rawBody = await request.text();
  if (Buffer.byteLength(rawBody, "utf8") > MAX_BODY_BYTES) {
    return NextResponse.json({ error: "Request body too large." }, { status: 413 });
  }
  let body: unknown;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const list = toList(body);
  if (!list || list.length === 0) {
    return NextResponse.json({ error: "Provide a conversion event or an events array." }, { status: 400 });
  }
  if (list.length > MAX_BATCH) {
    return NextResponse.json({ error: `A batch may contain at most ${MAX_BATCH} events.` }, { status: 413 });
  }

  const accepted: NormalizedConversion[] = [];
  const errors: { index: number; error: string }[] = [];
  list.forEach((item, index) => {
    const result = normalizeConversionEvent(item);
    if (result.ok) accepted.push(result.value);
    else errors.push({ index, error: result.error });
  });

  if (isDemoMode()) {
    return NextResponse.json({ ok: true, demo: true, accepted: accepted.length, duplicates: 0, rejected: errors.length, errors });
  }
  if (accepted.length === 0) {
    return NextResponse.json({ ok: false, accepted: 0, duplicates: 0, rejected: errors.length, errors }, { status: 400 });
  }

  try {
    const admin = createAdminClient();

    // Reference ids come from another app; drop any that do not exist so the foreign
    // keys cannot reject an otherwise valid batch. utm_content keeps the raw trace.
    const [contentIds, campaignIds, publicationIds] = await Promise.all([
      existingIds(admin, "content_items", unique(accepted.map((r) => r.content_item_id))),
      existingIds(admin, "campaigns", unique(accepted.map((r) => r.campaign_id))),
      existingIds(admin, "publications", unique(accepted.map((r) => r.publication_id))),
    ]);

    // utm_campaign carries the campaign slug when the app cannot send an explicit id.
    const slugs = unique(accepted.map((r) => r.utm_campaign?.toLowerCase() ?? null));
    const { data: slugRows, error: slugError } = slugs.length
      ? await admin.from("campaigns").select("id,slug").in("slug", slugs)
      : { data: [], error: null };
    if (slugError) throw slugError;
    const campaignIdBySlug = new Map((slugRows ?? []).map((row: { id: string; slug: string }) => [row.slug.toLowerCase(), row.id] as [string, string]));

    const externalIds = unique(accepted.map((r) => r.external_event_id));
    const { data: seen, error: seenError } = externalIds.length
      ? await admin.from("conversions").select("external_event_id").in("external_event_id", externalIds)
      : { data: [], error: null };
    if (seenError) throw seenError;
    const alreadySeen = new Set((seen ?? []).map((row: { external_event_id: string }) => row.external_event_id));

    const rows: NormalizedConversion[] = [];
    let duplicates = 0;
    for (const row of accepted) {
      if (row.external_event_id && alreadySeen.has(row.external_event_id)) {
        duplicates += 1;
        continue;
      }
      rows.push({
        ...row,
        content_item_id: row.content_item_id && contentIds.has(row.content_item_id) ? row.content_item_id : null,
        campaign_id: resolveCampaignId(row, campaignIds, campaignIdBySlug),
        publication_id: row.publication_id && publicationIds.has(row.publication_id) ? row.publication_id : null,
      });
    }

    if (rows.length) {
      const { error: insertError } = await admin.from("conversions").insert(rows);
      if (insertError) throw insertError;
    }

    return NextResponse.json({ ok: true, accepted: rows.length, duplicates, rejected: errors.length, errors });
  } catch (error) {
    console.error("[api:conversions]", error);
    const message = error instanceof Error ? error.message : "Conversion ingest failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
