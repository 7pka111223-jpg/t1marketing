-- TripleOne Marketing OS v4 — campaign slugs + campaign attribution summary
-- Apply after 003_metrics_latest_view.sql (the summary view joins metrics_latest).
--
-- campaigns.slug is what the main app sends as utm_campaign, so ingested conversions can be
-- attributed to a campaign instead of landing as unattached free text.

-- ---------------------------------------------------------------------------
-- 1. Campaign slug
-- ---------------------------------------------------------------------------

alter table marketing.campaigns
  add column if not exists slug text;

-- Backfill existing rows. Numbered partition keeps the backfill unique even when two
-- campaigns share a name, so the unique index below cannot fail.
with base as (
  select
    id,
    nullif(trim(both '-' from regexp_replace(lower(name), '[^[:alnum:]]+', '-', 'g')), '') as slug
  from marketing.campaigns
  where slug is null
),
numbered as (
  select
    id,
    coalesce(slug, 'campaign-' || left(id::text, 8)) as slug,
    row_number() over (partition by coalesce(slug, 'campaign-' || left(id::text, 8)) order by id) as rn
  from base
)
update marketing.campaigns c
set slug = case when n.rn = 1 then n.slug else n.slug || '-' || n.rn end
from numbered n
where c.id = n.id;

update marketing.campaigns
set slug = 'campaign-' || left(id::text, 8)
where slug is null or slug = '';

alter table marketing.campaigns alter column slug set not null;

create unique index if not exists uq_campaigns_slug on marketing.campaigns(slug);

-- ---------------------------------------------------------------------------
-- 2. Campaign attribution summary (replaces the 002 version)
-- ---------------------------------------------------------------------------

-- Dropped rather than replaced: the 002 view had a different column order and
-- CREATE OR REPLACE VIEW cannot insert columns in the middle. Nothing depends on it.
drop view if exists marketing.attribution_campaign_summary;

create view marketing.attribution_campaign_summary
with (security_invoker = true) as
with platform as (
  select
    ci.campaign_id,
    sum(coalesce(ml.reach, 0))  as reach,
    sum(coalesce(ml.views, 0))  as views,
    sum(
      coalesce(ml.likes, 0) + coalesce(ml.comments, 0) +
      coalesce(ml.shares, 0) + coalesce(ml.saves, 0)
    ) as engagement
  from marketing.publications p
  join marketing.content_items ci on ci.id = p.content_item_id
  join marketing.metrics_latest ml on ml.publication_id = p.id
  where ci.campaign_id is not null
  group by ci.campaign_id
),
attribution as (
  select
    campaign_id,
    count(*) filter (where event_type = 'APP_VISIT')  as app_visits,
    count(*) filter (where event_type = 'SIGNUP')     as signups,
    count(*) filter (where event_type = 'BOOKING')    as bookings,
    count(*) filter (where event_type = 'MEMBERSHIP') as memberships
  from marketing.conversions
  where campaign_id is not null
  group by campaign_id
)
select
  camp.id,
  camp.name,
  camp.slug,
  camp.objective,
  camp.status,
  camp.starts_at,
  camp.ends_at,
  coalesce(platform.reach, 0)          as reach,
  coalesce(platform.views, 0)          as views,
  coalesce(platform.engagement, 0)     as engagement,
  coalesce(attribution.app_visits, 0)  as app_visits,
  coalesce(attribution.signups, 0)     as signups,
  coalesce(attribution.bookings, 0)    as bookings,
  coalesce(attribution.memberships, 0) as memberships
from marketing.campaigns camp
left join platform    on platform.campaign_id = camp.id
left join attribution on attribution.campaign_id = camp.id;

grant select on marketing.attribution_campaign_summary to authenticated, service_role;

notify pgrst, 'reload schema';
