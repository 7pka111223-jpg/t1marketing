# Deploying TripleOne Marketing OS

Target: `marketing.tripleonebars.com` on Vercel, backed by the existing TripleOne Supabase project.

---

## 1. Supabase prerequisites (once)

1. Apply the migrations in order in the SQL editor of the existing project:
   `supabase/migrations/001_marketing_os.sql`, then `002_attribution_views.sql`, then
   `003_metrics_latest_view.sql`, then `004_campaign_slug_and_summary.sql`.
   Order matters: 004 depends on the `metrics_latest` view created by 003.
2. Expose the custom schema: **Project Settings → API → Exposed schemas** → add `marketing`
   (PostgREST queries fail without this).
3. Create a **private** Storage bucket named `marketing-assets`.
4. After your dashboard login account exists in Supabase Auth, add it to the allowlist from the
   SQL editor (authenticated users cannot self-enroll):

   ```sql
   insert into marketing.members(user_id, role)
   values ('YOUR_AUTH_USER_UUID', 'OWNER');
   ```

## 2. Environment variables

Set these in Vercel for **Production** and **Preview**. Never commit them.

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_DEMO_MODE` | Public | `false` in production. Anything else (or a missing Supabase URL) forces demo mode. |
| `NEXT_PUBLIC_SUPABASE_URL` | Public | Existing TripleOne project URL. |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Public | Publishable/anon key. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server only | Used by Trigger.dev tasks, publishing, and conversion ingest. Never expose to the browser. |
| `MARKETING_INGEST_SECRET` | Server only | Shared secret the main app sends to `POST /api/conversions`. Generate with `openssl rand -hex 32`. |
| `NEXT_PUBLIC_APP_URL` | Public | `https://marketing.tripleonebars.com`. |
| `TRIGGER_PROJECT_REF` / `TRIGGER_SECRET_KEY` | Server only | Only when Trigger.dev tasks are deployed. |
| `OPENROUTER_API_KEY` / `AI_MODEL` / `AI_BASE_URL` | Server only | AI gateway. Model is env-selected, never hardcoded. |
| `INSTAGRAM_ACCESS_TOKEN` / `INSTAGRAM_BUSINESS_ACCOUNT_ID` | Server only | Only after Meta app approval. |
| `TIKTOK_ACCESS_TOKEN` / `TIKTOK_OPEN_ID` | Server only | Only after TikTok Content Posting approval. |

## 3. Vercel setup

1. Push this project to a Git remote (Vercel deploys from Git). If the folder is not yet a repo:
   ```bash
   git init && git add . && git commit -m "TripleOne Marketing OS"
   git remote add origin <your-repo-url> && git push -u origin main
   ```
2. In Vercel: **Add New → Project → import the repo**. The framework preset is detected as
   Next.js; keep the default build command (`next build`) and output.
3. Add the environment variables from the table above to Production and Preview.
4. Deploy, then attach the `marketing.tripleonebars.com` domain under **Settings → Domains**.

No `vercel.json` is required: the Next.js preset, the root `proxy.ts` middleware and the App Router
API routes all deploy as-is.

## 4. Trigger.dev

```bash
npm run trigger:deploy
```

`weekly-content-planner` (Sun 08:00 Africa/Cairo), `metrics-sync` (daily 06:00 Africa/Cairo) and
`media-ingestion` run against Supabase using the service-role key. `content-workflow` is the durable
human-approval skeleton.

## 5. Post-deploy smoke test

1. Signed out → any dashboard route redirects to `/login`.
2. Sign in with an allowlisted account → Command Center loads.
3. A signed-in account that is **not** in `marketing.members` lands on `/unauthorized`.
4. Research → **Run signal scan** creates opportunities (needs the AI gateway configured).
5. Content → **New content** creates an Ideas card.
6. Approvals → Approve writes a `marketing.approvals` row, a `marketing.content_versions` row, and
   advances the item's status.
7. Settings → **Connections** reflects the real env state.
8. `POST /api/conversions` with the ingest secret and a `SIGNUP` event returns `{ ok: true }`; a
   request without the secret returns `401`.
9. Analytics → **Sync metrics** captures one snapshot per published post and the funnel fills in
   from `marketing.metrics_latest`.
10. Campaigns → open a campaign: the detail page shows attributed reach/signups/memberships and its
    linked content. A conversion posted with `utm_campaign=<campaign slug>` attaches to that campaign.

## Cost guardrails

Keep incremental cost at or below **$20/month**: Vercel free/hobby tier, Trigger.dev free–$10,
AI gateway hard-capped at $5–10, reuse the existing Supabase project and Storage.
