-- Force assignment of the correct Azure AD Organization ID to all legacy data

DO $$
DECLARE
    -- This is the specific organization_id retrieved from the user's active OAuth token
    target_org_id uuid := 'b4366e33-b8d5-4cbc-a7a7-8bd607031931';
    table_rec record;
    col_exists boolean;
BEGIN
    -- Dynamically update all tables that possess the organization_id column
    FOR table_rec IN 
        SELECT unnest(ARRAY['accounts', 'products', 'deals', 'deal_products', 'deal_activities', 'app_settings', 'pipeline_stages', 'contact_suggestions', 'contact_blacklists', 'scenarios']) as tname
    LOOP
        -- Check if column exists
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_schema = 'public' 
              AND table_name = table_rec.tname 
              AND column_name = 'organization_id'
        ) INTO col_exists;

        IF col_exists THEN
            -- Update EVERYTHING to belong to this active organization.
            -- This fixes the mismatch caused by the previous fallback script generating a random UUID.
            EXECUTE format('UPDATE public.%I SET organization_id = $1', table_rec.tname)
            USING target_org_id;
        END IF;
    END LOOP;

END $$;
