type GuardResult = { ok: true } | { ok: false; reason: string };

const SCHEDULABLE = new Set(["READY_TO_SCHEDULE", "SCHEDULED"]);

export function canSchedule(status: string, scheduledAt: string): GuardResult {
  if (!SCHEDULABLE.has(status)) {
    return { ok: false, reason: `Content is ${status}; scheduling requires READY_TO_SCHEDULE.` };
  }
  const at = new Date(scheduledAt);
  if (Number.isNaN(at.getTime()) || at.getTime() <= Date.now()) {
    return { ok: false, reason: "Schedule date must be in the future." };
  }
  return { ok: true };
}

export function canApprovePublication(publicationStatus: string): GuardResult {
  if (publicationStatus !== "SCHEDULED") {
    return { ok: false, reason: `Publication is ${publicationStatus}; only SCHEDULED publications can be approved for delivery.` };
  }
  return { ok: true };
}
