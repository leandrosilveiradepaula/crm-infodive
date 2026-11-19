-- CRM #214 B4 — bind synthetic Auth users to trusted QA profiles.
-- Target: lwpjiufsetnpjuoyline ONLY. Do not run in production.
-- Must be run AFTER creating + auto-confirming the four users via Supabase Auth
-- Dashboard. No passwords or secret keys are stored in this file.
-- Roles follow src/lib/constants.ts (admin,manager,vendedor/sales).
BEGIN;
SET LOCAL lock_timeout='5s';
SET LOCAL statement_timeout='45s';
DO $bind$
DECLARE
 primary_org uuid;
 isolated_org uuid;
 admin_user uuid;
 manager_user uuid;
 sales_user uuid;
 isolated_user uuid;
BEGIN
 IF to_regnamespace('crm_qa_internal') IS NULL
 OR to_regclass('public.profiles') IS NULL
 THEN RAISE EXCEPTION 'CRM QA profile setup refused: QA baseline missing'; END IF;

 SELECT id INTO STRICT primary_org FROM crm_qa_internal.tenant_fixture
  WHERE label='CRM Infodive QA / fictitious-only';
 SELECT id INTO STRICT isolated_org FROM crm_qa_internal.tenant_fixture
  WHERE label='CRM QA isolation control / fictitious-only';

 IF (SELECT count(*) FROM auth.users WHERE email IN (
   'qa-admin@example.invalid','qa-manager@example.invalid',
   'qa-sales@example.invalid','qa-isolation@example.invalid')) <> 4
 THEN RAISE EXCEPTION 'Create all four synthetic Auth test accounts first'; END IF;

 IF EXISTS (SELECT 1 FROM auth.users
   WHERE email IN ('qa-admin@example.invalid','qa-manager@example.invalid',
     'qa-sales@example.invalid','qa-isolation@example.invalid')
     AND email_confirmed_at IS NULL)
 THEN RAISE EXCEPTION 'All QA test accounts must be email-confirmed via Auth Admin'; END IF;

 SELECT id INTO STRICT admin_user FROM auth.users WHERE email='qa-admin@example.invalid';
 SELECT id INTO STRICT manager_user FROM auth.users WHERE email='qa-manager@example.invalid';
 SELECT id INTO STRICT sales_user FROM auth.users WHERE email='qa-sales@example.invalid';
 SELECT id INTO STRICT isolated_user FROM auth.users WHERE email='qa-isolation@example.invalid';

 IF EXISTS (SELECT 1 FROM public.profiles
   WHERE id IN (admin_user,manager_user,sales_user,isolated_user))
 THEN RAISE EXCEPTION 'QA test profiles already exist; refusing to overwrite'; END IF;

 INSERT INTO public.profiles(id,organization_id,email,full_name,role,roles,status,
     commission_rules,quarterly_goals)
 VALUES
  (admin_user,primary_org,'qa-admin@example.invalid','QA Administrador Fictício','admin',
     ARRAY['admin']::text[],'active','{}'::jsonb,'{}'::jsonb),
  (manager_user,primary_org,'qa-manager@example.invalid','QA Gestor Fictício','manager',
     ARRAY['manager']::text[],'active','{}'::jsonb,'{}'::jsonb),
  (sales_user,primary_org,'qa-sales@example.invalid','QA Comercial Fictício','vendedor',
     ARRAY['sales']::text[],'active','{}'::jsonb,'{}'::jsonb),
  (isolated_user,isolated_org,'qa-isolation@example.invalid','QA Isolamento Fictício','admin',
     ARRAY['admin']::text[],'active','{}'::jsonb,'{}'::jsonb);

 UPDATE public.deals SET owner_id=admin_user
 WHERE organization_id=primary_org AND title='Oportunidade Fictícia Servidores';
 UPDATE public.deals SET owner_id=sales_user
 WHERE organization_id=primary_org AND title='Oportunidade Fictícia Licenças';
 UPDATE public.deals SET owner_id=isolated_user
 WHERE organization_id=isolated_org AND title='Oportunidade Controle Isolamento';
 UPDATE public.scenarios SET user_id=admin_user
 WHERE organization_id=primary_org AND name='Cenário Fictício';
END;
$bind$;
COMMIT;