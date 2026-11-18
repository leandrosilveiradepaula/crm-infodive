-- CRM Infodive #214 B4 — QA identity bootstrap
-- EXCLUSIVELY FOR Supabase project lwpjiufsetnpjuoyline (crm-infodive-qa).
-- Do not add this file to production migration sequence or run against CRM original.
-- Source: src/app/login/actions.ts, src/lib/auth-server.ts, src/services/UserService.ts,
-- src/types/profile.ts and current CRM security policy. No production data included.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '45s';

-- Pristine database guard: never replay this against an existing tenant.
DO $verify_qa_empty$
BEGIN
  IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
  ) OR EXISTS (SELECT 1 FROM auth.users LIMIT 1) THEN
    RAISE EXCEPTION 'CRM QA bootstrap refused: database not pristine';
  END IF;
END;
$verify_qa_empty$;

-- Tenant marker used only by QA operators; no client/API access.
CREATE SCHEMA crm_qa_internal;
REVOKE ALL ON SCHEMA crm_qa_internal FROM PUBLIC, anon, authenticated;
CREATE TABLE crm_qa_internal.tenant_fixture (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  label text NOT NULL UNIQUE CHECK (length(label) BETWEEN 3 AND 100),
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO crm_qa_internal.tenant_fixture(label)
VALUES ('CRM Infodive QA / fictitious-only');

-- Trusted profiles: login requires a server-owned active profile and UUID tenant.
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL,
  full_name text,
  email text,
  phone text,
  avatar_url text,
  role text,
  roles text[] NOT NULL DEFAULT '{}'::text[],
  status text NOT NULL DEFAULT 'active',
  theme_preference text CHECK (theme_preference IS NULL OR theme_preference IN ('light','dark')),
  monthly_goal numeric DEFAULT 0,
  yearly_goal numeric DEFAULT 0,
  quarterly_goals jsonb NOT NULL DEFAULT '{}'::jsonb,
  commission_rules jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX qa_profiles_org_active ON public.profiles(organization_id, status);

-- Least privilege: Auth user can read own profile, never self-select role/org/status.
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.profiles FROM PUBLIC, anon, authenticated;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;
CREATE POLICY qa_profile_self_read ON public.profiles
  FOR SELECT TO authenticated USING (id = (SELECT auth.uid()));

COMMENT ON TABLE public.profiles IS
  'CRM Infodive isolated QA bootstrap: service-owned profiles; no production users.';
COMMIT;