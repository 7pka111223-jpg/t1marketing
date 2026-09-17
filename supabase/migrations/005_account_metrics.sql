-- TripleOne Marketing OS v5 — account-level metrics
-- Apply after 004_campaign_slug_and_summary.sql.
--
-- Account reach and profile visits only exist at the account level (the Insights screen or the
-- official API) — they are never rendered on a public page and cannot be scraped. They also have
-- nowhere to live today: marketing.metrics.publication_id is NOT NULL, so every row must belong to
-- one post. This table holds account-level snapshots, entered by hand or filled by a later sync.

create table if not exists marketing.account_metrics (
  id bigint generated always as identity primary key,
  platform text not null check (platform in ('INSTAGRAM', 'TIKTOK')),
  captured_at timestamptz not null default now(),
  reach bigint,
  profile_visits bigint,
  followers bigint,
  views bigint,
  likes bigint,
  comments bigint,
  shares bigint,
  saves bigint,
  source text not null default 'MANUAL' check (source in ('MANUAL', 'SCRAPER', 'API')),
  raw jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_account_metrics_platform_time
  on marketing.account_metrics(platform, captured_at desc);

-- Newest snapshot per platform, so repeated weekly entries do not inflate the aggregates.
create or replace view marketing.account_metrics_latest
with (security_invoker = true) as
select distinct on (platform)
  id,
  platform,
  captured_at,
  reach,
  profile_visits,
  followers,
  views,
  likes,
  comments,
  shares,
  saves,
  source
from marketing.account_metrics
order by platform, captured_at desc, id desc;

alter table marketing.account_metrics enable row level security;

grant select, insert, update, delete on marketing.account_metrics to authenticated, service_role;
grant select on marketing.account_metrics_latest to authenticated, service_role;

drop policy if exists marketing_access on marketing.account_metrics;
create policy marketing_access on marketing.account_metrics
  for all to authenticated
  using (marketing.has_access())
  with check (marketing.has_access());

notify pgrst, 'reload schema';
