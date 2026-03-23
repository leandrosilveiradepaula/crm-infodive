-- Migration: Strict Organization ID enforcement
-- Removes the hardcoded primary org ID fallback from the trigger function
-- and strictly requires either a JWT organization_id or an explicitly passed organization_id.

CREATE OR REPLACE FUNCTION public.set_organization_id()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  jwt_org_id uuid;
BEGIN
  -- Extract from JWT (if available, e.g. authenticated user request)
  jwt_org_id := public.get_jwt_org_id();
  
  -- 1. If we are in an authenticated context and have an org ID, force it securely.
  IF jwt_org_id IS NOT NULL THEN
    NEW.organization_id := jwt_org_id;
  
  -- 2. If NO JWT is present (e.g. Service Role or Server-Side script)
  ELSIF NEW.organization_id IS NULL THEN
    -- Block the insertion entirely instead of falling back to a default tenant
    RAISE EXCEPTION 'Missing organization_id: Cannot insert record without determining the tenant. Ensure JWT is present or organization_id is explicitly provided.';
  END IF;

  RETURN NEW;
END;
$$;
