-- TripleOne Marketing OS v1
-- Apply to the existing TripleOne Supabase project.

create schema if not exists marketing;
grant usage on schema marketing to authenticated, service_role;

create extension if not exists pgcrypto;

create table if not exists marketing.members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'OWNER' check (role in ('OWNER','MARKETING_ADMIN','CONTENT_CREATOR','EDITOR','PUBLISHER','VIEWER')),
  created_at timestamptz not null default now()
);

create or replace function marketing.has_access()
returns boolean
language sql
stable
security definer
set search_path = marketing, public
as $$ select exists(select 1 from marketing.members m where m.user_id = auth.uid()); $$;

create or replace function marketing.is_owner()
returns boolean
language sql
stable
security definer
set search_path = marketing, public
as $$ select exists(select 1 from marketing.members m where m.user_id = auth.uid() and m.role = 'OWNER'); $$;

create table if not exists marketing.brand_rules (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  version text not null,
  rules jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketing.campaigns (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  objective text not null check (objective in ('BRAND_AWARENESS','MEMBERSHIPS','BOTH')),
  status text not null default 'DRAFT' check (status in ('DRAFT','ACTIVE','PAUSED','COMPLETED','ARCHIVED')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketing.signals (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  kind text not null,
  title text not null,
  summary text,
  payload jsonb not null default '{}'::jsonb,
  momentum numeric,
  observed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table if not exists marketing.opportunities (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  status text not null default 'NEW' check (status in ('NEW','SAVED','APPROVED','IGNORED','CONVERTED')),
  recommended_format text check (recommended_format in ('REEL','CAROUSEL','STORY','STATIC')),
  language_mode text not null default 'MIXED' check (language_mode in ('EN','AR_EG','MIXED')),
  total_score numeric not null default 0,
  scores jsonb not null default '{}'::jsonb,
  reason text,
  asset_count integer not null default 0,
  signal_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketing.content_items (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid references marketing.campaigns(id) on delete set null,
  opportunity_id uuid references marketing.opportunities(id) on delete set null,
  title text not null,
  content_type text not null check (content_type in ('REEL','CAROUSEL','STORY','STATIC')),
  pillar text not null check (pillar in ('EDUCATION','COMMUNITY','CULTURE','CHALLENGE','CONVERSION')),
  objective text not null check (objective in ('BRAND_AWARENESS','MEMBERSHIPS','BOTH')),
  language_mode text not null default 'MIXED' check (language_mode in ('EN','AR_EG','MIXED')),
  status text not null default 'IDEA' check (status in ('IDEA','RESEARCHED','BRIEF_REVIEW','BRIEF_APPROVED','COPY_REVIEW','COPY_APPROVED','CREATIVE_REVIEW','CREATIVE_APPROVED','READY_TO_SCHEDULE','SCHEDULED','PUBLISHED','ANALYZED','ARCHIVED')),
  priority smallint not null default 3 check (priority between 1 and 5),
  brief jsonb not null default '{}'::jsonb,
  approved_hook text,
  approved_script text,
  approved_caption text,
  approved_cta text,
  scheduled_at timestamptz,
  published_at timestamptz,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketing.content_versions (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references marketing.content_items(id) on delete cascade,
  component text not null check (component in ('BRIEF','HOOK','SCRIPT','CAPTION','CTA','ARABIC','ENGLISH','CREATIVE_DIRECTION')),
  version integer not null,
  content text,
  structured_content jsonb,
  scores jsonb not null default '{}'::jsonb,
  is_approved boolean not null default false,
  created_by text not null default 'AI',
  created_at timestamptz not null default now(),
  unique(content_item_id, component, version)
);

create table if not exists marketing.assets (
  id uuid primary key default gen_random_uuid(),
  storage_provider text not null default 'SUPABASE',
  storage_path text not null unique,
  asset_type text not null check (asset_type in ('VIDEO','PHOTO','AUDIO','GRAPHIC')),
  mime_type text,
  duration_seconds numeric,
  width integer,
  height integer,
  orientation text,
  transcript text,
  visual_description text,
  tags text[] not null default '{}',
  movements text[] not null default '{}',
  skill_levels text[] not null default '{}',
  quality_score numeric,
  marketing_cleared boolean not null default false,
  consent_status text not null default 'UNKNOWN' check (consent_status in ('UNKNOWN','CLEARED','RESTRICTED')),
  usage_count integer not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists marketing.asset_usage (
  content_item_id uuid not null references marketing.content_items(id) on delete cascade,
  asset_id uuid not null references marketing.assets(id) on delete restrict,
  usage_role text not null default 'SOURCE',
  start_seconds numeric,
  end_seconds numeric,
  primary key(content_item_id, asset_id, usage_role)
);

create table if not exists marketing.creatives (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references marketing.content_items(id) on delete cascade,
  creative_type text not null check (creative_type in ('REEL','CAROUSEL','STORY','STATIC','THUMBNAIL')),
  version integer not null default 1,
  template_id text,
  output_path text,
  render_status text not null default 'PENDING' check (render_status in ('PENDING','RENDERING','READY','FAILED')),
  render_config jsonb not null default '{}'::jsonb,
  is_approved boolean not null default false,
  created_at timestamptz not null default now(),
  unique(content_item_id, creative_type, version)
);

create table if not exists marketing.approvals (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null,
  entity_id uuid not null,
  stage text not null,
  status text not null default 'PENDING' check (status in ('PENDING','APPROVED','EDITED','RELOOPED','REJECTED')),
  decision text check (decision in ('APPROVE','EDIT','RELOOP','REJECT')),
  feedback text,
  reloop_target text,
  approved_version_id uuid,
  requested_at timestamptz not null default now(),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id),
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists marketing.publications (
  id uuid primary key default gen_random_uuid(),
  content_item_id uuid not null references marketing.content_items(id) on delete cascade,
  creative_id uuid references marketing.creatives(id) on delete set null,
  platform text not null check (platform in ('INSTAGRAM','TIKTOK')),
  status text not null default 'DRAFT' check (status in ('DRAFT','APPROVED','SCHEDULED','PUBLISHING','PUBLISHED','FAILED','CANCELLED')),
  caption text,
  scheduled_at timestamptz,
  published_at timestamptz,
  external_post_id text,
  external_url text,
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists marketing.metrics (
  id bigint generated always as identity primary key,
  publication_id uuid not null references marketing.publications(id) on delete cascade,
  captured_at timestamptz not null default now(),
  views bigint,
  reach bigint,
  likes bigint,
  comments bigint,
  shares bigint,
  saves bigint,
  profile_visits bigint,
  link_clicks bigint,
  follows bigint,
  watch_time_seconds numeric,
  raw jsonb not null default '{}'::jsonb
);

create table if not exists marketing.conversions (
  id uuid primary key default gen_random_uuid(),
  anonymous_or_user_ref text,
  event_type text not null check (event_type in ('APP_VISIT','SIGNUP','BOOKING','MEMBERSHIP')),
  occurred_at timestamptz not null default now(),
  campaign_id uuid references marketing.campaigns(id) on delete set null,
  content_item_id uuid references marketing.content_items(id) on delete set null,
  publication_id uuid references marketing.publications(id) on delete set null,
  source text,
  medium text,
  utm_campaign text,
  utm_content text,
  metadata jsonb not null default '{}'::jsonb
);

create table if not exists marketing.insights (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  title text not null,
  summary text not null,
  evidence jsonb not null default '{}'::jsonb,
  confidence numeric,
  status text not null default 'NEW' check (status in ('NEW','ACCEPTED','DISMISSED','ACTIONED')),
  created_at timestamptz not null default now()
);

create table if not exists marketing.jobs (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  external_run_id text,
  job_type text not null,
  entity_type text,
  entity_id uuid,
  status text not null default 'QUEUED',
  cost_estimate_usd numeric not null default 0,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_content_status on marketing.content_items(status);
create index if not exists idx_approval_pending on marketing.approvals(status, requested_at desc);
create index if not exists idx_publications_schedule on marketing.publications(status, scheduled_at);
create index if not exists idx_metrics_publication_time on marketing.metrics(publication_id, captured_at desc);
create index if not exists idx_assets_tags on marketing.assets using gin(tags);

create or replace function marketing.touch_updated_at()
returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;

do $$
declare t text;
begin
  foreach t in array array['brand_rules','campaigns','opportunities','content_items','assets','jobs'] loop
    execute format('drop trigger if exists trg_touch_updated_at on marketing.%I', t);
    execute format('create trigger trg_touch_updated_at before update on marketing.%I for each row execute function marketing.touch_updated_at()', t);
  end loop;
end $$;

-- Restrict all marketing tables to explicitly approved marketing users.
-- IMPORTANT: authenticated users cannot add themselves to marketing.members.
do $$
declare r record;
begin
  for r in select tablename from pg_tables where schemaname = 'marketing' loop
    execute format('alter table marketing.%I enable row level security', r.tablename);
    execute format('grant select, insert, update, delete on marketing.%I to authenticated, service_role', r.tablename);
    if r.tablename <> 'members' then
      execute format('drop policy if exists marketing_access on marketing.%I', r.tablename);
      execute format('create policy marketing_access on marketing.%I for all to authenticated using (marketing.has_access()) with check (marketing.has_access())', r.tablename);
    end if;
  end loop;
end $$;

-- Membership allowlist policies: users can read their own membership; only OWNERs can manage access.
drop policy if exists marketing_members_read on marketing.members;
drop policy if exists marketing_members_insert on marketing.members;
drop policy if exists marketing_members_update on marketing.members;
drop policy if exists marketing_members_delete on marketing.members;
create policy marketing_members_read on marketing.members for select to authenticated using (user_id = auth.uid() or marketing.has_access());
create policy marketing_members_insert on marketing.members for insert to authenticated with check (marketing.is_owner());
create policy marketing_members_update on marketing.members for update to authenticated using (marketing.is_owner()) with check (marketing.is_owner());
create policy marketing_members_delete on marketing.members for delete to authenticated using (marketing.is_owner());

grant usage, select on all sequences in schema marketing to authenticated, service_role;
alter default privileges in schema marketing grant select, insert, update, delete on tables to authenticated, service_role;
alter default privileges in schema marketing grant usage, select on sequences to authenticated;

insert into marketing.brand_rules(name, version, rules)
values ('TripleOneBars', '1.0', '{
  "colors":{"primary":"#E10600","black":"#0A0A0A","white":"#FFFFFF"},
  "typography":{"display":"Bebas Neue","body":"Inter","mono":"JetBrains Mono"},
  "voice":{"direct":true,"confident":true,"athletic":true,"respectful":true,"sentence_word_target":15},
  "creative":{"prefer_real_media":true,"high_contrast":true,"decisive_motion":true,"bounce":false,"sharp_geometry":true},
  "avoid":["fitness journey","embrace wellness","inner champion","marketing jargon"]
}'::jsonb)
on conflict (name) do update set version = excluded.version, rules = excluded.rules;

-- Private bucket for marketing-cleared creative; database keeps only metadata.
insert into storage.buckets (id, name, public)
values ('marketing-assets', 'marketing-assets', false)
on conflict (id) do nothing;

-- storage.objects has RLS enabled, so without these policies browser uploads fail.
drop policy if exists marketing_assets_read on storage.objects;
drop policy if exists marketing_assets_insert on storage.objects;
drop policy if exists marketing_assets_update on storage.objects;
drop policy if exists marketing_assets_delete on storage.objects;

create policy marketing_assets_read on storage.objects
  for select to authenticated
  using (bucket_id = 'marketing-assets' and marketing.has_access());

create policy marketing_assets_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'marketing-assets' and marketing.has_access());

create policy marketing_assets_update on storage.objects
  for update to authenticated
  using (bucket_id = 'marketing-assets' and marketing.has_access())
  with check (bucket_id = 'marketing-assets' and marketing.has_access());

create policy marketing_assets_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'marketing-assets' and marketing.has_access());

-- Ask PostgREST to pick up the new schema and its tables.
notify pgrst, 'reload schema';
