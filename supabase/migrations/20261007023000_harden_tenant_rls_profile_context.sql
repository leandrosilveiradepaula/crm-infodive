-- Harden tenant authorization: derive organization membership from public.profiles,
-- never from user-editable JWT user_metadata.
--
-- This migration is intentionally fail-closed:
-- * authenticated users without an active profile resolve to NULL and match no tenant rows;
-- * service_role/server-side writes must continue to pass organization_id explicitly;
-- * no permissive public/anon execute grant is left on the helper.
--
-- Rollback note: restoring JWT/user_metadata policies would re-introduce the security
-- weakness fixed here and is therefore not provided as an automatic rollback. A rollback
-- must be a reviewed production migration with explicit authorization.

CREATE OR REPLACE FUNCTION public.current_user_organization_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT p.organization_id
  FROM public.profiles AS p
  WHERE p.id = auth.uid()
    AND COALESCE(p.status, 'active') <> 'inactive'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_user_organization_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_organization_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_organization_id() TO service_role;

-- Keep the legacy helper name because existing triggers already call it, but remove
-- its dependency on request.jwt.claims/user_metadata.
CREATE OR REPLACE FUNCTION public.get_jwt_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = pg_catalog, public
AS $$
  SELECT public.current_user_organization_id();
$$;

REVOKE ALL ON FUNCTION public.get_jwt_org_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_jwt_org_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_jwt_org_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_jwt_org_id() TO service_role;

-- set_organization_id remains compatible with authenticated requests and with
-- privileged server-side writes that explicitly provide organization_id.
CREATE OR REPLACE FUNCTION public.set_organization_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog, public
AS $$
DECLARE
  profile_org_id uuid;
BEGIN
  profile_org_id := public.current_user_organization_id();

  IF profile_org_id IS NOT NULL THEN
    NEW.organization_id := profile_org_id;
  ELSIF NEW.organization_id IS NULL THEN
    RAISE EXCEPTION 'Missing organization_id: authenticated tenant membership was not resolved and no explicit server-side tenant was provided.';
  END IF;

  RETURN NEW;
END;
$$;

-- Rebuild every known "Tenant Isolation" policy that used user_metadata.
-- Tables are checked dynamically so the migration remains safe across partially
-- provisioned historical environments.
DO $$
DECLARE
  table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY[
    'accounts','products','deals','app_settings','pipeline_stages','activities',
    'account_contacts','account_branches','deal_products','deal_activities',
    'proposals','leads','automations','email_templates','deal_rooms'
  ]
  LOOP
    IF to_regclass('public.' || table_name) IS NOT NULL
       AND EXISTS (
         SELECT 1
         FROM information_schema.columns
         WHERE table_schema = 'public'
           AND information_schema.columns.table_name = table_name
           AND column_name = 'organization_id'
       )
    THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Tenant Isolation', table_name);
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', 'Tenant Isolation Profile', table_name);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (organization_id = public.current_user_organization_id()) WITH CHECK (organization_id = public.current_user_organization_id())',
        'Tenant Isolation Profile',
        table_name
      );
    END IF;
  END LOOP;
END;
$$;

-- Audit log policies: prevent an authenticated caller from choosing another tenant.
DO $$
BEGIN
  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can view logs of their organization" ON public.audit_logs;
    DROP POLICY IF EXISTS "System can insert logs" ON public.audit_logs;
    DROP POLICY IF EXISTS "Tenant Isolation Profile" ON public.audit_logs;

    CREATE POLICY "Tenant Isolation Profile"
      ON public.audit_logs
      FOR ALL
      TO authenticated
      USING (organization_id = public.current_user_organization_id())
      WITH CHECK (organization_id = public.current_user_organization_id());
  END IF;
END;
$$;

-- Integration tables: replace historical top-level JWT organization_id checks.
DO $$
BEGIN
  IF to_regclass('public.integrations') IS NOT NULL THEN
    ALTER TABLE public.integrations ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage their integrations" ON public.integrations;
    DROP POLICY IF EXISTS "Tenant Isolation Profile" ON public.integrations;
    CREATE POLICY "Tenant Isolation Profile" ON public.integrations FOR ALL TO authenticated
      USING (organization_id = public.current_user_organization_id())
      WITH CHECK (organization_id = public.current_user_organization_id());
  END IF;

  IF to_regclass('public.api_keys') IS NOT NULL THEN
    ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage their api keys" ON public.api_keys;
    DROP POLICY IF EXISTS "Tenant Isolation Profile" ON public.api_keys;
    CREATE POLICY "Tenant Isolation Profile" ON public.api_keys FOR ALL TO authenticated
      USING (organization_id = public.current_user_organization_id())
      WITH CHECK (organization_id = public.current_user_organization_id());
  END IF;

  IF to_regclass('public.webhooks') IS NOT NULL THEN
    ALTER TABLE public.webhooks ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "Users can manage their webhooks" ON public.webhooks;
    DROP POLICY IF EXISTS "Tenant Isolation Profile" ON public.webhooks;
    CREATE POLICY "Tenant Isolation Profile" ON public.webhooks FOR ALL TO authenticated
      USING (organization_id = public.current_user_organization_id())
      WITH CHECK (organization_id = public.current_user_organization_id());
  END IF;
END;
$$;

-- Invoice storage policies also used JWT claims directly.
DO $$
BEGIN
  IF to_regclass('storage.objects') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can upload invoices to their organization folder" ON storage.objects;
    DROP POLICY IF EXISTS "Users can see invoices from their organization folder" ON storage.objects;
    DROP POLICY IF EXISTS "Users can delete invoices from their organization folder" ON storage.objects;

    CREATE POLICY "Users can upload invoices to their organization folder"
      ON storage.objects FOR INSERT TO authenticated
      WITH CHECK (
        bucket_id = 'invoices'
        AND (storage.foldername(name))[1] = public.current_user_organization_id()::text
      );

    CREATE POLICY "Users can see invoices from their organization folder"
      ON storage.objects FOR SELECT TO authenticated
      USING (
        bucket_id = 'invoices'
        AND (storage.foldername(name))[1] = public.current_user_organization_id()::text
      );

    CREATE POLICY "Users can delete invoices from their organization folder"
      ON storage.objects FOR DELETE TO authenticated
      USING (
        bucket_id = 'invoices'
        AND (storage.foldername(name))[1] = public.current_user_organization_id()::text
      );
  END IF;
END;
$$;
