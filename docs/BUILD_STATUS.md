# Build Status — TripleOne Marketing OS

## Ready now

- Standalone Next.js dashboard with the TripleOne brand system, real Bebas Neue / Inter / JetBrains
  Mono fonts loaded via `next/font`
- Responsive desktop/mobile navigation; sidebar reflects demo vs live mode
- Supabase SSR login and session proxy
- Marketing-user allowlist and role model, enforced in the layout **and** on every mutating API route
- RLS migration for the full `marketing` schema
- Shared config module (`lib/config.ts`) — one demo-mode predicate, no duplicated checks
- Resilient data layer (`lib/data/marketing.ts`) — getters log and degrade instead of crashing render
- Dashboard loading skeleton, error boundary and empty states
- Every dashboard page is wired to live `marketing.*` queries with a demo fallback:
  Command Center, Research, Campaigns, Content, Creative, Approvals, Calendar, Audience, Analytics,
  Settings
- Campaigns: list with objective/status/window/linked-content, creation, and a tested lifecycle
  status machine (draft → active ⇄ paused → completed → archived); content items can be created
  against a campaign
- Campaign attribution: every campaign carries a unique slug (unicode-safe, so Arabic names keep
  meaning), conversion ingest resolves `utm_campaign` to that campaign, and a campaign detail page
  reports attributed reach/engagement plus signups/bookings/memberships and its linked content
- Research opportunities from Supabase with an AI signal scan
- Convert research opportunity into a content item, generating a brief when the AI gateway is set
- Content Kanban from Supabase; New Content dialog creates items
- Approval queue from Supabase with Approve / Edit / Reloop / Reject audit logging
- Approval advances content via the shared status machine (`lib/marketing/status.ts`), records
  approved `content_versions`, and writes `approved_hook` / `approved_script` / `approved_caption` /
  `approved_cta`
- AI brief covers hook, script, caption, CTA, audience and performance hypothesis; the review panel
  shows every one of them, so the human approves exactly what is persisted
- Reloop writes a `content_versions` row and reopens the correct review stage
- Marketing-cleared media upload to private Supabase Storage, with asset metadata insert
- Creative Studio renders the real `marketing.creatives` render queue with each creative's render
  status, and the asset-library search filters the indexed media
- Content Kanban cards show real pipeline progress (`lib/marketing/pipeline.ts`) and their status
  instead of placeholder bars
- Asset indexing is triggered server-side via `POST /api/assets/[id]/ingest` — a client component
  importing the server-only `@trigger.dev/sdk` used to break `/creative` in dev
- Calendar week navigation backed by `scheduled_at`
- Audience signals from `marketing.signals`
- Analytics funnel and "what converts" from `marketing.metrics` + `marketing.conversions`
- Toasts and `router.refresh()` so server data updates after every mutation
- Trigger.dev `weekly-content-planner` and `media-ingestion` implemented (service-role client)
- `content-workflow` waitpoint wired end to end: converting an opportunity starts the run, the run
  stores its approval token on the content item, and an approval decision completes the token
- Instagram / TikTok publishing adapters implemented behind the APPROVED-publication guard
- Server-to-server conversion ingest (`POST /api/conversions`): shared-secret auth, batch support,
  idempotency keys, strict field whitelisting and a PII guard that rejects emails/phone numbers
- Read-only attribution views (`marketing.attribution_conversions`,
  `attribution_content_performance`, `attribution_campaign_summary`, `attribution_daily`) that run
  as the caller so `has_access()` RLS still applies
- Conversion ingest readiness surfaced on Settings → Connections
- Platform insights adapter (`lib/insights`) for Instagram + TikTok, with pure, unit-tested parsers
- `metrics-sync` scheduled daily (06:00 Africa/Cairo) and runnable on demand via
  `POST /api/metrics/sync`, surfaced as Analytics → **Sync metrics**
- Dashboard aggregates read `marketing.metrics_latest` (newest snapshot per publication), so repeated
  syncs never inflate reach or engagement
- Mobile navigation reaches every destination (scrollable bottom bar)
- Deployment guide in `docs/DEPLOYMENT.md`
- **Connected to the live Supabase project** (`bpltbnlpkuebhxgbbxrk`), demo mode off:
  `marketing` schema applied (16 tables), schema exposed to the Data API, private
  `marketing-assets` bucket with 4 storage policies, and an OWNER allowlist row. Sign-in verified.

## Remaining work

1. Fill in the app-table mapping template at the end of `002_attribution_views.sql` with the main
   app's signup/booking/membership table and column names (only needed if you prefer reading those
   tables directly instead of pushing events to `POST /api/conversions`).
2. Create the Trigger.dev project and deploy the tasks (`SUPABASE_SERVICE_ROLE_KEY` + Trigger env).
3. Select and fund an open-weight AI model gateway with a hard spend cap (enables Run signal scan
   and AI brief generation).
4. Create Meta/TikTok developer apps and obtain publishing permissions.
5. Obtain Instagram/TikTok API access so `metrics-sync` pulls live insights instead of zero-filled
   snapshots — Analytics and Command Center then fill in with real numbers.
6. Push to a Git remote and deploy to Vercel (see `docs/DEPLOYMENT.md`).

## Validation performed

- `npm install` (remember: this environment had `NODE_ENV=production`, which skips devDependencies —
  use `npm install --include=dev`).
- `npm run typecheck` — clean.
- `npm run build` — succeeds; all routes compile and fonts resolve.
- Demo smoke test — all dashboard routes return 200.
- `npm test` (alias for `node --test`) — 64/64 pass: brief normalization, campaign slugify
  (unicode/Arabic, truncation), campaign lifecycle transitions, content pipeline progress,
  render-status progress, conversion-ingest validation/PII, Instagram + TikTok insight parsing,
  metrics row shaping, plus the existing status/guard/normalize suites.
- Runtime smoke tests: `POST /api/conversions` (single, batch, PII/enum rejections);
  `POST /api/metrics/sync` (demo payload in demo mode, `401` unauthenticated in live mode);
  `POST /api/assets/[id]/ingest` (demo payload, `401` unauthenticated in live mode);
  `/campaigns` renders with lifecycle actions and links to a campaign detail page; the detail page
  shows attributed outcome, linked content and its `utm_campaign` slug;
  `POST /api/campaigns` rejects a missing name and `PATCH /api/campaigns/[id]` rejects an unknown
  status; Analytics renders with the **Sync metrics** action; `/creative` and `/content` render
  their real render queue, search and pipeline progress; `/approvals` shows the script and CTA
  blocks and a decision is accepted.
- Known Next.js streaming tradeoff: an unknown campaign id renders the not-found UI but returns
  `200`, because `app/(dashboard)/loading.tsx` commits the response before the page throws
  `notFound()`. A route that does not exist at all still returns `404`.
