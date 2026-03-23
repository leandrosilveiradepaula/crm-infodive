-- Backfill missing organization_ids for legacy records dynamically
-- This ensures that older data remain visible under the default organization after RLS was enabled.

DO $$
DECLARE
    default_org_id uuid;
    table_rec record;
    col_exists boolean;
BEGIN
    -- Check if any user already has an organization_id we can use as the primary
    SELECT (raw_user_meta_data->>'organization_id')::uuid INTO default_org_id 
    FROM auth.users 
    WHERE raw_user_meta_data->>'organization_id' IS NOT NULL 
    LIMIT 1;

    -- If no user has one, generate a new UUID
    IF default_org_id IS NULL THEN
        default_org_id := gen_random_uuid();
    END IF;

    -- Update all users to belong to this default organization
    UPDATE auth.users
    SET raw_user_meta_data = jsonb_set(
        COALESCE(raw_user_meta_data, '{}'::jsonb),
        '{organization_id}',
        to_jsonb(default_org_id::text)
    )
    WHERE raw_user_meta_data->>'organization_id' IS NULL;

    -- Dynamically update only tables that actually possess the organization_id column
    FOR table_rec IN 
        SELECT unnest(ARRAY['accounts', 'products', 'deals', 'deal_products', 'deal_activities', 'app_settings', 'pipeline_stages']) as tname
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
            EXECUTE format('UPDATE public.%I SET organization_id = $1 WHERE organization_id IS NULL', table_rec.tname)
            USING default_org_id;
        END IF;
    END LOOP;

END $$;
