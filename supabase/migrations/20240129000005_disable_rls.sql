-- EMERGENCY: Disable RLS temporarily to diagnose "Nothing works"
-- This will allow ALL access to main tables.
-- Run this to check if the issue is permissions-related.

alter table public.accounts disable row level security;
alter table public.deals disable row level security;
alter table public.activities disable row level security;
alter table public.products disable row level security;
alter table public.profiles disable row level security;

-- Verify if this fixes the empty screen issue.
