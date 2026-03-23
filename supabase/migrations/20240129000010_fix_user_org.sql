-- FIX USER ORGANIZATION ID AND DATA VISIBILITY
-- This script fixes the "Missing Org ID" issue identified in the debug page.

DO $$
DECLARE
    target_email text := 'leandro.silveira@infodive.com.br'; -- YOUR EMAIL
    new_org_id uuid := gen_random_uuid();
    user_id uuid;
BEGIN
    -- 1. Get the User ID
    SELECT id INTO user_id FROM auth.users WHERE email = target_email;

    IF user_id IS NOT NULL THEN
        -- 2. Update User Metadata to include organization_id
        UPDATE auth.users
        SET raw_user_meta_data = 
            COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object('organization_id', new_org_id)
        WHERE id = user_id;

        RAISE NOTICE 'User metadata updated with Org ID: %', new_org_id;

        -- 3. Update Existing Data to match this new Org ID
        -- This ensures you see the existing accounts/deals in your dashboard
        
        -- Accounts
        UPDATE public.accounts 
        SET organization_id = new_org_id 
        WHERE organization_id IS NULL;

        -- Deals (if table exists)
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'deals') THEN
            UPDATE public.deals 
            SET organization_id = new_org_id 
            WHERE organization_id IS NULL;
        END IF;

        -- Activities (if table exists)
        IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'activities') THEN
            UPDATE public.activities 
            SET organization_id = new_org_id 
            WHERE organization_id IS NULL;
        END IF;

        RAISE NOTICE 'Existing data linked to Org ID.';
    ELSE
        RAISE NOTICE 'User not found. Please check the email address.';
    END IF;
END $$;
