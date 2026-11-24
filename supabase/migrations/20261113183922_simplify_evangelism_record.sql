-- Retain historical values while allowing the shorter submission form.
alter table public.evangelism_records
  drop constraint if exists evangelism_records_evangelist_phone_required,
  drop constraint if exists evangelism_records_hall_zone_required,
  drop constraint if exists evangelism_records_department_required;
