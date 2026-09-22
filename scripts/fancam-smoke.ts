// Runs the fan cam chain end to end from the command line, against the real APIs, with no Supabase
// and no dashboard. It imports the same planner, cost and fal modules the app routes use, so a
// green run here means the app's chain works too — and a red run names which fal field is wrong.
//
//   npm run fancam:smoke -- --photo ./face.jpg --event "..." --reaction "..."
//
// It writes the composited frame and the finished clip next to each other in --out, and prints the
// planner's JSON so you can see what the paid models were actually asked for.
//
// This deliberately bypasses the consent gates the API route enforces. It is a plumbing test, not
// a way to make clips: use a photo of yourself.

import { writeFile, readFile, mkdir } from "node:fs/promises";
import { basename, extname, join } from "node:path";
import { generateText } from "../lib/ai/openrouter.ts";
import { brandSystemPrompt } from "../lib/ai/prompts.ts";
import { FANCAM_SYSTEM_PROMPT, buildPlannerPrompt, parsePlan, withLikenessGuard } from "../lib/fancam/plan.ts";
import { estimateFanCamCost, validateFanCamRequest } from "../lib/fancam/cost.ts";
import { findFrameShape, findScenePreset, SCENE_PRESETS } from "../lib/fancam/models.ts";
import { downloadFalFile, firstImageUrl, resultFal, statusFal, submitFal, videoUrl } from "../lib/fal/client.ts";

const POLL_INTERVAL_MS = 5000;
const POLL_TIMEOUT_MS = 10 * 60 * 1000;

const MIME_BY_EXTENSION: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

function args(): Record<string, string> {
  const parsed: Record<string, string> = {};
  const argv = process.argv.slice(2);
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;
    const key = token.slice(2);
    const next = argv[index + 1];
    if (next === undefined || next.startsWith("--")) parsed[key] = "true";
    else {
      parsed[key] = next;
      index += 1;
    }
  }
  return parsed;
}

