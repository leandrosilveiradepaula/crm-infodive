-- Migration: Definitive Tenant Isolation with DB Triggers
-- Forces organization_id on all inserts based on authenticated JWT.
-- Backfills existing orphaned data to the primary organization.

-- 1. Function to safely extract organization_id from the JWT snippet
CREATE OR REPLACE FUNCTION public.get_jwt_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
AS $$
  SELECT NULLIF(current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'organization_id', '')::uuid;
$$;

-- 2. Trigger function to auto-inject organization_id on INSERT
CREATE OR REPLACE FUNCTION public.set_organization_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_org_id uuid;
BEGIN
  -- Extract from JWT
  jwt_org_id := public.get_jwt_org_id();
  
  -- If we are in an authenticated context and have an org ID, force it.
  -- (Allows service_role bypasses if jwt_org_id is null and one is provided)
  IF jwt_org_id IS NOT NULL THEN
    NEW.organization_id := jwt_org_id;
  ELSIF NEW.organization_id IS NULL THEN
    -- Fallback for service_role scripts or old clients
    NEW.organization_id := 'b4366e33-b8d5-4cbc-a7a7-8bd607031931'::uuid;
  END IF;

  RETURN NEW;
END;
$$;

-- 3. Apply the trigger to all core multitenant tables
DROP TRIGGER IF EXISTS ensure_org_id_accounts ON public.accounts;
CREATE TRIGGER ensure_org_id_accounts
  BEFORE INSERT ON public.accounts
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS ensure_org_id_products ON public.products;
CREATE TRIGGER ensure_org_id_products
  BEFORE INSERT ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS ensure_org_id_deals ON public.deals;
CREATE TRIGGER ensure_org_id_deals
  BEFORE INSERT ON public.deals
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS ensure_org_id_pipeline_stages ON public.pipeline_stages;
CREATE TRIGGER ensure_org_id_pipeline_stages
  BEFORE INSERT ON public.pipeline_stages
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS ensure_org_id_app_settings ON public.app_settings;
CREATE TRIGGER ensure_org_id_app_settings
  BEFORE INSERT ON public.app_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

-- 4. Definitive Backfill: Fix all orphaned records
DO $$
DECLARE
  primary_org uuid := 'b4366e33-b8d5-4cbc-a7a7-8bd607031931'::uuid;
BEGIN
  -- Standard tables
  UPDATE public.accounts SET organization_id = primary_org WHERE organization_id IS NULL;
  UPDATE public.products SET organization_id = primary_org WHERE organization_id IS NULL;
  UPDATE public.deals SET organization_id = primary_org WHERE organization_id IS NULL;
  UPDATE public.pipeline_stages SET organization_id = primary_org WHERE organization_id IS NULL;
  
  -- Handle app_settings carefully due to unique constraint on (organization_id, key)
  UPDATE public.app_settings 
  SET organization_id = primary_org 
  WHERE organization_id IS NULL 
  AND key NOT IN (SELECT key FROM public.app_settings WHERE organization_id = primary_org);
  
  -- Clean up remaining app_settings duplicates that would conflict
  DELETE FROM public.app_settings WHERE organization_id IS NULL;
END $$;
