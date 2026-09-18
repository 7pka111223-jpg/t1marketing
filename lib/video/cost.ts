// Cost and cap rules. Imports only the dependency-free catalogue, so it stays testable.
import { rateFor, findVideoModel, isSupportedAspectRatio, isSupportedDuration, isSupportedResolution } from "./models.ts";

export function estimateVideoCost(
  modelId: string,
  options: { duration: number; resolution: string; referenceImages?: number },
): number | null {
  const model = findVideoModel(modelId);
  if (!model) return null;
  const rate = rateFor(model, options.resolution);
  const seconds = rate * options.duration;
  const references = (options.referenceImages ?? 0) * model.referenceImageUsd;
  return round2(seconds + references);
}

export type CapStatus = { allowed: boolean; remainingUsd: number; reason?: string };

// The $10/month rule is enforced here rather than trusted to the operator: a submission that would
// push the month past the cap is refused before any spend happens.
export function monthlyCapStatus(spentUsd: number, estimateUsd: number, capUsd: number): CapStatus {
  const remainingUsd = round2(capUsd - spentUsd);
  if (estimateUsd > remainingUsd) {
    return {
      allowed: false,
      remainingUsd,
      reason: `This clip would cost $${estimateUsd.toFixed(2)} but only $${remainingUsd.toFixed(2)} of the $${capUsd.toFixed(2)} monthly video budget is left.`,
    };
  }
  return { allowed: true, remainingUsd };
}

export function validateVideoRequest(input: {
  modelId: string;
  duration: number;
  resolution: string;
  aspectRatio: string;
}): { ok: true } | { ok: false; error: string } {
  const model = findVideoModel(input.modelId);
  if (!model) return { ok: false, error: "Unknown video model." };
  if (!isSupportedDuration(model, input.duration)) {
    return { ok: false, error: `${model.label} supports ${model.durations[0]}–${model.durations[model.durations.length - 1]} second clips.` };
  }
  if (!isSupportedResolution(model, input.resolution)) {
    return { ok: false, error: `${model.label} supports ${model.resolutions.join(", ")}.` };
  }
  if (!isSupportedAspectRatio(model, input.aspectRatio)) {
    return { ok: false, error: `${model.label} supports ${model.aspectRatios.join(", ")}.` };
  }
  return { ok: true };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
