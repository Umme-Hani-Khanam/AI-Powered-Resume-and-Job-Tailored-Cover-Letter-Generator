-- Phase 1: optional profile table to provision in the Supabase SQL Editor.
-- Never place this table in an exposed schema without the RLS policies below.
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
revoke all on table public.profiles from anon;
grant select, insert, update on table public.profiles to authenticated;

create policy "Users can view their own profile" on public.profiles for select to authenticated using ((select auth.uid()) = id);
create policy "Users can create their own profile" on public.profiles for insert to authenticated with check ((select auth.uid()) = id);
create policy "Users can update their own profile" on public.profiles for update to authenticated using ((select auth.uid()) = id) with check ((select auth.uid()) = id);

-- Phase 2: user-owned resume documents. Run this in the Supabase SQL Editor.
create table if not exists public.resumes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  title text not null default 'Untitled resume',
  content jsonb not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists resumes_user_updated_idx on public.resumes (user_id, updated_at desc);
alter table public.resumes enable row level security;
revoke all on table public.resumes from anon;
grant select, insert, update on table public.resumes to authenticated;
create policy "Users can view their own resumes" on public.resumes for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own resumes" on public.resumes for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own resumes" on public.resumes for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);

-- Phase 4: immutable tailored-application snapshots.
create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  source_resume_id uuid references public.resumes(id) on delete set null,
  job_details jsonb not null,
  tailored_resume jsonb,
  cover_letter text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists applications_user_updated_idx on public.applications (user_id, updated_at desc);
-- Independent document generation can save a resume or cover letter before its counterpart.
alter table public.applications alter column tailored_resume drop not null;
alter table public.applications alter column cover_letter set default '';
alter table public.applications enable row level security;
revoke all on table public.applications from anon;
grant select, insert, update on table public.applications to authenticated;
create policy "Users can view their own applications" on public.applications for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users can create their own applications" on public.applications for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users can update their own applications" on public.applications for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
