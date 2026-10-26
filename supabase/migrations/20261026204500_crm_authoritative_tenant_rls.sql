-- P0: restore the database authorization boundary without modifying data.
-- Production deployment REQUIRES separate human authorization and verified backup.
-- All DDL is one atomic transaction. No user/tenant backfill or automatic grants.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '90s';

DO $guard$
BEGIN
  IF to_regclass('public.profiles') IS NULL
    OR to_regclass('public.accounts') IS NULL
    OR to_regclass('public.deals') IS NULL
    OR to_regclass('public.proposals') IS NULL
    OR to_regclass('public.automations') IS NULL
    OR to_regclass('public.automation_logs') IS NULL
    OR to_regclass('public.proposal_versions') IS NULL
  THEN
    RAISE EXCEPTION 'CRM P0 baseline schema mismatch: abort without changes';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles'
      AND column_name='organization_id' AND udt_name='uuid'
  ) THEN
    RAISE EXCEPTION 'CRM profiles tenant source missing or not UUID';
  END IF;
END;
$guard$;

-- Private, non-Data-API security boundary. The only source of truth is the
-- server-managed profile row; JWT user_metadata is NEVER authoritative.
CREATE SCHEMA IF NOT EXISTS crm_internal;
REVOKE ALL ON SCHEMA crm_internal FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA crm_internal TO authenticated, service_role;

CREATE OR REPLACE FUNCTION crm_internal.current_organization_id()
RETURNS uuid
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
  SELECT p.organization_id
  FROM public.profiles AS p
  WHERE p.id = (SELECT auth.uid())
    AND p.status = 'active'
    AND p.organization_id IS NOT NULL
  LIMIT 1;
$function$;
REVOKE ALL ON FUNCTION crm_internal.current_organization_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION crm_internal.current_organization_id() TO authenticated, service_role;

-- Existing RLS in contracts/assets calls this function. Preserve signature
-- but remove any dependency on user-editable JWT claims.
CREATE OR REPLACE FUNCTION public.get_jwt_org_id()
RETURNS uuid LANGUAGE sql STABLE
SET search_path = ''
AS $function$
  SELECT crm_internal.current_organization_id();
$function$;
REVOKE ALL ON FUNCTION public.get_jwt_org_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_jwt_org_id() TO authenticated, service_role;

-- Keep service-role/admin inserts explicit. Untrusted authenticated requests
-- can NEVER choose another organization even if the body/JWT metadata says so.
CREATE OR REPLACE FUNCTION public.set_organization_id()
RETURNS trigger LANGUAGE plpgsql
SET search_path = ''
AS $function$
DECLARE
  trusted_org uuid;
BEGIN
  IF current_user = 'authenticated' THEN
    trusted_org := crm_internal.current_organization_id();
    IF trusted_org IS NULL THEN
      RAISE EXCEPTION 'CRM tenant context unavailable' USING errcode='42501';
    END IF;
    NEW.organization_id := trusted_org;
  ELSIF current_user IN ('service_role','postgres') THEN
    IF NEW.organization_id IS NULL THEN
      RAISE EXCEPTION 'Explicit organization_id required' USING errcode='23502';
    END IF;
  ELSE
    RAISE EXCEPTION 'CRM tenant write denied' USING errcode='42501';
  END IF;
  RETURN NEW;
END;
$function$;
REVOKE ALL ON FUNCTION public.set_organization_id() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_organization_id() TO service_role;

-- Remove all policies referencing mutable auth.user_metadata. In the current
-- production schema there are 25 such policies over 21 tables. Recreate the
-- same tenant-qualified access on those 21 tables with the trusted profile.
DO $policies$
DECLARE
  p record;
  t text;
  target_tables text[] := ARRAY[
    'account_branches','account_contacts','accounts','activities',
    'app_settings','automations','contact_blacklists','contact_suggestions',
    'deal_activities','deal_products','deal_quotes','deal_rooms','deals',
    'documents','leads','pipeline_stages','products','proposals',
    'sales_order_installments','sales_order_items','sales_orders'
  ];
BEGIN
  FOR p IN
    SELECT tablename,policyname FROM pg_policies
    WHERE schemaname = 'public'
      AND (coalesce(qual,'') ILIKE '%user_metadata%'
        OR coalesce(with_check,'') ILIKE '%user_metadata%')
  LOOP
    IF p.tablename <> ALL(target_tables) THEN
      RAISE EXCEPTION 'Unexpected CRM mutable-metadata policy on %',p.tablename;
    END IF;
    EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename);
  END LOOP;

  FOREACH t IN ARRAY target_tables LOOP
    IF to_regclass(format('public.%I',t)) IS NULL
      OR NOT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema='public' AND c.table_name=t
          AND c.column_name='organization_id' AND c.udt_name='uuid'
      )
    THEN
      RAISE EXCEPTION 'Missing CRM tenant table/column: %',t;
    END IF;
    EXECUTE format('DROP POLICY IF EXISTS crm_verified_tenant_access ON public.%I',t);
    EXECUTE format(
      'CREATE POLICY crm_verified_tenant_access ON public.%I FOR ALL TO authenticated '
      ||'USING (organization_id = (SELECT crm_internal.current_organization_id())) '
      ||'WITH CHECK (organization_id = (SELECT crm_internal.current_organization_id()))',t
    );
  END LOOP;
