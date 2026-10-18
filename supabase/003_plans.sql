-- diBiti, migration 003: 30-day content plans.
-- Paste this whole file into Supabase > SQL Editor > New query > Run.
-- Run it after 002_agents.sql. Safe to run more than once.
--
-- A content plan is a proposal like any other: the agent proposes it, a person
-- approves or rejects it, and every step is written to the audit log.
-- Posts can only be drafted from a plan that has been approved.

alter table public.proposed_actions
  add column if not exists plan_id uuid references public.proposed_actions(id) on delete set null;

alter table public.proposed_actions drop constraint if exists proposed_actions_type_check;
alter table public.proposed_actions
  add constraint proposed_actions_type_check check (type in ('social_post', 'content_plan'));

create index if not exists proposed_actions_plan_idx on public.proposed_actions (plan_id);

-- Fingerprint of a whole plan, so approval is tied to its exact content.
create or replace function public._payload_hash(p jsonb)
returns text
language sql
immutable
as $$
  select encode(sha256(convert_to(p::text, 'UTF8')), 'hex');
$$;

-- The agent hands over a 30-day plan.
create or replace function public.propose_plan(p_agent text, p_source text, p_plan jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  new_id uuid;
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
  if jsonb_typeof(p_plan) is distinct from 'object' then
    raise exception 'Bad plan';
  end if;
  if char_length(coalesce(p_plan->>'summary', '')) not between 1 and 2000 then
    raise exception 'Bad plan';
  end if;
  if jsonb_typeof(p_plan->'slots') is distinct from 'array' then
    raise exception 'Bad plan';
  end if;
  if jsonb_array_length(p_plan->'slots') not between 1 and 40 then
    raise exception 'Bad plan';
  end if;

  insert into public.proposed_actions (company_id, agent_key, type, payload, content_hash, source)
  values (cid, p_agent, 'content_plan', p_plan, public._payload_hash(p_plan), p_source)
  returning id into new_id;

  insert into public.audit_log (company_id, actor_type, actor_id, event, entity_type, entity_id, details)
  values (cid, 'agent', p_agent, 'plan.proposed', 'proposed_action', new_id::text,
          jsonb_build_object('type', 'content_plan', 'slots', jsonb_array_length(p_plan->'slots'),
                             'source', p_source, 'requested_by', auth.uid()));
  return new_id;
end;
$$;

-- The agent hands over post drafts for slots of an APPROVED plan.
create or replace function public.propose_plan_posts(p_plan_id uuid, p_source text, p_items jsonb)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  plan public.proposed_actions;
  item jsonb;
  new_id uuid;
  d integer;
  n integer := 0;
begin
  if auth.uid() is null then
    raise exception 'Not signed in';
  end if;
  select * into plan from public.proposed_actions where id = p_plan_id;
  if not found or not public.is_member(plan.company_id) then
    raise exception 'Not found';
  end if;
  if plan.type <> 'content_plan' or plan.status <> 'approved' then
    raise exception 'Plan is not approved';
  end if;
  if p_source not in ('demo', 'claude') then
    raise exception 'Bad source';
  end if;
  if jsonb_typeof(p_items) is distinct from 'array' or jsonb_array_length(p_items) > 10 then
    raise exception 'Bad items';
  end if;

  for item in select value from jsonb_array_elements(p_items) loop
    if coalesce(item->>'platform', '') not in ('instagram', 'facebook')
       or char_length(coalesce(item->>'text', '')) not between 1 and 2200
       or coalesce(item->>'day', '') !~ '^[0-9]{1,2}$' then
      continue;
    end if;
    d := (item->>'day')::integer;
    if d < 1 or d > 30 then
      continue;
    end if;
    -- One live post per planned day.
    if exists (
      select 1 from public.proposed_actions
      where plan_id = p_plan_id and status <> 'rejected' and (payload->>'day')::integer = d
    ) then
      continue;
    end if;

    insert into public.proposed_actions (company_id, agent_key, type, payload, content_hash, source, plan_id)
    values (
      plan.company_id, plan.agent_key, 'social_post',
      jsonb_build_object('platform', item->>'platform', 'text', item->>'text', 'day', d,
                         'topic', left(coalesce(item->>'topic', ''), 200)),
      public._content_hash(item), p_source, p_plan_id
    )
    returning id into new_id;

    insert into public.audit_log (company_id, actor_type, actor_id, event, entity_type, entity_id, details)
    values (plan.company_id, 'agent', plan.agent_key, 'action.proposed', 'proposed_action', new_id::text,
            jsonb_build_object('type', 'social_post', 'platform', item->>'platform',
                               'source', p_source, 'plan_id', p_plan_id, 'day', d));
    n := n + 1;
  end loop;

  insert into public.audit_log (company_id, actor_type, actor_id, event, details)
  values (plan.company_id, 'agent', plan.agent_key, 'run.completed',
          jsonb_build_object('proposed', n, 'source', p_source, 'plan_id', p_plan_id,
                             'requested_by', auth.uid()));
  return n;
end;
$$;

-- Replaced so the audit entry also says what kind of thing was decided.
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
          jsonb_build_object('type', a.type, 'platform', a.payload->>'platform'));
end;
$$;

-- Replaced so only social posts can be edited (plans are approved or rejected as a whole).
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
  if a.type <> 'social_post' then
    raise exception 'Only posts can be edited';
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
          jsonb_build_object('type', 'social_post', 'previous_status', a.status, 'needs_reapproval', true));
end;
$$;

revoke all on function public.propose_plan(text, text, jsonb)       from public, anon;
revoke all on function public.propose_plan_posts(uuid, text, jsonb) from public, anon;
grant execute on function public.propose_plan(text, text, jsonb)       to authenticated;
grant execute on function public.propose_plan_posts(uuid, text, jsonb) to authenticated;
