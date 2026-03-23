-- Migration: Backfill organization_id for orphaned records
-- This associates existing records that have NULL organization_id 
-- with a specific organization (usually the owner's organization).

DO $$
DECLARE
    target_org_id uuid;
BEGIN
    -- 1. Identify a target organization (e.g., from the first admin profile)
    SELECT organization_id INTO target_org_id 
    FROM public.profiles 
    WHERE organization_id IS NOT NULL 
    LIMIT 1;

    IF target_org_id IS NULL THEN
        RAISE NOTICE 'No target organization found. Skipping backfill.';
        RETURN;
    END IF;

    -- 2. Update leads
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
        UPDATE public.leads 
        SET organization_id = target_org_id 
        WHERE organization_id IS NULL;
        RAISE NOTICE 'Backfilled organization_id for leads.';
    END IF;

    -- 3. Update automations
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'automations') THEN
        UPDATE public.automations 
        SET organization_id = target_org_id 
        WHERE organization_id IS NULL;
        RAISE NOTICE 'Backfilled organization_id for automations.';
    END IF;

    -- 4. Update email_templates
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_templates') THEN
        UPDATE public.email_templates 
        SET organization_id = target_org_id 
        WHERE organization_id IS NULL;
        RAISE NOTICE 'Backfilled organization_id for email_templates.';
    END IF;

END $$;
