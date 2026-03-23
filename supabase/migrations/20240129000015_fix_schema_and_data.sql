-- FIX SCHEMA AND DATA (The "All-in-One" Fix)
-- This script safely adds the missing columns AND fixes your user data.

DO $$
DECLARE
    target_email text := 'leandro.silveira@infodive.com.br';
    new_org_id uuid := gen_random_uuid();
    user_id uuid;
BEGIN
    -- 1. SCHEMA REPAIR: Add organization_id if missing
    -- Accounts
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'accounts' AND column_name = 'organization_id') THEN
        ALTER TABLE public.accounts ADD COLUMN organization_id uuid;
        RAISE NOTICE 'Added organization_id to accounts.';
    END IF;

    -- Deals
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'deals') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deals' AND column_name = 'organization_id') THEN
            ALTER TABLE public.deals ADD COLUMN organization_id uuid;
            RAISE NOTICE 'Added organization_id to deals.';
        END IF;
    END IF;

    -- Products
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'products') THEN
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'products' AND column_name = 'organization_id') THEN
            ALTER TABLE public.products ADD COLUMN organization_id uuid;
            RAISE NOTICE 'Added organization_id to products.';
        END IF;
    END IF;

    -- 2. DATA REPAIR
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;

    IF user_id IS NOT NULL THEN
        -- Link User to New Org
        UPDATE auth.users
        SET raw_user_meta_data = 
            COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object('organization_id', new_org_id)
        WHERE id = user_id;
        
        RAISE NOTICE 'User % linked to new Org ID: %', target_email, new_org_id;

        -- Link Existing Data to New Org
        UPDATE public.accounts SET organization_id = new_org_id WHERE organization_id IS NULL;
        
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'deals') THEN
            UPDATE public.deals SET organization_id = new_org_id WHERE organization_id IS NULL;
        END IF;

        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activities') THEN
           UPDATE public.activities SET organization_id = new_org_id WHERE organization_id IS NULL;
        END IF;

        RAISE NOTICE 'All existing data has been moved to your new Organization.';
    ELSE
        RAISE NOTICE 'User not found. Please check the email address.';
    END IF;
END $$;
