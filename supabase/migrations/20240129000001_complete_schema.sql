-- Complete Schema Migration for CRM Next Gen
-- Run this script to ensure all tables exist with the correct structure.

-- 1. Profiles (Public user data)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  full_name text,
  avatar_url text,
  role text,
  updated_at timestamp with time zone
);

-- 2. Organizations (Optional, but implied by code)
-- For now, we assume organization_id is just a UUID stored in user metadata, 
-- but we'll ensure tables have the column.

-- 3. Accounts (Customers)
create table if not exists public.accounts (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid, -- Link to org
    name text not null,
    cnpj text,
    ie text,
    segment text,
    status text default 'Ativo',
    zip text,
    street text,
    number text,
    complement text,
    neighborhood text,
    city text,
    state text,
    tags text[],
    relationship_type text,
    logo_url text,
    payment_terms text,
    description text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. Account Contacts
create table if not exists public.account_contacts (
    id uuid default gen_random_uuid() primary key,
    account_id uuid references public.accounts(id) on delete cascade,
    name text not null,
    email text,
    mobile_phone text,
    landline_phone text,
    role text,
    is_primary boolean default false
);

-- 5. Account Branches
create table if not exists public.account_branches (
    id uuid default gen_random_uuid() primary key,
    account_id uuid references public.accounts(id) on delete cascade,
    name text not null,
    zip text,
    street text,
    number text,
    complement text,
    neighborhood text,
    city text,
    state text,
    cnpj text,
    ie text
);

-- 6. Products
create table if not exists public.products (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid,
    name text not null,
    category text,
    subcategory text,
    brand text,
    icon text,
    description text,
    sku text,
    price numeric,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. Deals (Pipeline)
create table if not exists public.deals (
    id uuid default gen_random_uuid() primary key,
    organization_id uuid,
    account_id uuid references public.accounts(id) on delete set null,
    owner_id uuid references public.profiles(id) on delete set null,
    title text not null,
    company text, -- Legacy string if account not linked
    value numeric default 0,
    probability integer default 0,
    stage text not null,
    owner text, -- Legacy name string
    tags text[],
    description text,
    days_in_stage integer default 0,
    expected_close_date date,
    won_at timestamp with time zone,
    lost_at timestamp with time zone,
    loss_reason text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. Deal Products
create table if not exists public.deal_products (
    id uuid default gen_random_uuid() primary key,
    deal_id uuid references public.deals(id) on delete cascade,
    product_id uuid references public.products(id) on delete set null,
    name text not null,
    price numeric default 0,
    quantity numeric default 1
);

-- 9. Deal Activities (History)
create table if not exists public.deal_activities (
    id uuid default gen_random_uuid() primary key,
    deal_id uuid references public.deals(id) on delete cascade,
    type text not null,
    description text,
    user_name text,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
alter table public.accounts enable row level security;
alter table public.account_contacts enable row level security;
alter table public.products enable row level security;
alter table public.deals enable row level security;

-- Basic Policy: Allow all authenticated users to see everything (MVP Mode)
-- In production, filter by organization_id
create policy "Allow all auth users" on public.accounts for all using (auth.role() = 'authenticated');
create policy "Allow all auth users" on public.account_contacts for all using (auth.role() = 'authenticated');
create policy "Allow all auth users" on public.account_branches for all using (auth.role() = 'authenticated');
create policy "Allow all auth users" on public.products for all using (auth.role() = 'authenticated');
create policy "Allow all auth users" on public.deals for all using (auth.role() = 'authenticated');
create policy "Allow all auth users" on public.deal_products for all using (auth.role() = 'authenticated');
create policy "Allow all auth users" on public.deal_activities for all using (auth.role() = 'authenticated');

-- Subscribe to Realtime (idempotent - safe to run multiple times)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'deals'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.deals;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime' AND tablename = 'accounts'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.accounts;
    END IF;
END $$;
