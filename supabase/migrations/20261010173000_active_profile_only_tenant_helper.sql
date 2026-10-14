-- Fail closed for any profile state other than explicitly active.
-- Prepared migration: do not apply to a live CRM without admin gate,
-- schema checks and tenant-scoped rollback evidence.
-- Replaces only the helper created by 20261007023000; no permissive policy.
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
    AND p.status = 'active'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.current_user_organization_id() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.current_user_organization_id() FROM anon;
GRANT EXECUTE ON FUNCTION public.current_user_organization_id() TO authenticated;
GRANT EXECUTE ON FUNCTION public.current_user_organization_id() TO service_role;