function die(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

async function photoUrl(options: { photo?: string; photoUrl?: string }): Promise<string> {
  if (options.photoUrl) return options.photoUrl;
  if (!options.photo) die("Pass --photo ./face.jpg or --photo-url https://...");

  const extension = extname(options.photo).toLowerCase();
  const mime = MIME_BY_EXTENSION[extension];
  if (!mime) die(`Unsupported photo type "${extension}". Use jpg, png or webp.`);

  // fal accepts a data URI wherever it accepts an image URL, which keeps the smoke test from
  // needing a public bucket. The app route signs a Supabase URL instead.
  const bytes = await readFile(options.photo);
  if (bytes.byteLength > 6_000_000) {
    die(`${basename(options.photo)} is ${(bytes.byteLength / 1e6).toFixed(1)}MB. Use a smaller photo or --photo-url.`);
  }
  return `data:${mime};base64,${bytes.toString("base64")}`;
}

async function waitForFal(label: string, statusUrl: string): Promise<void> {
  const deadline = Date.now() + POLL_TIMEOUT_MS;
  let last = "";
  while (Date.now() < deadline) {
    const status = await statusFal(statusUrl);
    if (status.status !== last) {
      process.stdout.write(`\n  ${label}: ${status.status}`);
      last = status.status;
    } else {
      process.stdout.write(".");
    }
    if (status.status === "COMPLETED") {
      process.stdout.write("\n");
      return;
    }
    if (status.error) die(`${label} failed: ${status.error}`);
    await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
  }
  die(`${label} did not finish within ${POLL_TIMEOUT_MS / 60000} minutes.`);
}

async function main() {
  const options = args();

  if (options.help === "true") {
    console.log(`
Usage: npm run fancam:smoke -- --photo ./face.jpg --event "..." --reaction "..."

  --photo <path>       Local jpg/png/webp, sent to fal as a data URI
  --photo-url <url>    A publicly reachable image URL instead of --photo
  --event <text>       What is happening         (default: a street workout final)
  --reaction <text>    What the person is doing  (default: on their feet, arms up)
  --preset <id>        ${SCENE_PRESETS.map((preset) => preset.id).join(" | ")}
  --frame <id>         broadcast (16:9) | phone (9:16)
  --seconds <5|10>     Clip length (default 5)
  --audio              Generate audio (costs more, and exercises the generate_audio field)
  --out <dir>          Where to write the frame and clip (default ./fancam-out)
  --dry-run            Plan only: no fal calls, no spend
`);
    return;
  }

  const event = options.event ?? "The national street workout final, last rep of the night";
  const reaction = options.reaction ?? "On their feet, both arms up, shouting";
  const preset = findScenePreset(options.preset ?? "street-workout-final") ?? SCENE_PRESETS[0];
  const frame = findFrameShape(options.frame ?? "broadcast");
  const durationSeconds = Number(options.seconds ?? 5);
  const withAudio = options.audio === "true";
  const outDir = options.out ?? "./fancam-out";
  const dryRun = options["dry-run"] === "true";

  const imageModelId = process.env.FAL_IMAGE_MODEL || "fal-ai/nano-banana/edit";
  const videoModelId = process.env.FAL_VIDEO_MODEL || "fal-ai/kling-video/v3/standard/image-to-video";

  const validation = validateFanCamRequest({ imageModelId, videoModelId, durationSeconds, withAudio, event, reaction });
  if (!validation.ok) die(validation.error);

  const cost = estimateFanCamCost({ imageModelId, videoModelId, durationSeconds, withAudio });
  console.log(`\nFan cam smoke test`);
  console.log(`  scene     ${preset.label}`);
  console.log(`  frame     ${frame.label} (${frame.ratio}), ${durationSeconds}s, audio ${withAudio ? "on" : "off"}`);
  console.log(`  models    ${imageModelId} → ${videoModelId}`);
  console.log(`  estimate  $${cost?.totalUsd.toFixed(2)} (frame $${cost?.imageUsd.toFixed(2)} + clip $${cost?.videoUsd.toFixed(2)})`);

  console.log(`\n[1/3] Planning…`);
  const raw = await generateText([
    { role: "system", content: `${brandSystemPrompt}\n\n${FANCAM_SYSTEM_PROMPT}` },
    {
      role: "user",
      content: buildPlannerPrompt({
        event,
        reaction,
        sceneBrief: preset.brief,
        frameInstruction: frame.instruction,
        durationSeconds,
      }),
    },
  ]);
  const plan = parsePlan(raw);
  if (!plan) {
    console.error(`\nPlanner returned something unusable:\n${raw.slice(0, 800)}`);
    die("Could not parse a plan. Try a different AI_MODEL — a small model may not hold the JSON format.");
  }
  console.log(JSON.stringify(plan, null, 2));

  if (dryRun) {
    console.log(`\n✓ Dry run: plan is valid, nothing was spent.\n`);
    return;
  }

  await mkdir(outDir, { recursive: true });
  const editPrompt = withLikenessGuard(`${plan.editPrompt}\n\n${frame.instruction}`);

  console.log(`\n[2/3] Compositing the frame on ${imageModelId}…`);
  const imageJob = await submitFal(imageModelId, {
    prompt: editPrompt,
    image_urls: [await photoUrl({ photo: options.photo, photoUrl: options["photo-url"] })],
    num_images: 1,
    output_format: "jpeg",
  });
  await waitForFal("frame", imageJob.statusUrl);
  const frameUrl = firstImageUrl(await resultFal(imageJob.responseUrl));
  if (!frameUrl) die("The image edit returned no frame.");

  const framePath = join(outDir, "frame.jpg");
  const frameFile = await downloadFalFile(frameUrl);
  await writeFile(framePath, Buffer.from(frameFile.bytes));
  console.log(`  saved ${framePath}`);

  console.log(`\n[3/3] Animating on ${videoModelId}…`);
  const videoInput: Record<string, unknown> = {
    prompt: plan.videoPrompt,
    start_image_url: frameUrl,
    duration: String(durationSeconds),
  };
  if (plan.negativePrompt) videoInput.negative_prompt = plan.negativePrompt;
  if (withAudio) videoInput.generate_audio = true;

  const clipJob = await submitFal(videoModelId, videoInput);
  await waitForFal("clip", clipJob.statusUrl);
  const clipUrl = videoUrl(await resultFal(clipJob.responseUrl));
  if (!clipUrl) die("The video pass returned no clip.");

  const clipPath = join(outDir, "clip.mp4");
  const clipFile = await downloadFalFile(clipUrl);
  await writeFile(clipPath, Buffer.from(clipFile.bytes));

  console.log(`\n✓ Done.`);
  console.log(`  frame    ${framePath}`);
  console.log(`  clip     ${clipPath}`);
  console.log(`  caption  ${plan.caption}\n`);
}

main().catch((error) => die(error instanceof Error ? error.message : String(error)));
