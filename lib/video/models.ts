// Import-free so it unit-tests under node:test. Values mirror OpenRouter's video models API
// (GET https://openrouter.ai/api/v1/videos/models) as of Sep 2026 — including which model slug
// actually supports which duration, resolution and aspect ratio, so we never send a 400.
export type VideoModel = {
  id: string;
  label: string;
  note: string;
  resolutions: string[];
  durations: number[];
  aspectRatios: string[];
  perSecondUsd: number;
  resolutionRateUsd?: Record<string, number>;
  referenceImageUsd: number;
  audio: boolean;
};

const DURATIONS = [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
const ASPECT_RATIOS = ["9:16", "16:9", "1:1", "3:4", "4:3", "21:9"];

export const VIDEO_MODELS: VideoModel[] = [
  {
    id: "minimax/hailuo-3",
    label: "MiniMax H3",
    note: "2K with native audio. Best for brand text, graphics and instruction-guided edits.",
    resolutions: ["2K"],
    durations: DURATIONS,
    aspectRatios: ASPECT_RATIOS,
    perSecondUsd: 0.13,
    referenceImageUsd: 0.04,
    audio: true,
  },
  {
    id: "minimax/hailuo-3-max",
    label: "MiniMax H3 Max",
    note: "Same family at 480p/768p without audio — roughly a third of the cost per second.",
    resolutions: ["480p", "768p"],
    durations: DURATIONS,
    aspectRatios: ASPECT_RATIOS,
    perSecondUsd: 0.08,
    resolutionRateUsd: { "480p": 0.05, "768p": 0.08 },
    referenceImageUsd: 0,
    audio: false,
  },
];

export function findVideoModel(id: string): VideoModel | null {
  return VIDEO_MODELS.find((model) => model.id === id) ?? null;
}

export function isSupportedDuration(model: VideoModel, duration: number): boolean {
  return model.durations.includes(duration);
}

export function isSupportedResolution(model: VideoModel, resolution: string): boolean {
  return model.resolutions.includes(resolution);
}

export function isSupportedAspectRatio(model: VideoModel, aspectRatio: string): boolean {
  return model.aspectRatios.includes(aspectRatio);
}

export function rateFor(model: VideoModel, resolution: string): number {
  return model.resolutionRateUsd?.[resolution] ?? model.perSecondUsd;
}
