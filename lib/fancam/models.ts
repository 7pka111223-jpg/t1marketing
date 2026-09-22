// Import-free so it unit-tests under node:test.
//
// The fal fan-cam chain is two paid model calls: an image edit that composites the member's face
// into a generated scene, then an image-to-video pass that animates that frame. Both endpoints and
// both rates live here so a fal price change or a model bump is a one-line edit.
//
// Endpoint ids and per-unit rates are from fal's model pages (Sep 2026). They are overridable via
// FAL_IMAGE_MODEL / FAL_VIDEO_MODEL because fal renames endpoints between model generations more
// often than this repo gets redeployed.

export type FalImageModel = {
  id: string;
  label: string;
  perImageUsd: number;
};

export type FalVideoModel = {
  id: string;
  label: string;
  /** fal sends duration as a string ("5"), not a number. */
  durations: number[];
  perSecondUsd: number;
  perSecondWithAudioUsd: number;
  supportsAudio: boolean;
};

export const FAL_IMAGE_MODELS: FalImageModel[] = [
  { id: "fal-ai/nano-banana/edit", label: "Nano Banana (edit)", perImageUsd: 0.039 },
  { id: "fal-ai/nano-banana-pro/edit", label: "Nano Banana Pro (edit)", perImageUsd: 0.15 },
];

export const FAL_VIDEO_MODELS: FalVideoModel[] = [
  {
    id: "fal-ai/kling-video/v3/standard/image-to-video",
    label: "Kling v3 Standard (image to video)",
    durations: [5, 10],
    perSecondUsd: 0.084,
    perSecondWithAudioUsd: 0.126,
    supportsAudio: true,
  },
  {
    id: "fal-ai/kling-video/v3/pro/image-to-video",
    label: "Kling v3 Pro (image to video)",
    durations: [5, 10],
    perSecondUsd: 0.112,
    perSecondWithAudioUsd: 0.168,
    supportsAudio: true,
  },
];

export const DEFAULT_IMAGE_MODEL = FAL_IMAGE_MODELS[0].id;
export const DEFAULT_VIDEO_MODEL = FAL_VIDEO_MODELS[0].id;

// The planner call goes through OpenRouter, not fal. It is cents-per-thousand-tokens cheap, but
// counting it as zero would make the monthly cap drift low over time, so it carries a flat
// allowance rather than being ignored.
export const PLANNER_ALLOWANCE_USD = 0.01;

export function findImageModel(id: string): FalImageModel | null {
  return FAL_IMAGE_MODELS.find((model) => model.id === id) ?? null;
}

export function findVideoModel(id: string): FalVideoModel | null {
  return FAL_VIDEO_MODELS.find((model) => model.id === id) ?? null;
}

// The output frame is decided by the image edit, not by a video parameter: Kling inherits the
// aspect of the frame it is handed. So framing travels inside the edit prompt.
export type FrameShape = "broadcast" | "phone";

export const FRAME_SHAPES: { id: FrameShape; label: string; ratio: string; instruction: string }[] = [
  {
    id: "broadcast",
    label: "Broadcast cutaway",
    ratio: "16:9",
    instruction:
      "Compose as a single horizontal 16:9 broadcast frame, as if cut to by a live sports television director.",
  },
  {
    id: "phone",
    label: "Phone fan cam",
    ratio: "9:16",
    instruction:
      "Compose as a single vertical 9:16 frame shot handheld on a phone from inside the crowd, with the slight tilt and imperfect framing of a real spectator's camera.",
  },
];

export function findFrameShape(id: string): (typeof FRAME_SHAPES)[number] {
  return FRAME_SHAPES.find((shape) => shape.id === id) ?? FRAME_SHAPES[0];
}

// Presets are starting points for the planner, not the final prompt: the planner still rewrites
// them around the operator's event text and the reaction they asked for.
export const SCENE_PRESETS: { id: string; label: string; brief: string }[] = [
  {
    id: "street-workout-final",
    label: "Street workout final",
    brief:
      "Floodlit outdoor street-workout championship final in a packed city park, rig and bars lit from behind, scoreboard glow, phone lights across the crowd.",
  },
  {
    id: "fight-night",
    label: "Arena fight night",
    brief:
      "Championship fight night in a full arena, lower-bowl seating, hard key light spilling off the ring, round clock overlay, fans on their feet around the subject.",
  },
  {
    id: "stadium-cutaway",
    label: "Stadium cutaway",
    brief:
      "Daylight stadium crowd cutaway in the lower tier, long lens compression, out-of-focus fans behind the subject, stadium banners along the far stand.",
  },
  {
    id: "gym-comp-day",
    label: "Gym competition day",
    brief:
      "Competition day inside a calisthenics gym, chalk in the air, crowd pressed along the rig, judges' table in the background, hard industrial lighting.",
  },
];

export function findScenePreset(id: string): (typeof SCENE_PRESETS)[number] | null {
  return SCENE_PRESETS.find((preset) => preset.id === id) ?? null;
}
