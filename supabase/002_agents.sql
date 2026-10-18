-- diBiti, migration 002: agent proposals, approvals and the audit log.
-- Paste this whole file into Supabase > SQL Editor > New query > Run.
-- Run it after 001_init.sql. Safe to run once.
--
-- Key safety rules built into the database itself:
--  * Nobody can write to these tables directly. All changes go through the
--    functions below, which check who you are and write the audit entry in
--    the same step, so an action can never change without a log line.
--  * The audit log has no update or delete path at all (append-only).
--  * Approval is tied to the exact content. Editing a post wipes its approval.

create table if not exists public.proposed_actions (
  id            uuid primary key default gen_random_uuid(),
  company_id    uuid not null references public.companies(id) on delete cascade,
  agent_key     text not null,
  type          text not null check (type in ('social_post')),
  payload       jsonb not null,
  content_hash  text not null,
  approved_hash text,
  status        text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  source        text not null default 'demo' check (source in ('demo', 'claude')),
  created_at    timestamptz not null default now(),
  decided_by    uuid references auth.users(id) on delete set null,
  decided_at    timestamptz
);

create index if not exists proposed_actions_company_idx
  on public.proposed_actions (company_id, status, created_at desc);

create table if not exists public.audit_log (
  id          bigint generated always as identity primary key,
  company_id  uuid not null references public.companies(id) on delete cascade,
  actor_type  text not null check (actor_type in ('user', 'agent', 'system')),
  actor_id    text,
  event       text not null,
  entity_type text,
  entity_id   text,
  details     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists audit_log_company_idx
  on public.audit_log (company_id, id desc);

alter table public.proposed_actions enable row level security;
alter table public.audit_log        enable row level security;

-- Members can read their own company's rows. There are deliberately no
-- insert, update or delete policies: writes happen only through the functions.
drop policy if exists "members read actions" on public.proposed_actions;
drop policy if exists "members read audit"   on public.audit_log;
create policy "members read actions" on public.proposed_actions for select using (public.is_member(company_id));
create policy "members read audit"   on public.audit_log        for select using (public.is_member(company_id));

-- Fingerprint of the exact content that gets approved.
create or replace function public._content_hash(p jsonb)
returns text
language sql
immutable
as $$
  select encode(
    sha256(convert_to(coalesce(p->>'platform', '') || E'\n' || coalesce(p->>'text', ''), 'UTF8')),
    'hex'
  );
$$;

-- The agent hands over its drafts. Creates pending actions and logs each one.
create or replace function public.propose_actions(p_agent text, p_source text, p_items jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  item jsonb;
  new_id uuid;
  n integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  select company_id into cid from public.memberships where user_id = auth.uid() limit 1;
  if cid is null then
    raise exception 'No company';
  end if;
  if p_source not in ('demo', 'claude') then
    raise exception 'Bad source';
  end if;
  if jsonb_typeof(p_items) <> 'array' or jsonb_array_length(p_items) > 20 then
    raise exception 'Bad items';
  end if;

  for item in select value from jsonb_array_elements(p_items) loop
    if coalesce(item->>'platform', '') not in ('instagram', 'facebook')
       or char_length(coalesce(item->>'text', '')) not between 1 and 2200 then
      continue;
    end if;

    insert into public.proposed_actions (company_id, agent_key, type, payload, content_hash, source)
    values (
      cid, p_agent, 'social_post',
      jsonb_build_object('platform', item->>'platform', 'text', item->>'text'),
      public._content_hash(item), p_source
    )
    returning id into new_id;

    insert into public.audit_log (company_id, actor_type, actor_id, event, entity_type, entity_id, details)
    values (cid, 'agent', p_agent, 'action.proposed', 'proposed_action', new_id::text,
            jsonb_build_object('type', 'social_post', 'platform', item->>'platform', 'source', p_source));
    n := n + 1;
  end loop;

  insert into public.audit_log (company_id, actor_type, actor_id, event, details)
  values (cid, 'agent', p_agent, 'run.completed',
          jsonb_build_object('proposed', n, 'source', p_source, 'requested_by', auth.uid()));

  return n;
end;
$$;

-- A person approves or rejects one pending action.
create or replace function public.decide_action(p_id uuid, p_decision text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.proposed_actions;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  if p_decision not in ('approve', 'reject') then
    raise exception 'Bad decision';
  end if;
  select * into a from public.proposed_actions where id = p_id;
  if not found or not public.is_member(a.company_id) then
    raise exception 'Not found';
  end if;
  if a.status <> 'pending' then
    raise exception 'Already decided';
  end if;

  update public.proposed_actions
     set status        = case when p_decision = 'approve' then 'approved' else 'rejected' end,
         approved_hash = case when p_decision = 'approve' then content_hash else null end,
         decided_by    = auth.uid(),
         decided_at    = now()
   where id = p_id;

  insert into public.audit_log (company_id, actor_type, actor_id, event, entity_type, entity_id, details)
  values (a.company_id, 'user', auth.uid()::text,
          case when p_decision = 'approve' then 'action.approved' else 'action.rejected' end,
          'proposed_action', p_id::text,
          jsonb_build_object('platform', a.payload->>'platform'));
end;
$$;

-- A person edits the wording. The approval is wiped, so it needs approving again.
create or replace function public.edit_action(p_id uuid, p_text text)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  a public.proposed_actions;
  new_payload jsonb;
  clean_text text := trim(coalesce(p_text, ''));
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  select * into a from public.proposed_actions where id = p_id;
  if not found or not public.is_member(a.company_id) then
    raise exception 'Not found';
  end if;
  if a.status = 'rejected' then
    raise exception 'Rejected posts cannot be edited';
  end if;
  if char_length(clean_text) not between 1 and 2200 then
    raise exception 'Text must be between 1 and 2200 characters';
  end if;

  new_payload := jsonb_set(a.payload, '{text}', to_jsonb(clean_text));

  update public.proposed_actions
     set payload       = new_payload,
         content_hash  = public._content_hash(new_payload),
         approved_hash = null,
         status        = 'pending',
         decided_by    = null,
         decided_at    = null
   where id = p_id;

  insert into public.audit_log (company_id, actor_type, actor_id, event, entity_type, entity_id, details)
  values (a.company_id, 'user', auth.uid()::text, 'action.edited', 'proposed_action', p_id::text,
          jsonb_build_object('previous_status', a.status, 'needs_reapproval', true));
end;
$$;

revoke all on function public.propose_actions(text, text, jsonb) from public, anon;
revoke all on function public.decide_action(uuid, text)          from public, anon;
revoke all on function public.edit_action(uuid, text)            from public, anon;
grant execute on function public.propose_actions(text, text, jsonb) to authenticated;
grant execute on function public.decide_action(uuid, text)          to authenticated;
grant execute on function public.edit_action(uuid, text)            to authenticated;
