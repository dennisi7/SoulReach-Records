create table if not exists public.approved_admins (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.evangelism_records (
  id uuid primary key default gen_random_uuid(),
  person_full_name text not null,
  person_phone text,
  student_status text check (student_status in ('Student', 'Non-student')),
  academic_level text,
  residence text,
  hostel text,
  decision text not null check (decision in ('New Convert', 'Rededication')),
  date_reached date not null,
  church_denomination text,
  baptism_status text,
  preferred_contact_method text,
  evangelism_location text,
  remarks text check (char_length(remarks) <= 250),
  evangelist_full_name text not null,
  evangelist_phone text,
  hall_zone text,
  department text,
  consent_given boolean not null default false,
  consent_notice_version text not null default 'v1',
  contacted boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.approved_admins enable row level security;
alter table public.evangelism_records enable row level security;

create policy "approved admins can read admins" on public.approved_admins for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "approved admins can read records" on public.evangelism_records for select to authenticated
  using (exists (select 1 from public.approved_admins where user_id = (select auth.uid())));
create policy "approved admins can update records" on public.evangelism_records for update to authenticated
  using (exists (select 1 from public.approved_admins where user_id = (select auth.uid())))
  with check (exists (select 1 from public.approved_admins where user_id = (select auth.uid())));
create policy "approved admins can delete records" on public.evangelism_records for delete to authenticated
  using (exists (select 1 from public.approved_admins where user_id = (select auth.uid())));

create index if not exists evangelism_records_date_reached_idx on public.evangelism_records (date_reached desc);
