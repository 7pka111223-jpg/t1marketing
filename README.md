# TripleOne Marketing OS — $20 Plan MVP

Standalone internal dashboard for TripleOneBars marketing operations. It is designed around a human-in-the-loop workflow:

**research → content → creative → approval → schedule/publish → attribution → learning**

The UI follows the supplied TripleOneBars design system: Triple Red `#E10600`, black/white structure, sharp geometry, Bebas-style display typography, Inter-style UI copy, and approval-first operations.

## What is implemented

- Responsive standalone dashboard shell (`marketing.tripleonebars.com` target)
- Command Center
- Ranked Research opportunities
- Campaigns: objective, window and lifecycle (draft → active ⇄ paused → completed → archived), campaign-linked content, and a per-campaign detail page with attributed reach → memberships
- Content Kanban
- Creative Studio with a real render queue (from `marketing.creatives`) and a searchable asset library
- Granular Approve / Edit / Reloop / Reject UI
- Calendar
- Audience signal page
- Awareness → membership analytics funnel
- Settings and $20 guardrails
- Supabase SSR auth utilities + Next.js 16 `proxy.ts`
- Full `marketing` database schema with RLS and audit-trail approvals
- Trigger.dev weekly planner/media-ingestion/content-approval scaffolds
- OpenRouter-compatible low-cost AI adapter (model selected via env)
- Safe publishing adapter boundary (Instagram/TikTok are disabled until credentials/app approvals exist)
- Demo mode so the UI can run before connecting production data

## Stack

- Next.js 16.3.3 / React 19.2
- Supabase (existing TripleOne project)
- Trigger.dev v4 workflow scaffolding
- Lucide icons
- Plain CSS using the TripleOne design tokens (no UI SaaS dependency)

## 1. Install and preview

```bash
cp .env.example .env.local
npm install
npm run dev
```

Leave `NEXT_PUBLIC_DEMO_MODE=true` for a local UI preview. Demo approval actions work locally and the API returns a demo success response.

Run the unit suite with `npm test` (`node --test` over the `*.test.ts` files; it strips TypeScript
inline, so it needs Node 22.6+, and is verified on Node 24).

## 2. Connect existing Supabase

Set:

```env
NEXT_PUBLIC_DEMO_MODE=false
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

Apply:

```text
supabase/migrations/001_marketing_os.sql
```

Because `marketing` is a custom schema, add it to the project's exposed API schemas in Supabase API settings before using PostgREST queries from the dashboard.

Then add your owner account to the allowlist **from the Supabase SQL editor/service role** after that account exists in Supabase Auth. Normal authenticated users cannot self-enroll:

```sql
insert into marketing.members(user_id, role)
values ('YOUR_AUTH_USER_UUID', 'OWNER');
```

Create a **private** Storage bucket named `marketing-assets`. Keep original media intact and store searchable metadata in `marketing.assets`.

## 3. Authentication

Production mode uses Supabase cookie-based SSR auth. The Next.js 16 proxy refreshes the session and redirects unauthenticated users to `/login`.

The SQL migration enables RLS across the `marketing` schema. Only users in `marketing.members` should be granted dashboard access.

## 4. Trigger.dev

Create a Trigger.dev project, then set:

```env
TRIGGER_PROJECT_REF=...
TRIGGER_SECRET_KEY=...
```

Run:

```bash
npm run trigger:dev
```

The project contains:

- `weekly-content-planner`
- `media-ingestion`
- `content-workflow` human-approval skeleton

The content workflow uses durable Trigger.dev waitpoints; wire the approval API to its run/token when moving from the scaffold to production automation.

## 5. AI gateway

The AI adapter is provider/model-swappable. Set a low-cost gateway and an open-weight model:

```env
OPENROUTER_API_KEY=...
AI_MODEL=<your chosen open-weight model>
```

No model name is hardcoded so you can change models when price/quality shifts without code changes.

The brief generator returns a structured brief — hook, script, caption, CTA, audience and
performance hypothesis. The approval gate displays all of them, and approving records one
`content_versions` row per component and writes the approved copy onto the content item.

Use provider-side spend limits. Recommended MVP allocation: **$5–10/month max**.

## 6. Publishing

Publishing is **manual by default**. V1 requires final human approval, and the operator posts by
hand — no platform credentials needed.

1. A scheduled post is approved (`SCHEDULED → APPROVED`).
2. It then appears on **Publishing**. Attach footage from the asset library, copy the approved text
   (hook, script, caption, CTA), download the media via short-lived signed links, and use
   **Mark as posted** — paste the post URL afterwards and its shortcode is stored on the publication
   so per-post metrics can find it later.
3. The platform-API delivery path still exists (`decision: "DELIVER"` behind `lib/publishing/`). It
   throws until Instagram/TikTok credentials are present, so it can never publish by accident.

Note: there is no renderer yet (FFmpeg / Motion Canvas is a later step), so the media offered for
download is whatever was uploaded to Storage and linked to the content item — not a rendered MP4.

## 7. Data integration with the existing app

Never expose member detail to the Marketing OS. Attribution works from opaque references and
aggregates only. There are two supported paths.

### Push conversions (recommended)

Set a shared secret and have the main app post conversion events server-to-server:

```env
MARKETING_INGEST_SECRET=<openssl rand -hex 32>
```

```bash
curl -X POST https://marketing.tripleonebars.com/api/conversions \
  -H "Authorization: Bearer $MARKETING_INGEST_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "eventType": "SIGNUP",
    "externalEventId": "app-signup-9f86d081",
    "occurredAt": "2026-09-17T12:00:00Z",
    "anonymousOrUserRef": "sha256:9f86d081",
    "utmSource": "instagram",
    "utmMedium": "organic_social",
    "utmCampaign": "<campaign_slug>",
    "utmContent": "<content_id>"
  }'
