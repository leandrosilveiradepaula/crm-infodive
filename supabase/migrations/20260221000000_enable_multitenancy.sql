-- Migration: Enable True Multitenancy (SaaS Isolation)
-- This migration drops the permissive "MVP" policies and implements rigorous
-- Row Level Security (RLS) bound strictly to the user's organization_id.

-- 1. Add organization_id to newer configuration tables that missed it
ALTER TABLE public.app_settings ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE public.pipeline_stages ADD COLUMN IF NOT EXISTS organization_id uuid;

-- Fix unique constraint on app_settings to allow identical keys across different tenants
ALTER TABLE public.app_settings DROP CONSTRAINT IF EXISTS app_settings_key_key;
ALTER TABLE public.app_settings DROP CONSTRAINT IF EXISTS app_settings_org_key_unique;
ALTER TABLE public.app_settings ADD CONSTRAINT app_settings_org_key_unique UNIQUE (organization_id, key);

-- Fix seed data if they were inserted globally (give them to all existing orgs or clean them)
-- For simplicity, we just keep existing ones with NULL and let the app handle it, or wipe app_settings to let defaults populate per org.
-- In a real scenario, we'd migrate global seed to the first org.

-- 2. Drop existing wide-open policies (MVP Mode)
DROP POLICY IF EXISTS "Allow all auth users" ON public.accounts;
DROP POLICY IF EXISTS "Allow all auth users" ON public.account_contacts;
DROP POLICY IF EXISTS "Allow all auth users" ON public.account_branches;
DROP POLICY IF EXISTS "Allow all auth users" ON public.products;
DROP POLICY IF EXISTS "Allow all auth users" ON public.deals;
DROP POLICY IF EXISTS "Allow all auth users" ON public.deal_products;
DROP POLICY IF EXISTS "Allow all auth users" ON public.deal_activities;

-- Drop recent permissive policies
DROP POLICY IF EXISTS "auth users can read app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "auth users can update app_settings" ON public.app_settings;
DROP POLICY IF EXISTS "auth users can read pipeline_stages" ON public.pipeline_stages;

-- 3. Create Strict Tenant Isolation Policies for Primary Tables (With organization_id)

-- accounts
DROP POLICY IF EXISTS "Tenant Isolation" ON public.accounts;
CREATE POLICY "Tenant Isolation" ON public.accounts FOR ALL
USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- products
DROP POLICY IF EXISTS "Tenant Isolation" ON public.products;
CREATE POLICY "Tenant Isolation" ON public.products FOR ALL
USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- deals
DROP POLICY IF EXISTS "Tenant Isolation" ON public.deals;
CREATE POLICY "Tenant Isolation" ON public.deals FOR ALL
USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- app_settings
DROP POLICY IF EXISTS "Tenant Isolation" ON public.app_settings;
CREATE POLICY "Tenant Isolation" ON public.app_settings FOR ALL
USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- pipeline_stages
DROP POLICY IF EXISTS "Tenant Isolation" ON public.pipeline_stages;
CREATE POLICY "Tenant Isolation" ON public.pipeline_stages FOR ALL
USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- activities (if the table exists and has organization_id)
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activities') THEN
        DROP POLICY IF EXISTS "Allow all auth users" ON public.activities;
        DROP POLICY IF EXISTS "Users can read own org activities" ON public.activities;
        DROP POLICY IF EXISTS "Users can insert own org activities" ON public.activities;
        DROP POLICY IF EXISTS "Users can update own org activities" ON public.activities;
        DROP POLICY IF EXISTS "Users can delete own org activities" ON public.activities;
        
        -- Fallback policy cleanup (just in case they have a different naming convention from step 0)
        DROP POLICY IF EXISTS "Tenant Isolation" ON public.activities;
        
        CREATE POLICY "Tenant Isolation" ON public.activities FOR ALL
        USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
        WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);
    END IF;
END $$;


-- 4. Create Policies for Child Tables WITHOUT organization_id 
-- We join with the parent table to verify visibility and ownership.

-- account_contacts -> parent: accounts
DROP POLICY IF EXISTS "Tenant Isolation" ON public.account_contacts;
CREATE POLICY "Tenant Isolation" ON public.account_contacts FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.accounts a
        WHERE a.id = account_contacts.account_id
        AND a.organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.accounts a
        WHERE a.id = account_contacts.account_id
        AND a.organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
    )
);

-- account_branches -> parent: accounts
DROP POLICY IF EXISTS "Tenant Isolation" ON public.account_branches;
CREATE POLICY "Tenant Isolation" ON public.account_branches FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.accounts a
        WHERE a.id = account_branches.account_id
        AND a.organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.accounts a
        WHERE a.id = account_branches.account_id
        AND a.organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
    )
);

-- deal_products -> parent: deals
DROP POLICY IF EXISTS "Tenant Isolation" ON public.deal_products;
CREATE POLICY "Tenant Isolation" ON public.deal_products FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.deals d
        WHERE d.id = deal_products.deal_id
        AND d.organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.deals d
        WHERE d.id = deal_products.deal_id
        AND d.organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
    )
);

-- deal_activities -> parent: deals
DROP POLICY IF EXISTS "Tenant Isolation" ON public.deal_activities;
CREATE POLICY "Tenant Isolation" ON public.deal_activities FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.deals d
        WHERE d.id = deal_activities.deal_id
        AND d.organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.deals d
        WHERE d.id = deal_activities.deal_id
        AND d.organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
    )
);


-- 5. Helper Function & Triggers to auto-inject organization_id 
-- If an insert query from the client forgets to specify organization_id, this catches it securely.
CREATE OR REPLACE FUNCTION public.set_organization_id()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.organization_id IS NULL THEN
        -- Safely extract UUID from JWT
        NEW.organization_id := (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply Before-Insert triggers securely
DROP TRIGGER IF EXISTS set_accounts_org_id ON public.accounts;
CREATE TRIGGER set_accounts_org_id BEFORE INSERT ON public.accounts FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_deals_org_id ON public.deals;
CREATE TRIGGER set_deals_org_id BEFORE INSERT ON public.deals FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_products_org_id ON public.products;
CREATE TRIGGER set_products_org_id BEFORE INSERT ON public.products FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_app_settings_org_id ON public.app_settings;
CREATE TRIGGER set_app_settings_org_id BEFORE INSERT ON public.app_settings FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_pipeline_stages_org_id ON public.pipeline_stages;
CREATE TRIGGER set_pipeline_stages_org_id BEFORE INSERT ON public.pipeline_stages FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activities') THEN
        DROP TRIGGER IF EXISTS set_activities_org_id ON public.activities;
        CREATE TRIGGER set_activities_org_id BEFORE INSERT ON public.activities FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();
    END IF;
END $$;