END;
$policies$;

-- Remove permissive OR-bypass policies, keeping one tenant-owned route above.
DO $wide$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT tablename,policyname FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN (
        SELECT c.relname FROM pg_class c
        JOIN pg_namespace n ON n.oid=c.relnamespace
        JOIN pg_attribute a ON a.attrelid=c.oid
        WHERE n.nspname='public' AND c.relkind='r'
          AND a.attname='organization_id' AND NOT a.attisdropped
      )
      AND (btrim(coalesce(qual,''),' ()') = 'true'
        OR btrim(coalesce(with_check,''),' ()') = 'true'
        OR coalesce(qual,'') LIKE '%auth.role()%')
      AND roles <> ARRAY['service_role']::name[]
      AND policyname <> 'crm_verified_tenant_access'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename);
  END LOOP;
END;
$wide$;

-- RESTRICTIVE AND-boundary defeats any other remaining permissive RLS policy.
-- Only genuine authenticated members can see/mutate rows of their own org.
DO $tenant$
DECLARE t record;
BEGIN
  FOR t IN
    SELECT c.relname AS table_name
    FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    JOIN pg_attribute a ON a.attrelid=c.oid
    WHERE n.nspname='public' AND c.relkind='r'
      AND a.attname='organization_id' AND a.atttypid='uuid'::regtype
      AND NOT a.attisdropped AND c.relname <> 'profiles'
    ORDER BY c.relname
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t.table_name);
    EXECUTE format(
      'DROP POLICY IF EXISTS crm_verified_tenant_boundary ON public.%I',t.table_name);
    EXECUTE format(
      'CREATE POLICY crm_verified_tenant_boundary ON public.%I AS RESTRICTIVE FOR ALL TO authenticated '
      ||'USING (organization_id = (SELECT crm_internal.current_organization_id())) '
      ||'WITH CHECK (organization_id = (SELECT crm_internal.current_organization_id()))',
      t.table_name);
  END LOOP;
END;
$tenant$;

-- Profiles are an authorization database, not a user-editable public table.
-- Clients may modify only harmless self-service fields, never org/role/status.
DO $profile$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename='profiles'
  LOOP
    EXECUTE format('DROP POLICY %I ON public.profiles',p.policyname);
  END LOOP;
END;
$profile$;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY crm_profiles_member_read ON public.profiles
  FOR SELECT TO authenticated
  USING (organization_id = (SELECT crm_internal.current_organization_id()));
CREATE POLICY crm_profiles_self_edit ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()) AND
         organization_id = (SELECT crm_internal.current_organization_id()))
  WITH CHECK (id = (SELECT auth.uid()) AND
              organization_id = (SELECT crm_internal.current_organization_id()));
REVOKE ALL PRIVILEGES ON public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.profiles TO authenticated;
GRANT UPDATE (full_name,avatar_url,phone,theme_preference,dashboard_config,updated_at)
  ON public.profiles TO authenticated;

-- No unscoped Data API use by anonymous clients. Public token proposals are
-- served by the existing Next.js server route with server-side authorization.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM PUBLIC, anon;

-- Two originally unprotected child tables have no organization_id.
-- The parent must be visible under verified tenant RLS. Client writes are
-- disabled: application workers use the server-side service role.
ALTER TABLE public.automation_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proposal_versions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS crm_automation_logs_read ON public.automation_logs;
CREATE POLICY crm_automation_logs_read ON public.automation_logs
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.automations a
    WHERE a.id=automation_id AND
      a.organization_id=(SELECT crm_internal.current_organization_id())));
DROP POLICY IF EXISTS crm_proposal_versions_read ON public.proposal_versions;
CREATE POLICY crm_proposal_versions_read ON public.proposal_versions
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.proposals p
    WHERE p.id=proposal_id AND
      p.organization_id=(SELECT crm_internal.current_organization_id())));
REVOKE INSERT,UPDATE,DELETE ON public.automation_logs,public.proposal_versions
  FROM authenticated;

-- Tables without a provable tenant column/relationship must be server-only
-- until their specific domain permissions are independently reviewed.
REVOKE ALL PRIVILEGES ON
  public.organization_settings,public.omnichannel_conversations,
  public.omnichannel_messages,public.project_handovers,public.purchase_orders,
  public.proposal_signatures,public.api_keys,public.webhooks,
  public.integrations
FROM authenticated;

-- Static campaign configuration is server-managed; clients can read active
-- catalog items but never change them directly.
REVOKE INSERT,UPDATE,DELETE ON public.campaigns FROM authenticated;
DROP POLICY IF EXISTS "Manage Campaigns" ON public.campaigns;
DROP POLICY IF EXISTS "Read Active Campaigns" ON public.campaigns;
CREATE POLICY crm_campaign_active_read ON public.campaigns
  FOR SELECT TO authenticated USING (active IS TRUE);
