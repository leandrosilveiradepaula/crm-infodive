-- Re-create Activities Table to ensure correct schema
-- WARNING: This will delete existing data in the 'activities' table.
drop table if exists public.activities cascade;

create table public.activities (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid not null,
    title text not null,
    description text,
    type text not null check (type in ('call', 'meeting', 'email', 'task', 'note')),
    status text not null default 'pending' check (status in ('pending', 'in_progress', 'completed', 'cancelled')),
    priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
    "dueDate" date,
    "dueTime" time,
    "assignedTo" text,
    related_to jsonb,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security
alter table public.activities enable row level security;

-- Create Policy for Select
create policy "Users can view activities in their organization"
    on public.activities for select
    using (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- Create Policy for Insert
create policy "Users can insert activities in their organization"
    on public.activities for insert
    with check (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- Create Policy for Update
create policy "Users can update activities in their organization"
    on public.activities for update
    using (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- Create Policy for Delete
create policy "Users can delete activities in their organization"
    on public.activities for delete
    using (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- Create Realtime subscription
-- Note: 'supabase_realtime' publication usually exists, but 'add table' might fail if already added. 
-- We use a DO block or just ignore error if it fails (not easily doable in standard SQL without plpgsql).
-- But usually repeating 'add table' throws error if already there or works fine.
-- Let's check existence using a simpler approach or just run it and let user know it might warn.
alter publication supabase_realtime add table public.activities;
