begin;

revoke all on public.approved_admins, public.evangelism_records
  from public, anon, authenticated, service_role;
grant select on public.approved_admins to authenticated;
grant select, delete on public.evangelism_records to authenticated;
grant update (
  person_full_name, person_phone, student_status, academic_level, residence, hostel,
  decision, date_reached, church_denomination, baptism_status, preferred_contact_method,
  evangelism_location, remarks, evangelist_full_name, evangelist_phone, hall_zone,
  department, contacted, updated_at
) on public.evangelism_records to authenticated;
grant insert on public.evangelism_records to service_role;

create schema if not exists evangelism_private;
revoke all on schema evangelism_private from public, anon, authenticated;
grant usage on schema evangelism_private to service_role;

create table evangelism_private.submission_quota (
  window_start timestamptz not null,
  client_hash text not null check (client_hash ~ '^[0-9a-f]{64}$'),
  attempts integer not null check (attempts between 1 and 5),
  primary key (window_start, client_hash)
);
alter table evangelism_private.submission_quota enable row level security;
revoke all on evangelism_private.submission_quota from public, anon, authenticated;
grant select, insert, update, delete on evangelism_private.submission_quota to service_role;

-- Returns zero when a slot was reserved, or the number of seconds until retry.
create function public.reserve_record_submission(p_client_hash text)
returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  current_window timestamptz := pg_catalog.date_bin(
    interval '10 minutes', pg_catalog.statement_timestamp(), timestamptz '2000-01-01 00:00:00+00'
  );
begin
  delete from evangelism_private.submission_quota as quota
  where (quota.window_start, quota.client_hash) in (
    select expired.window_start, expired.client_hash
    from evangelism_private.submission_quota as expired
    where expired.window_start < current_window - interval '1 hour'
    order by expired.window_start, expired.client_hash
    limit 20
    for update skip locked
  );

  insert into evangelism_private.submission_quota as quota (window_start, client_hash, attempts)
  values (current_window, p_client_hash, 1)
  on conflict (window_start, client_hash) do update
    set attempts = quota.attempts + 1
    where quota.attempts < 5;
  if found then
    return 0;
  end if;

  return greatest(1, ceil(extract(epoch from (
    current_window + interval '10 minutes' - pg_catalog.statement_timestamp()
  )))::integer);
end;
$$;

revoke execute on function public.reserve_record_submission(text) from public, anon, authenticated;
grant execute on function public.reserve_record_submission(text) to service_role;

commit;
