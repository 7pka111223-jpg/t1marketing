export type FlowResult = { ok: true } | { ok: false; reason: string };

export function nextPublicationStatus(current: string): string | null {
  if (current === "READY_TO_SCHEDULE") return "SCHEDULED";
  if (current === "SCHEDULED") return "APPROVED";
  return null;
}

export function canDeliver(publicationStatus: string): FlowResult {
  if (publicationStatus === "APPROVED") return { ok: true };
  return { ok: false, reason: `Publication is ${publicationStatus}; delivery requires explicit human APPROVAL of the scheduled post.` };
}
