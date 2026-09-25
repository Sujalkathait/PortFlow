-- =============================================================================
-- PortFlow Database Schema (Phase 2 & Phase 3)
-- Integrated Operating System & Database Management Concepts
-- =============================================================================

-- 1. EXTENSIONS & SCHEMAS
create extension if not exists pgcrypto;
create schema if not exists private;

-- 2. ENUM TYPES
do $$ begin
  create type public.port_role as enum ('Admin', 'Operator');
exception
  when duplicate_object then null;
end $$;

-- 3. PROFILES TABLE (DBMS: Primary Key, Foreign Key to auth.users, Normalization)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null check (char_length(full_name) between 2 and 120),
  role public.port_role not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. SHIPS TABLE (DBMS: Entity Modeling, Unique Constraints)
create table if not exists public.ships (
  id bigint generated always as identity primary key,
  imo_number text unique not null,
  name text not null,
  vessel_type text,
  capacity_teu integer check (capacity_teu >= 0),
  created_at timestamptz not null default now()
);

-- 5. BERTHS TABLE (OS: Semaphore Resource Modeling)
create table if not exists public.berths (
  id bigint generated always as identity primary key,
  name text unique not null,
  location text,
  is_available boolean not null default true,
  max_vessel_length integer check (max_vessel_length > 0),
  created_at timestamptz not null default now()
);

-- 6. OPERATIONS TABLE (OS: Processes & Scheduling / DBMS: Foreign Keys, CRUD)
create table if not exists public.operations (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id),
  ship_id bigint references public.ships(id),
  berth_id bigint references public.berths(id),
  operation_type text not null check (char_length(operation_type) between 2 and 100),
  status text not null default 'Queued' check (status in ('Queued', 'Running', 'Completed', 'Cancelled')),
  start_time timestamptz,
  end_time timestamptz,
  created_at timestamptz not null default now(),
  check (end_time is null or start_time is null or end_time >= start_time)
);

-- 7. CONTAINERS TABLE (DBMS: Referential Integrity & Tracking)
create table if not exists public.containers (
  id bigint generated always as identity primary key,
  operation_id bigint references public.operations(id) on delete set null,
  container_number text unique not null,
  size_type text,
  current_location text,
  created_at timestamptz not null default now()
);

-- 8. INDEXES (DBMS: Performance Optimization & Fast Lookup)
create index if not exists operations_user_id_idx on public.operations(user_id);
create index if not exists operations_created_at_idx on public.operations(created_at desc);
create index if not exists containers_operation_id_idx on public.containers(operation_id);

-- 9. ADMIN SECURITY FUNCTION (DBMS: Security Definer Helper)
create or replace function private.is_admin()
returns boolean
language sql
security definer
set search_path = ''
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = (select auth.uid())
      and role = 'Admin'
  );
$$;

revoke all on function private.is_admin() from public;
grant usage on schema private to authenticated;
grant execute on function private.is_admin() to authenticated;

-- 10. ROW LEVEL SECURITY (RLS) POLICIES
alter table public.profiles enable row level security;
alter table public.ships enable row level security;
alter table public.berths enable row level security;
alter table public.operations enable row level security;
alter table public.containers enable row level security;

-- Profiles Policies
create policy "profiles_read_own" on public.profiles
  for select to authenticated
  using ((select auth.uid()) = id);

create policy "profiles_read_admin" on public.profiles
  for select to authenticated
  using ((select private.is_admin()));

-- Ships Policies
create policy "ships_read_authenticated" on public.ships
  for select to authenticated
  using (true);

-- Berths Policies
create policy "berths_read_authenticated" on public.berths
  for select to authenticated
  using (true);

-- Operations Policies (Full CRUD)
create policy "operations_select" on public.operations
  for select to authenticated
  using ((select private.is_admin()) or user_id = (select auth.uid()));

create policy "operations_insert" on public.operations
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "operations_update" on public.operations
  for update to authenticated
  using ((select private.is_admin()) or user_id = (select auth.uid()))
  with check ((select private.is_admin()) or user_id = (select auth.uid()));

create policy "operations_delete" on public.operations
  for delete to authenticated
  using ((select private.is_admin()) or user_id = (select auth.uid()));

-- Containers Policies
create policy "containers_select" on public.containers
  for select to authenticated
  using (
    (select private.is_admin())
    or exists (
      select 1
      from public.operations o
      where o.id = operation_id
        and o.user_id = (select auth.uid())
    )
  );
