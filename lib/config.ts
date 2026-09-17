const isTrue = (value: string | undefined) => value === "true";

export function isDemoMode(): boolean {
  return isTrue(process.env.NEXT_PUBLIC_DEMO_MODE) || !process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export const aiConfig = {
  configured: Boolean(process.env.OPENROUTER_API_KEY && process.env.AI_MODEL),
};

export const triggerConfig = {
  configured: Boolean(process.env.TRIGGER_SECRET_KEY && process.env.TRIGGER_PROJECT_REF),
};

export const ingestConfig = {
  configured: Boolean(process.env.MARKETING_INGEST_SECRET && process.env.SUPABASE_SERVICE_ROLE_KEY),
};

// Live platform insights need a publishing-capable platform credential. Without one,
// metrics sync still runs but writes zero-filled snapshots.
export const insightsConfig = {
  configured: Boolean(
    (process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) || process.env.TIKTOK_ACCESS_TOKEN,
  ),
};

export type Connection = { name: string; role: string; state: string; ok: boolean };

export function connectionStatus(): Connection[] {
  const demo = isDemoMode();
  const instagram = Boolean(process.env.INSTAGRAM_ACCESS_TOKEN && process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID);
  const tiktok = Boolean(process.env.TIKTOK_ACCESS_TOKEN && process.env.TIKTOK_OPEN_ID);
  return [
    { name: "Supabase", role: "Required", state: demo ? "Demo mode" : "Connected", ok: !demo },
    { name: "Trigger.dev", role: "Workflow runner", state: triggerConfig.configured ? "Configured" : "Not configured", ok: triggerConfig.configured },
    { name: "Instagram", role: "Publishing", state: instagram ? "Configured" : "Disabled until API approval", ok: instagram },
    { name: "TikTok", role: "Publishing", state: tiktok ? "Configured" : "Disabled until API approval", ok: tiktok },
    { name: "AI Gateway", role: "Copy/research", state: aiConfig.configured ? "Configured" : "Not configured", ok: aiConfig.configured },
    { name: "Conversion ingest", role: "Attribution", state: ingestConfig.configured ? "Configured" : "Not configured", ok: ingestConfig.configured },
  ];
}
