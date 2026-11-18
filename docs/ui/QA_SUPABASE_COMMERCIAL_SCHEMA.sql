-- CRM Infodive #214 B4 — synthetic-only commercial schema for UI QA
-- QA ONLY: Supabase lwpjiufsetnpjuoyline. Never run in original/prod project.
-- Structured from CRM services, types, and repository migrations, NOT a production dump.
-- Explicitly a READ-ONLY E2E fixture schema; must be checked for schema drift
-- before interpreting passing UI smoke as business-functional equivalence.
BEGIN;
SET LOCAL lock_timeout = '5s';
SET LOCAL statement_timeout = '60s';
DO $guard$
BEGIN
 IF to_regclass('public.profiles') IS NULL
  OR to_regnamespace('crm_qa_internal') IS NULL
  OR (SELECT count(*) FROM information_schema.tables
      WHERE table_schema='public' AND table_type='BASE TABLE') <> 1
  OR EXISTS (SELECT 1 FROM auth.users)
 THEN RAISE EXCEPTION 'CRM QA commercial bootstrap refused: baseline/empty-user guard failed';
 END IF;
END;
$guard$;

-- The production app does not use a public organizations table.
-- The QA UUID is issued by the private tenant fixture; no hardcoded org ID.
CREATE SCHEMA crm_internal;
REVOKE ALL ON SCHEMA crm_internal FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA crm_internal TO authenticated, service_role;

CREATE FUNCTION crm_internal.current_organization_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = ''
AS $$
 SELECT p.organization_id FROM public.profiles p
 WHERE p.id = (SELECT auth.uid()) AND p.status = 'active'
 LIMIT 1
$$;
REVOKE ALL ON FUNCTION crm_internal.current_organization_id() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION crm_internal.current_organization_id() TO authenticated, service_role;

-- No writable public RPC for anonymous users; service-role-only server actions.
CREATE TABLE public.accounts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL, name text NOT NULL,
 cnpj text, ie text, segment text, status text DEFAULT 'Ativo', zip text, street text, number text,
 complement text, neighborhood text, city text, state text, tags text[] DEFAULT '{}',
 relationship_type text, logo_url text, payment_terms text, description text,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.account_contacts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
 name text NOT NULL, email text, mobile_phone text, landline_phone text, role text,
 is_primary boolean DEFAULT false, department text, notes text,
 created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.account_branches (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
 name text NOT NULL, zip text, street text, number text, complement text, neighborhood text,
 city text, state text, cnpj text, ie text, payment_terms text,
 created_at timestamptz DEFAULT now()
);

CREATE TABLE public.products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL, name text NOT NULL,
 category text, subcategory text, brand text, icon text, description text, sku text, price numeric,
 show_sku_on_proposal boolean DEFAULT true, duration_months integer,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.deals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
 owner_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
 title text NOT NULL, company text, value numeric DEFAULT 0, probability integer DEFAULT 0,
 stage text NOT NULL DEFAULT 'Lead', owner text, tags text[] DEFAULT '{}', description text,
 days_in_stage integer DEFAULT 0, expected_close_date date, won_at timestamptz, lost_at timestamptz,
 loss_reason text, health_score integer, last_contact_date date, commission_deduction numeric DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.deal_products (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
 product_id uuid REFERENCES public.products(id) ON DELETE SET NULL,
 parent_id uuid REFERENCES public.deal_products(id) ON DELETE SET NULL,
 name text NOT NULL, price numeric DEFAULT 0, unit_price numeric, quantity numeric DEFAULT 1,
 cost numeric DEFAULT 0, category text, subcategory text, brand text, custom_label text,
 display_name text, display_order integer DEFAULT 0, billing_type text DEFAULT 'one_time',
 pricing_model text DEFAULT 'one_time', duration_months integer, is_optional boolean DEFAULT false,
 show_sku_on_proposal boolean DEFAULT true, present_in_usd boolean NOT NULL DEFAULT false,
 created_at timestamptz DEFAULT now()
);

