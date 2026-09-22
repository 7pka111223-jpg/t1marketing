// Cost and validation for the fan-cam chain. Imports only the dependency-free catalogue so it
// stays testable under node:test.
import {
  PLANNER_ALLOWANCE_USD,
  findImageModel,
  findVideoModel,
} from "./models.ts";

export type FanCamCost = {
  plannerUsd: number;
  imageUsd: number;
  videoUsd: number;
  totalUsd: number;
};

// A fan cam is billed as one chain, not three line items: the cap has to refuse the whole thing up
// front, because an image edit that succeeds and a video that is then refused is money already
// spent for nothing.
export function estimateFanCamCost(options: {
  imageModelId: string;
  videoModelId: string;
  durationSeconds: number;
  withAudio: boolean;
}): FanCamCost | null {
  const image = findImageModel(options.imageModelId);
  const video = findVideoModel(options.videoModelId);
  if (!image || !video) return null;

  const rate = options.withAudio && video.supportsAudio ? video.perSecondWithAudioUsd : video.perSecondUsd;
  const imageUsd = round2(image.perImageUsd);
  const videoUsd = round2(rate * options.durationSeconds);
  return {
    plannerUsd: PLANNER_ALLOWANCE_USD,
    imageUsd,
    videoUsd,
    totalUsd: round2(PLANNER_ALLOWANCE_USD + imageUsd + videoUsd),
  };
}

export function validateFanCamRequest(input: {
  imageModelId: string;
  videoModelId: string;
  durationSeconds: number;
  withAudio: boolean;
  event: string;
  reaction: string;
}): { ok: true } | { ok: false; error: string } {
  const image = findImageModel(input.imageModelId);
  if (!image) return { ok: false, error: "Unknown image model." };

  const video = findVideoModel(input.videoModelId);
  if (!video) return { ok: false, error: "Unknown video model." };

  if (!video.durations.includes(input.durationSeconds)) {
    return { ok: false, error: `${video.label} supports ${video.durations.map((value) => `${value}s`).join(" or ")} clips.` };
  }
  if (input.withAudio && !video.supportsAudio) {
    return { ok: false, error: `${video.label} does not generate audio.` };
  }
  if (input.event.trim().length < 8) {
    return { ok: false, error: "Describe the event in at least 8 characters." };
  }
  if (input.reaction.trim().length < 4) {
    return { ok: false, error: "Describe the reaction or situation in at least 4 characters." };
  }
  return { ok: true };
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}
