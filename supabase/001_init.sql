-- diBiti, migration 001: companies, members, company profile.
-- Paste this whole file into Supabase > SQL Editor > New query > Run.
-- Safe to run once. Every table is locked down with row-level security,
-- so a signed-in user can only ever see their own company's rows.

create table if not exists public.companies (
  id         uuid primary key default gen_random_uuid(),
  name       text not null check (char_length(name) between 1 and 120),
  created_at timestamptz not null default now()
);

create table if not exists public.memberships (
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id    uuid not null references auth.users(id) on delete cascade,
  role       text not null check (role in ('owner', 'admin')),
  created_at timestamptz not null default now(),
  primary key (company_id, user_id)
);

create table if not exists public.company_profiles (
  company_id  uuid primary key references public.companies(id) on delete cascade,
  what_we_do  text not null default '',
  products    text not null default '',
  audience    text not null default '',
  tone        text[] not null default '{}',
  voice_notes text not null default '',
  dos         text not null default '',
  donts       text not null default '',
  updated_at  timestamptz not null default now()
);

alter table public.companies        enable row level security;
alter table public.memberships      enable row level security;
alter table public.company_profiles enable row level security;

-- Helper: is the signed-in user a member of this company?
-- security definer so the check itself is not blocked by row-level security.
create or replace function public.is_member(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where company_id = cid and user_id = auth.uid()
  );
$$;

create or replace function public.is_owner(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships
    where company_id = cid and user_id = auth.uid() and role = 'owner'
  );
$$;

-- companies
drop policy if exists "members read company"   on public.companies;
drop policy if exists "members update company" on public.companies;
drop policy if exists "owner deletes company"  on public.companies;
create policy "members read company"   on public.companies for select using (public.is_member(id));
create policy "members update company" on public.companies for update using (public.is_member(id)) with check (public.is_member(id));
create policy "owner deletes company"  on public.companies for delete using (public.is_owner(id));

-- memberships: you can see your own membership rows. Changes go through functions only.
drop policy if exists "read own membership" on public.memberships;
create policy "read own membership" on public.memberships for select using (user_id = auth.uid());

-- company_profiles
drop policy if exists "members read profile"   on public.company_profiles;
drop policy if exists "members insert profile" on public.company_profiles;
drop policy if exists "members update profile" on public.company_profiles;
create policy "members read profile"   on public.company_profiles for select using (public.is_member(company_id));
create policy "members insert profile" on public.company_profiles for insert with check (public.is_member(company_id));
create policy "members update profile" on public.company_profiles for update using (public.is_member(company_id)) with check (public.is_member(company_id));

-- Creates a company, makes the caller its owner, and saves the first profile, all at once.
-- One company per user for now.
create or replace function public.create_company(p_name text, p_profile jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_name is null or char_length(trim(p_name)) = 0 then
    raise exception 'Company name is required';
  end if;
  if exists (select 1 from public.memberships where user_id = auth.uid()) then
    raise exception 'You already have a company';
  end if;

  insert into public.companies (name) values (trim(p_name)) returning id into new_id;
  insert into public.memberships (company_id, user_id, role) values (new_id, auth.uid(), 'owner');
  insert into public.company_profiles
    (company_id, what_we_do, products, audience, tone, voice_notes, dos, donts)
  values (
    new_id,
    coalesce(p_profile->>'what_we_do', ''),
    coalesce(p_profile->>'products', ''),
    coalesce(p_profile->>'audience', ''),
    coalesce(array(select jsonb_array_elements_text(coalesce(p_profile->'tone', '[]'::jsonb))), '{}'),
    coalesce(p_profile->>'voice_notes', ''),
    coalesce(p_profile->>'dos', ''),
    coalesce(p_profile->>'donts', '')
  );
  return new_id;
end;
$$;

revoke all on function public.create_company(text, jsonb) from public, anon;
grant execute on function public.create_company(text, jsonb) to authenticated;
