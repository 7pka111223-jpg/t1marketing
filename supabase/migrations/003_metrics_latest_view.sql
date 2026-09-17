-- TripleOne Marketing OS v3 — latest metrics snapshot
-- Apply after 002_attribution_views.sql, to the same existing TripleOne Supabase project.
--
-- marketing.metrics is an append-only time series: every sync inserts a new row per
-- publication. Summing all rows would inflate reach/engagement as snapshots accumulate,
-- so dashboard aggregates read this view instead: the most recent snapshot per publication.
-- History stays intact for trend/learning work.

create or replace view marketing.metrics_latest
with (security_invoker = true) as
select distinct on (publication_id)
  id,
  publication_id,
  captured_at,
  views,
  reach,
  likes,
  comments,
  shares,
  saves,
  profile_visits,
  link_clicks,
  follows,
  watch_time_seconds
from marketing.metrics
order by publication_id, captured_at desc, id desc;

grant select on marketing.metrics_latest to authenticated, service_role;

notify pgrst, 'reload schema';
