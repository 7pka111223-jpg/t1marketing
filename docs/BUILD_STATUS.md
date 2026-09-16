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
  Command Center, Research, Content, Creative, Approvals, Calendar, Audience, Analytics, Settings
- Research opportunities from Supabase with an AI signal scan
- Convert research opportunity into a content item, generating a brief when the AI gateway is set
- Content Kanban from Supabase; New Content dialog creates items
- Approval queue from Supabase with Approve / Edit / Reloop / Reject audit logging
- Approval advances content via the shared status machine (`lib/marketing/status.ts`), records
  approved `content_versions`, and writes `approved_hook` / `approved_caption`
- Reloop writes a `content_versions` row and reopens the correct review stage
- Marketing-cleared media upload to private Supabase Storage, with asset metadata insert
- Calendar week navigation backed by `scheduled_at`
- Audience signals from `marketing.signals`
- Analytics funnel and "what converts" from `marketing.metrics` + `marketing.conversions`
- Toasts and `router.refresh()` so server data updates after every mutation
- Trigger.dev `weekly-content-planner` and `media-ingestion` implemented (service-role client)
- `content-workflow` waitpoint wired end to end: converting an opportunity starts the run, the run
  stores its approval token on the content item, and an approval decision completes the token
- Instagram / TikTok publishing adapters implemented behind the APPROVED-publication guard
- Mobile navigation reaches every destination (scrollable bottom bar)
- Deployment guide in `docs/DEPLOYMENT.md`
- **Connected to the live Supabase project** (`bpltbnlpkuebhxgbbxrk`), demo mode off:
  `marketing` schema applied (16 tables), schema exposed to the Data API, private
  `marketing-assets` bucket with 4 storage policies, and an OWNER allowlist row. Sign-in verified.

## Remaining work

1. Map existing app signup/booking/membership tables into read-only marketing attribution views.
2. Create the Trigger.dev project and deploy the tasks (`SUPABASE_SERVICE_ROLE_KEY` + Trigger env).
3. Select and fund an open-weight AI model gateway with a hard spend cap (enables Run signal scan
   and AI brief generation).
4. Create Meta/TikTok developer apps and obtain publishing permissions.
5. Populate `marketing.metrics` from platform analytics so Analytics and Command Center fill in.
6. Push to a Git remote and deploy to Vercel (see `docs/DEPLOYMENT.md`).

## Validation performed

- `npm install` (remember: this environment had `NODE_ENV=production`, which skips devDependencies —
  use `npm install --include=dev`).
- `npm run typecheck` — clean.
- `npm run build` — succeeds; all routes compile and fonts resolve.
- Demo smoke test — all 11 routes return 200.