CREATE TABLE public.deal_activities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
 type text NOT NULL, description text, user_name text, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.activities (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 title text NOT NULL, description text, type text DEFAULT 'task', status text DEFAULT 'pending',
 priority text DEFAULT 'medium', "dueDate" date, "dueTime" time, "assignedTo" text,
 related_to jsonb, deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
 account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
 created_by uuid REFERENCES auth.users(id), created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.leads (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 name text, email text, phone text, mobile_phone text, company text, company_name text,
 position text, status text DEFAULT 'Novo', source text, origin text, segment text,
 interest text, notes text, description text, value numeric DEFAULT 0,
 assigned_to uuid REFERENCES public.profiles(id), converted_account_id uuid REFERENCES public.accounts(id),
 converted_deal_id uuid REFERENCES public.deals(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.pipeline_stages (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 name text NOT NULL, color text DEFAULT '#3b82f6', order_index integer DEFAULT 0,
 probability integer DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE(organization_id,name)
);

CREATE TABLE public.app_settings (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 key text NOT NULL, value jsonb, updated_at timestamptz NOT NULL DEFAULT now(),
 UNIQUE (organization_id,key)
);

CREATE TABLE public.proposals (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE, number text, title text NOT NULL,
 customer_id uuid, customer_name text, customer_email text, status text DEFAULT 'draft',
 template text, version integer NOT NULL DEFAULT 1, subtotal numeric DEFAULT 0,
 discount numeric DEFAULT 0, total numeric DEFAULT 0, valid_until timestamptz,
 content jsonb DEFAULT '{}'::jsonb, created_by uuid REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.proposal_versions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 proposal_id uuid NOT NULL REFERENCES public.proposals(id) ON DELETE CASCADE,
 version integer NOT NULL, content jsonb DEFAULT '{}'::jsonb, created_by uuid,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.proposal_signatures (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE,
 signer_name text, signer_email text, signer_role text, signature_image text, signed_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_rooms (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 deal_id uuid NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
 access_token text UNIQUE DEFAULT replace(gen_random_uuid()::text,'-',''),
 is_active boolean DEFAULT false, theme_color text, company_logo_url text,
 last_accessed_at timestamptz, created_at timestamptz DEFAULT now(),
 created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE public.documents (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 entity_type text, entity_id uuid, category text DEFAULT 'outro', name text, file_name text,
 file_path text, file_type text, file_size bigint, description text, created_by uuid REFERENCES auth.users(id),
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.sales_orders (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
 distributor_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL,
 distributor_branch_id uuid REFERENCES public.account_branches(id) ON DELETE SET NULL,
 status text DEFAULT 'pending', total_value numeric DEFAULT 0, invoice_url text,
 billed_at timestamptz, shipped_at timestamptz, delivered_at timestamptz,
 created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz DEFAULT now(),
 created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE public.sales_order_items (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 sales_order_id uuid NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
 product_sku text, product_name text NOT NULL, quantity numeric NOT NULL DEFAULT 1,
 unit_price numeric NOT NULL DEFAULT 0, cost numeric DEFAULT 0, margin numeric DEFAULT 0,
 external_id text, created_at timestamptz DEFAULT now()
);

CREATE TABLE public.sales_order_installments (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 sales_order_id uuid NOT NULL REFERENCES public.sales_orders(id) ON DELETE CASCADE,
 amount numeric(15,2) NOT NULL DEFAULT 0, due_date date NOT NULL,
 status text NOT NULL DEFAULT 'pending', created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contracts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 title text NOT NULL, company_name text NOT NULL, value numeric DEFAULT 0, status text DEFAULT 'draft',
 type text DEFAULT 'service', signer_name text, signer_role text, deal_id uuid REFERENCES public.deals(id),
 proposal_id uuid REFERENCES public.proposals(id), content_json jsonb, signature_image text,
 created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.service_contracts (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
 deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL, title text NOT NULL,
 type text DEFAULT 'support', start_date date, end_date date, status text DEFAULT 'active',
 monthly_value numeric DEFAULT 0, coverage_details text, created_by uuid REFERENCES auth.users(id),
 created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.customer_assets (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 account_id uuid NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
 service_contract_id uuid REFERENCES public.service_contracts(id) ON DELETE SET NULL,
 type text DEFAULT 'hardware', manufacturer text NOT NULL, name_model text NOT NULL,
 serial_number_or_key text, purchase_date date, warranty_expires_at date,
 status text DEFAULT 'active', created_by uuid REFERENCES auth.users(id),
 created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.automations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 name text NOT NULL, description text, type text, trigger_type text, trigger_config jsonb DEFAULT '{}'::jsonb,
 action_type text, action_config jsonb DEFAULT '{}'::jsonb, is_active boolean NOT NULL DEFAULT false,
 status text DEFAULT 'draft', created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.email_templates (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 name text NOT NULL, subject text, body text, content text, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.automation_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 automation_id uuid REFERENCES public.automations(id) ON DELETE CASCADE,
 status text, message text, result jsonb, created_at timestamptz DEFAULT now()
);

CREATE TABLE public.scenarios (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 name text NOT NULL, description text, year integer, scenario_data jsonb DEFAULT '{}'::jsonb,
 revenue_goal numeric DEFAULT 0, created_at timestamptz NOT NULL DEFAULT now(),
 updated_at timestamptz DEFAULT now()
);

CREATE TABLE public.campaigns (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 name text NOT NULL, description text, type text, status text,
 start_date date, end_date date, goal numeric DEFAULT 0, value numeric DEFAULT 0,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.integrations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 name text NOT NULL, provider text NOT NULL, status text DEFAULT 'disconnected',
 config_json jsonb DEFAULT '{}'::jsonb, last_sync timestamptz,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.api_keys (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 name text NOT NULL, token_prefix text NOT NULL, status text DEFAULT 'active',
 created_at timestamptz NOT NULL DEFAULT now(), last_used_at timestamptz
);

CREATE TABLE public.webhooks (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 url text NOT NULL, events text[] DEFAULT '{}', status text DEFAULT 'active',
 secret text, created_at timestamptz NOT NULL DEFAULT now(), last_triggered timestamptz
);

CREATE TABLE public.audit_logs (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 actor_id uuid REFERENCES auth.users(id), action text, entity_type text, entity_id uuid,
 metadata jsonb DEFAULT '{}'::jsonb, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.deal_quotes (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE, content jsonb DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contact_suggestions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 account_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL, name text, email text, phone text,
 status text, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.contact_blacklists (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 email text, phone text, reason text, created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.ai_activity_suggestions (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 user_id uuid REFERENCES auth.users(id), deal_id uuid REFERENCES public.deals(id),
 title text, description text, type text, status text DEFAULT 'pending', metadata jsonb DEFAULT '{}'::jsonb,
 created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.invitations (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(), organization_id uuid NOT NULL,
 email text NOT NULL, role text NOT NULL, invited_by uuid REFERENCES public.profiles(id),
 status text NOT NULL DEFAULT 'pending', expires_at timestamptz NOT NULL,
 created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()
);

-- Every new exposed-schema table is RLS-protected and has no anon/authenticated
-- privileges. Trusted server actions use service_role with explicit tenant filters.
DO $lockdown$
DECLARE t record;
BEGIN
 FOR t IN SELECT tablename FROM pg_tables
  WHERE schemaname='public' AND tablename <> 'profiles'
 LOOP
   EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY',t.tablename);
   EXECUTE format('REVOKE ALL ON TABLE public.%I FROM PUBLIC, anon, authenticated',t.tablename);
   EXECUTE format('GRANT ALL ON TABLE public.%I TO service_role',t.tablename);
 END LOOP;
END;
$lockdown$;
COMMIT;
