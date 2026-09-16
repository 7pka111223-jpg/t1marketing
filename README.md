# TripleOne Marketing OS — $20 Plan MVP

Standalone internal dashboard for TripleOneBars marketing operations. It is designed around a human-in-the-loop workflow:

**research → content → creative → approval → schedule/publish → attribution → learning**

The UI follows the supplied TripleOneBars design system: Triple Red `#E10600`, black/white structure, sharp geometry, Bebas-style display typography, Inter-style UI copy, and approval-first operations.

## What is implemented

- Responsive standalone dashboard shell (`marketing.tripleonebars.com` target)
- Command Center
- Ranked Research opportunities
- Content Kanban
- Creative Studio / asset-library shell
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

Use provider-side spend limits. Recommended MVP allocation: **$5–10/month max**.

## 6. Publishing

Publishing is intentionally **not auto-enabled** in this scaffold. V1 requires final human approval. The adapter boundary exists in `lib/publishing/`.

Next production step:

1. Create/approve Meta app + Instagram publishing permissions.
2. Create/approve TikTok Content Posting integration.
3. Implement each adapter behind `publish()`.
4. Store external IDs and errors in `marketing.publications`.
5. Never call the adapter unless the publication record is `APPROVED`.

This avoids unsafe accidental public publishing while credentials are incomplete.

## 7. Data integration with the existing app

Do not expose unnecessary member details to the Marketing OS. Create read-only views containing only attribution fields needed for marketing, for example:

- signup date
- first booking date
- membership date
- source / campaign / content ID

Capture UTMs/content IDs on visits and preserve them through signup/booking where possible:

```text
utm_source=instagram
utm_medium=organic_social
utm_campaign=<campaign_slug>
utm_content=<content_id>
```

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
