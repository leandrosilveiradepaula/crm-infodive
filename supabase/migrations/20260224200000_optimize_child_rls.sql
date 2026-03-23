-- Migration: Optimize Child Tables RLS (Performance)
-- Adds organization_id to child tables, backfills data, and simplifies RLS policies.

-- 1. Add organization_id to child tables (if not exists)
ALTER TABLE public.account_contacts ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE public.account_branches ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE public.deal_products ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE public.deal_activities ADD COLUMN IF NOT EXISTS organization_id uuid;

-- 2. Backfill organization_id from parent tables
-- account_contacts
UPDATE public.account_contacts ac
SET organization_id = a.organization_id
FROM public.accounts a
WHERE ac.account_id = a.id AND ac.organization_id IS NULL;

-- account_branches
UPDATE public.account_branches ab
SET organization_id = a.organization_id
FROM public.accounts a
WHERE ab.account_id = a.id AND ab.organization_id IS NULL;

-- deal_products
UPDATE public.deal_products dp
SET organization_id = d.organization_id
FROM public.deals d
WHERE dp.deal_id = d.id AND dp.organization_id IS NULL;

-- deal_activities
UPDATE public.deal_activities da
SET organization_id = d.organization_id
FROM public.deals d
WHERE da.deal_id = d.id AND da.organization_id IS NULL;

-- 3. In case there are orphaned records whose parents don't exist anymore or don't have org_id
-- We assign them to the primary org to avoid null constraints later if needed, or just let them be.
-- Doing definitive cleanup just in case:
DO $$
DECLARE
  primary_org uuid := 'b4366e33-b8d5-4cbc-a7a7-8bd607031931'::uuid;
BEGIN
  UPDATE public.account_contacts SET organization_id = primary_org WHERE organization_id IS NULL;
  UPDATE public.account_branches SET organization_id = primary_org WHERE organization_id IS NULL;
  UPDATE public.deal_products SET organization_id = primary_org WHERE organization_id IS NULL;
  UPDATE public.deal_activities SET organization_id = primary_org WHERE organization_id IS NULL;
END $$;

-- 4. Apply Triggers for Auto-Injection on INSERT
DROP TRIGGER IF EXISTS ensure_org_id_account_contacts ON public.account_contacts;
CREATE TRIGGER ensure_org_id_account_contacts
  BEFORE INSERT ON public.account_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS ensure_org_id_account_branches ON public.account_branches;
CREATE TRIGGER ensure_org_id_account_branches
  BEFORE INSERT ON public.account_branches
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS ensure_org_id_deal_products ON public.deal_products;
CREATE TRIGGER ensure_org_id_deal_products
  BEFORE INSERT ON public.deal_products
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS ensure_org_id_deal_activities ON public.deal_activities;
CREATE TRIGGER ensure_org_id_deal_activities
  BEFORE INSERT ON public.deal_activities
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

-- 5. Rebuild RLS Policies (Replace EXISTS(JOIN) with direct check)

-- account_contacts
DROP POLICY IF EXISTS "Tenant Isolation" ON public.account_contacts;
CREATE POLICY "Tenant Isolation" ON public.account_contacts FOR ALL
USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- account_branches
DROP POLICY IF EXISTS "Tenant Isolation" ON public.account_branches;
CREATE POLICY "Tenant Isolation" ON public.account_branches FOR ALL
USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- deal_products
DROP POLICY IF EXISTS "Tenant Isolation" ON public.deal_products;
CREATE POLICY "Tenant Isolation" ON public.deal_products FOR ALL
USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- deal_activities
DROP POLICY IF EXISTS "Tenant Isolation" ON public.deal_activities;
CREATE POLICY "Tenant Isolation" ON public.deal_activities FOR ALL
USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);
