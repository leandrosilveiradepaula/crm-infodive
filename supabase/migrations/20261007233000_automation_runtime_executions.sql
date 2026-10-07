create table if not exists public.automation_executions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null,
  automation_id text not null,
  event_key text not null,
  event_type text not null check (event_type in ('deal_created','deal_moved')),
  entity_id text not null,
  status text not null check (status in ('running','success','failed','skipped')),
  trigger jsonb not null default '{}'::jsonb,
  actions jsonb not null default '[]'::jsonb,
  error text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (organization_id, automation_id, event_key)
);

alter table public.automation_executions enable row level security;

create index if not exists automation_executions_org_automation_created_idx
  on public.automation_executions (organization_id, automation_id, created_at desc);

create index if not exists automation_executions_org_event_idx
  on public.automation_executions (organization_id, event_type, entity_id, created_at desc);
