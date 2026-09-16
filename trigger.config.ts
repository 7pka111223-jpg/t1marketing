import { defineConfig } from "@trigger.dev/sdk";

export default defineConfig({
  project: process.env.TRIGGER_PROJECT_REF ?? "proj_replace_me",
  runtime: "node-22",
  logLevel: "log",
  maxDuration: 900,
  dirs: ["./trigger"],
});
