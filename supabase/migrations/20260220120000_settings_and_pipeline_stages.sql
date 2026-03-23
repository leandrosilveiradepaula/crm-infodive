-- Migration: App Settings + Pipeline Stages tables

-- 1. App Settings (org-level config, stored as key-value JSON)
create table if not exists public.app_settings (
    id uuid default gen_random_uuid() primary key,
    key text unique not null,
    value jsonb,
    updated_at timestamp with time zone default timezone('utc', now())
);

-- Seed default org settings (safe - won't fail if row already exists or constraint changed)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM public.app_settings WHERE key = 'organization') THEN
        INSERT INTO public.app_settings (key, value)
        VALUES ('organization', '{"name": "Minha Empresa", "support_email": "contato@empresa.com"}'::jsonb);
    END IF;
END $$;

-- 2. Pipeline Stages
create table if not exists public.pipeline_stages (
    id uuid default gen_random_uuid() primary key,
    name text not null,
    color text default '#3b82f6',
    order_index integer default 0,
    created_at timestamp with time zone default timezone('utc', now())
);

-- Seed default stages
insert into public.pipeline_stages (name, color, order_index) values
    ('Lead', '#3b82f6', 0),
    ('Qualificação', '#eab308', 1),
    ('Proposta', '#8b5cf6', 2),
    ('Negociação', '#f97316', 3),
    ('Fechado Ganho', '#10b981', 4)
on conflict do nothing;

-- 3. Add phone column to profiles if not exists
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists email text;

-- RLS: allow all authenticated users
alter table public.app_settings enable row level security;
alter table public.pipeline_stages enable row level security;

drop policy if exists "auth users can read app_settings" on public.app_settings;
create policy "auth users can read app_settings"
    on public.app_settings for select using (auth.role() = 'authenticated');

drop policy if exists "auth users can update app_settings" on public.app_settings;
create policy "auth users can update app_settings"
    on public.app_settings for update using (auth.role() = 'authenticated');

drop policy if exists "auth users can read pipeline_stages" on public.pipeline_stages;
create policy "auth users can read pipeline_stages"
    on public.pipeline_stages for all using (auth.role() = 'authenticated');
