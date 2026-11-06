-- Apply only to a NEW, dedicated Greenlight Booking Supabase project.
-- Do not run this migration in RFP Web Project.
create table if not exists public.greenlight_booking_reservations (
  id uuid primary key default gen_random_uuid(),
  booked_for date not null,
  start_time time not null,
  end_time time not null,
  resource text not null,
  booked_by text not null,
  department text not null default '',
  purpose text not null default '',
  notes text not null default '',
  status text not null default 'confirmed' check (status in ('pending','confirmed','completed','cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint greenlight_booking_time_range check (end_time > start_time)
);
-- Prevent all time-range overlaps, including different start times.
-- PostgreSQL enforces this atomically even for concurrent requests.
create extension if not exists btree_gist;
alter table public.greenlight_booking_reservations
  add constraint greenlight_booking_no_overlap
  exclude using gist (
    booked_for with =,
    resource with =,
    tsrange(booked_for + start_time, booked_for + end_time, '[)') with &&
  ) where (status <> 'cancelled');
create index if not exists greenlight_booking_date_idx on public.greenlight_booking_reservations (booked_for desc);
alter table public.greenlight_booking_reservations enable row level security;
-- No anon or authenticated access policies. All access requires
-- server-only service-role key + authenticated admin session.
revoke all on table public.greenlight_booking_reservations from anon,authenticated;
create or replace function public.greenlight_booking_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end; $$;
drop trigger if exists greenlight_booking_set_updated_at on public.greenlight_booking_reservations;
create trigger greenlight_booking_set_updated_at before update on public.greenlight_booking_reservations
for each row execute function public.greenlight_booking_updated_at();
revoke all on function public.greenlight_booking_updated_at() from public, anon, authenticated;