DROP POLICY IF EXISTS "Anyone can read organization settings" ON public.organization_settings;
DROP POLICY IF EXISTS "Allow authenticated full access to signatures" ON public.proposal_signatures;
DROP POLICY IF EXISTS "Public view with token" ON public.proposals;

-- Audit integrity: only the server-side privileged path can write audit rows.
REVOKE INSERT,UPDATE,DELETE ON public.audit_logs FROM authenticated;
DROP POLICY IF EXISTS "System can insert logs" ON public.audit_logs;

-- Append-only business document and order tables without an intrinsic tenant
-- must be accessed via BFF service role until exact parent semantics verified.
-- This also neutralizes older FOR ALL/USING(true) policies.
DO $no_parent$
DECLARE p record;
BEGIN
  FOR p IN SELECT tablename,policyname FROM pg_policies
    WHERE schemaname='public'
      AND tablename IN (
        'project_handovers','purchase_orders',
        'omnichannel_conversations','omnichannel_messages')
  LOOP
    EXECUTE format('DROP POLICY %I ON public.%I',p.policyname,p.tablename);
  END LOOP;
END;
$no_parent$;

-- Badge/score summaries are private to the signed-in subject, not every
-- authenticated user in every organization.
DROP POLICY IF EXISTS "Read access for authenticated" ON public.user_badges;
DROP POLICY IF EXISTS "Read access for authenticated" ON public.user_scores;
CREATE POLICY crm_my_badges_read ON public.user_badges FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));
CREATE POLICY crm_my_scores_read ON public.user_scores FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

-- Public SECURITY DEFINER RPCs bypass RLS; table grants alone are not enough.
-- Public proposal/portal routes already call these functions through the trusted
-- Next.js BFF with service_role. Fail closed on a newly introduced unknown
-- definer routine instead of silently leaving it callable by anon.
DO $definer$
DECLARE p record;
DECLARE allowed text[] := ARRAY[
 'calculate_deal_health','get_deal_room_by_token',
 'get_next_proposal_number','get_proposal_by_public_token',
 'handle_deal_won_gamification','handle_new_user',
 'is_admin_or_manager','is_manager','log_activity','sign_proposal'
];
BEGIN
  FOR p IN
    SELECT x.oid,x.proname,x.oid::regprocedure AS signature
    FROM pg_proc x JOIN pg_namespace n ON n.oid=x.pronamespace
    WHERE n.nspname='public' AND x.prosecdef
  LOOP
    IF p.proname <> ALL(allowed) THEN
      RAISE EXCEPTION 'Unknown public SECURITY DEFINER routine: %',p.proname;
    END IF;
    -- Lock SECURITY DEFINER identifier resolution to trusted schemas, with
    -- pg_temp last so user-created temporary objects cannot shadow tables.
    -- Supabase pgcrypto may be installed under extensions (e.g. digest()).
    EXECUTE format('ALTER FUNCTION %s SET search_path = pg_catalog, public, extensions, pg_temp',p.signature);
    EXECUTE format('REVOKE ALL ON FUNCTION %s FROM PUBLIC,anon,authenticated',p.signature);
    EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO service_role',p.signature);
    IF p.proname IN (
      'calculate_deal_health','handle_deal_won_gamification',
      'handle_new_user','is_admin_or_manager','is_manager','log_activity'
    ) THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated',p.signature);
    END IF;
    IF p.proname='handle_new_user' AND
       EXISTS(SELECT 1 FROM pg_roles WHERE rolname='supabase_auth_admin') THEN
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO supabase_auth_admin',p.signature);
    END IF;
  END LOOP;
END;
$definer$;

-- Defensive postconditions: an unexpected table/privilege/policy aborts the
-- entire transaction. Production advisor rerun is still mandatory.
DO $post$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r' AND NOT c.relrowsecurity
  ) THEN
    RAISE EXCEPTION 'CRM RLS hardening left an unprotected public table';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname='public'
      AND (coalesce(qual,'') ILIKE '%user_metadata%'
        OR coalesce(with_check,'') ILIKE '%user_metadata%')
  ) THEN
    RAISE EXCEPTION 'CRM mutable metadata policy survived';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE n.nspname='public' AND c.relkind='r'
      AND has_table_privilege('anon',c.oid,'SELECT')
  ) THEN
    RAISE EXCEPTION 'CRM anonymous table SELECT grant survived';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef
      AND (p.proconfig IS NULL OR
           NOT ('search_path=pg_catalog, public, extensions, pg_temp' = ANY(p.proconfig)))
  ) THEN
    RAISE EXCEPTION 'Mutable SECURITY DEFINER search path survived';
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
    WHERE n.nspname='public' AND p.prosecdef
      AND has_function_privilege('anon',p.oid,'EXECUTE')
  ) THEN
    RAISE EXCEPTION 'Anonymous SECURITY DEFINER RPC survived';
  END IF;
END;
$post$;
COMMIT;
