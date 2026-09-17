export const CONVERSION_EVENT_TYPES = ["APP_VISIT", "SIGNUP", "BOOKING", "MEMBERSHIP"] as const;

export type ConversionEventType = (typeof CONVERSION_EVENT_TYPES)[number];

export type NormalizedConversion = {
  event_type: ConversionEventType;
  external_event_id: string | null;
  occurred_at: string | null;
  anonymous_or_user_ref: string | null;
  source: string | null;
  medium: string | null;
  utm_campaign: string | null;
  utm_content: string | null;
  content_item_id: string | null;
  campaign_id: string | null;
  publication_id: string | null;
};

export type NormalizeResult =
  | { ok: true; value: NormalizedConversion }
  | { ok: false; error: string };

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_PATTERN = /^\+?[\d][\d\s().-]{6,}$/;
const TEXT_LIMIT = 512;
const ID_LIMIT = 200;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

type Input = Record<string, unknown>;

function firstPresent(input: Input, keys: string[]): unknown {
  for (const key of keys) {
    const value = input[key];
    if (value !== undefined && value !== null && value !== "") return value;
  }
  return undefined;
}

function asText(value: unknown, limit: number): string | null {
  const text = String(value).trim();
  if (!text) return null;
  return text.length > limit ? text.slice(0, limit) : text;
}

function asUuid(value: unknown, field: string): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined) return { ok: true, value: null };
  const text = String(value).trim();
  if (!text) return { ok: true, value: null };
  if (!isUuid(text)) return { ok: false, error: `${field} must be a UUID.` };
  return { ok: true, value: text };
}

// Marketing attribution only ever needs an opaque reference; refuse anything that
// looks like a direct identifier so member PII cannot be pushed into the workflow.
function asOpaqueRef(value: unknown): { ok: true; value: string | null } | { ok: false; error: string } {
  if (value === undefined) return { ok: true, value: null };
  const text = asText(value, ID_LIMIT);
  if (!text) return { ok: true, value: null };
  if (text.includes("@")) return { ok: false, error: "anonymousOrUserRef must be an opaque reference, not an email address." };
  if (PHONE_PATTERN.test(text)) return { ok: false, error: "anonymousOrUserRef must be an opaque reference, not a phone number." };
  return { ok: true, value: text };
}

export function normalizeConversionEvent(input: unknown): NormalizeResult {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return { ok: false, error: "Each event must be an object." };
  }
  const source = input as Input;

  const rawType = firstPresent(source, ["eventType", "event_type"]);
  const eventType = String(rawType ?? "").trim().toUpperCase();
  if (!CONVERSION_EVENT_TYPES.includes(eventType as ConversionEventType)) {
    return { ok: false, error: `eventType must be one of ${CONVERSION_EVENT_TYPES.join(", ")}.` };
  }

  const externalEventId = asText(firstPresent(source, ["externalEventId", "external_event_id", "eventId"]), ID_LIMIT);
  const occurredRaw = firstPresent(source, ["occurredAt", "occurred_at", "occurredAtIso"]);
  let occurredAt: string | null = null;
  if (occurredRaw !== undefined) {
    const parsed = new Date(String(occurredRaw));
    if (Number.isNaN(parsed.getTime())) return { ok: false, error: "occurredAt must be a valid ISO date." };
    occurredAt = parsed.toISOString();
  }

  const ref = asOpaqueRef(firstPresent(source, ["anonymousOrUserRef", "anonymous_or_user_ref", "ref"]));
  if (!ref.ok) return ref;

  const contentItemId = asUuid(firstPresent(source, ["contentItemId", "content_item_id"]), "contentItemId");
  if (!contentItemId.ok) return contentItemId;
  const campaignId = asUuid(firstPresent(source, ["campaignId", "campaign_id"]), "campaignId");
  if (!campaignId.ok) return campaignId;
  const publicationId = asUuid(firstPresent(source, ["publicationId", "publication_id"]), "publicationId");
  if (!publicationId.ok) return publicationId;

  const utmContent = asText(firstPresent(source, ["utmContent", "utm_content", "contentSlug"]), ID_LIMIT);
  // README contract: utm_content carries the content id when the app cannot send it explicitly.
  const resolvedContentId = contentItemId.value ?? (utmContent && isUuid(utmContent) ? utmContent : null);

  return {
    ok: true,
    value: {
      event_type: eventType as ConversionEventType,
      external_event_id: externalEventId,
      occurred_at: occurredAt,
      anonymous_or_user_ref: ref.value,
      source: asText(firstPresent(source, ["source", "utmSource", "utm_source"]), TEXT_LIMIT),
      medium: asText(firstPresent(source, ["medium", "utmMedium", "utm_medium"]), TEXT_LIMIT),
      utm_campaign: asText(firstPresent(source, ["utmCampaign", "utm_campaign", "campaignSlug"]), TEXT_LIMIT),
      utm_content: utmContent,
      content_item_id: resolvedContentId,
      campaign_id: campaignId.value,
      publication_id: publicationId.value,
    },
  };
}
