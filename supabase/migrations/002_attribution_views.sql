-- TripleOne Marketing OS v2 — attribution ingestion + read-only views
-- Apply after 001_marketing_os.sql, to the same existing TripleOne Supabase project.
--
-- This migration does two things:
--   1. Makes marketing.conversions safe to receive server-to-server events
--      (idempotency key + query indexes).
--   2. Adds read-only attribution views over marketing.* only. They expose
--      aggregate/attribution fields, never member-level detail, and run as the
--      caller (security_invoker) so the existing has_access() RLS still applies.

-- ---------------------------------------------------------------------------
-- 1. Ingestion support
-- ---------------------------------------------------------------------------

-- Opaque idempotency key supplied by the calling app (e.g. the app's own event id).
-- A plain unique index allows many NULLs, so events without a key are still insertable,
-- while replayed events with a key are deduplicated by the API.
alter table marketing.conversions
  add column if not exists external_event_id text;

create unique index if not exists uq_conversions_external_event
  on marketing.conversions(external_event_id);

create index if not exists idx_conversions_type_time
  on marketing.conversions(event_type, occurred_at desc);

create index if not exists idx_conversions_content
  on marketing.conversions(content_item_id);

create index if not exists idx_conversions_campaign
  on marketing.conversions(campaign_id);

create index if not exists idx_conversions_utm_campaign
  on marketing.conversions(utm_campaign);

-- ---------------------------------------------------------------------------
-- 2. Read-only attribution views (marketing schema only)
-- ---------------------------------------------------------------------------

-- One row per attributed conversion, with human-readable content/campaign/platform.
-- The anonymous reference is intentionally reduced to a boolean.
create or replace view marketing.attribution_conversions
with (security_invoker = true) as
select
  c.id,
  c.event_type,
  c.occurred_at,
  c.source,
  c.medium,
  c.utm_campaign,
  c.utm_content,
  c.content_item_id,
  ci.title       as content_title,
  ci.content_type,
  ci.objective,
  c.campaign_id,
  camp.name      as campaign_name,
  c.publication_id,
  p.platform,
  (c.anonymous_or_user_ref is not null) as identified
from marketing.conversions c
left join marketing.content_items ci on ci.id = c.content_item_id
left join marketing.campaigns camp on camp.id = c.campaign_id
left join marketing.publications p on p.id = c.publication_id;

-- Per-content rollup: platform reach/engagement plus attributed funnel counts.
create or replace view marketing.attribution_content_performance
with (security_invoker = true) as
with platform as (
  select
    p.content_item_id,
    sum(coalesce(me.reach, 0))   as reach,
    sum(coalesce(me.views, 0))   as views,
    sum(
      coalesce(me.likes, 0) + coalesce(me.comments, 0) +
      coalesce(me.shares, 0) + coalesce(me.saves, 0)
    ) as engagement
  from marketing.metrics me
  join marketing.publications p on p.id = me.publication_id
  where p.content_item_id is not null
  group by p.content_item_id
),
attribution as (
  select
    content_item_id,
    count(*) filter (where event_type = 'APP_VISIT')  as app_visits,
    count(*) filter (where event_type = 'SIGNUP')     as signups,
    count(*) filter (where event_type = 'BOOKING')    as bookings,
    count(*) filter (where event_type = 'MEMBERSHIP') as memberships
  from marketing.conversions
  where content_item_id is not null
  group by content_item_id
)
select
  ci.id as content_item_id,
  ci.title,
  ci.content_type,
  ci.objective,
  ci.language_mode,
  ci.status,
  coalesce(platform.reach, 0)       as reach,
  coalesce(platform.views, 0)       as views,
  coalesce(platform.engagement, 0)  as engagement,
  coalesce(attribution.app_visits, 0)  as app_visits,
  coalesce(attribution.signups, 0)     as signups,
  coalesce(attribution.bookings, 0)    as bookings,
  coalesce(attribution.memberships, 0) as memberships
from marketing.content_items ci
left join platform    on platform.content_item_id = ci.id
left join attribution on attribution.content_item_id = ci.id;

-- Per-campaign rollup for awareness -> membership reporting.
create or replace view marketing.attribution_campaign_summary
with (security_invoker = true) as
select
  camp.id,
  camp.name,
  camp.objective,
  camp.status,
  camp.starts_at,
  camp.ends_at,
  count(conv.id) filter (where conv.event_type = 'APP_VISIT')  as app_visits,
  count(conv.id) filter (where conv.event_type = 'SIGNUP')     as signups,
  count(conv.id) filter (where conv.event_type = 'BOOKING')    as bookings,
  count(conv.id) filter (where conv.event_type = 'MEMBERSHIP') as memberships
from marketing.campaigns camp
left join marketing.conversions conv on conv.campaign_id = camp.id
group by camp.id, camp.name, camp.objective, camp.status, camp.starts_at, camp.ends_at;

-- Daily funnel counts, for trend charts.
create or replace view marketing.attribution_daily
with (security_invoker = true) as
select
  date_trunc('day', occurred_at) as day,
  event_type,
  count(*) as events
from marketing.conversions
group by date_trunc('day', occurred_at), event_type;

grant select on marketing.attribution_conversions          to authenticated, service_role;
grant select on marketing.attribution_content_performance  to authenticated, service_role;
grant select on marketing.attribution_campaign_summary     to authenticated, service_role;
grant select on marketing.attribution_daily                to authenticated, service_role;

notify pgrst, 'reload schema';

-- ---------------------------------------------------------------------------
-- 3. OPTIONAL — map the existing app's tables into read-only attribution views
-- ---------------------------------------------------------------------------
-- The ingestion API (POST /api/conversions) is the recommended path: the main app
-- pushes only the attribution fields it needs, and no member rows are exposed here.
--
-- If you would rather read the app's own tables directly, fill in the placeholders
-- below with the real schema/table/column names from the existing TripleOne app and
-- uncomment. Keep each view limited to attribution fields (dates + source/campaign/
-- content id). Do NOT expose names, emails, phones or payment data.
--
-- create or replace view marketing.attribution_app_signups
-- with (security_invoker = true) as
-- select
--   s.id,
--   s.created_at      as occurred_at,
--   s.utm_source      as source,
--   s.utm_medium      as medium,
--   s.utm_campaign    as utm_campaign,
--   s.utm_content     as utm_content
-- from public.YOUR_SIGNUP_TABLE s;
--
-- create or replace view marketing.attribution_app_memberships
-- with (security_invoker = true) as
-- select
--   m.id,
--   m.started_at      as occurred_at,
--   m.utm_source      as source,
--   m.utm_medium      as medium,
--   m.utm_campaign    as utm_campaign,
--   m.utm_content     as utm_content
-- from public.YOUR_MEMBERSHIP_TABLE m;
--
-- create or replace view marketing.attribution_app_bookings
-- with (security_invoker = true) as
-- select
--   b.id,
--   b.created_at      as occurred_at,
--   b.utm_source      as source,
--   b.utm_medium      as medium,
--   b.utm_campaign    as utm_campaign,
--   b.utm_content     as utm_content
-- from public.YOUR_BOOKING_TABLE b;
--
-- grant select on marketing.attribution_app_signups      to authenticated, service_role;
-- grant select on marketing.attribution_app_memberships  to authenticated, service_role;
-- grant select on marketing.attribution_app_bookings     to authenticated, service_role;