```

Accepted `eventType` values: `APP_VISIT`, `SIGNUP`, `BOOKING`, `MEMBERSHIP`. A batch of up to 200
events can be sent as `{ "events": [ ... ] }`.

- `externalEventId` makes ingest idempotent — replays are counted as `duplicates` and skipped.
- `anonymousOrUserRef` must be an opaque reference. Emails and phone numbers are rejected, so PII
  cannot enter the workflow.
- `utmContent` may be a content item UUID; a non-UUID value is kept as text for traceability.
- `utmCampaign` should be a campaign's **slug** — the ingest resolves it to that campaign, so the
  campaign detail page reports the attributed outcome. Unresolvable values are kept as raw text.
- Unknown `contentItemId` / `campaignId` / `publicationId` values are dropped rather than failing
  the batch.

Capture UTMs on visits and preserve them through signup/booking where possible:

```text
utm_source=instagram
utm_medium=organic_social
utm_campaign=<campaign_slug>
utm_content=<content_id>
```

### Query the attribution views

`supabase/migrations/002_attribution_views.sql` adds read-only views over `marketing.*` only. They
run as the caller, so the existing `has_access()` RLS still applies, and they expose no member-level
fields. Use them from the dashboard or BI instead of the app's own tables:

- `marketing.attribution_conversions` — one row per conversion, joined to content, campaign, platform.
- `marketing.attribution_content_performance` — per content: platform reach/engagement + attributed funnel counts.
- `marketing.attribution_campaign_summary` — per campaign: awareness-to-membership counts.
- `marketing.attribution_daily` — daily funnel counts for trend charts.

If you prefer to read the app's own tables directly instead of pushing, the migration ends with a
commented template — fill in the real table/column names and uncomment it. Keep each view limited to
attribution fields (dates + source/campaign/content id).

### Populate platform metrics

`marketing.metrics` is an append-only snapshot series. Two ways to fill it:

- **Scheduled** — `metrics-sync` runs daily at 06:00 Africa/Cairo once the Trigger.dev tasks are
  deployed, and snapshots every published post.
- **Manual** — Analytics → **Sync metrics** runs the same sync on demand via `POST /api/metrics/sync`
  (allowlisted marketing users only).

With Instagram/TikTok credentials present, each snapshot pulls live platform insights and normalizes
them; without credentials it writes zero-filled rows so the funnel and timeline stay live and every
sync is an auditable point in time. Dashboard aggregates read `marketing.metrics_latest` — the newest
snapshot per publication — so repeated syncs never inflate reach or engagement.

**Account-level numbers are entered by hand.** Reach and profile visits exist only in the native
Insights screen (or the official API) — they never appear on a public page, so they cannot be
scraped by anything. Analytics has an **Enter weekly numbers** form that writes to
`marketing.account_metrics` (reach, profile visits, followers, and engagement if you have it);
`account_metrics_latest` keeps the newest snapshot per platform, and reach/profile visits prefer
those values over per-post sums. Entry is partial-update safe: a blank field keeps its previous
value, so updating only followers does not zero reach.

## $20 monthly operating target

Incremental target, excluding your existing Supabase/webapp spend:

- Dashboard hosting: $0 free tier target
- Trigger.dev: $0–10
- AI usage: $5–10 hard cap
- Supabase Storage: reuse existing project initially
- Social APIs: $0
- Open-source creative tooling: $0

Do not add R2 or another CRM until actual usage requires them.

## Build sequence from here

1. Connect real Supabase and owner auth.
2. Replace mock dashboard loaders with `marketing.*` queries.
3. Build asset upload/indexing pipeline.
4. Connect AI generation and scoring.
5. Connect Trigger.dev reloop/approval tokens.
6. Add real Meta/TikTok publishing adapters.
7. Connect platform analytics and app conversion attribution.
8. Add FFmpeg/Motion Canvas render service once asset workflow is proven.

## Fonts

The CSS asks for Bebas Neue / Inter / JetBrains Mono with safe fallbacks. No font files are bundled. Self-host your licensed/open font files in production if you want pixel-identical typography.
