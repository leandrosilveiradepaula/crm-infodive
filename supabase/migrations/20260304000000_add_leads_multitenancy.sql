-- Migration: Safe Multitenancy Fix for Leads and potential Automation tables
-- Updates tables ONLY if they exist, preventing script crashes.

DO $$
BEGIN
    -- 1. Table: leads
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'leads') THEN
        -- Add column
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leads' AND column_name = 'organization_id') THEN
            ALTER TABLE public.leads ADD COLUMN organization_id uuid;
        END IF;
        
        -- Enable RLS
        ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
        
        -- Create Index
        CREATE INDEX IF NOT EXISTS leads_organization_id_idx ON public.leads (organization_id);
        
        -- Create Policy
        DROP POLICY IF EXISTS "Tenant Isolation" ON public.leads;
        CREATE POLICY "Tenant Isolation" ON public.leads FOR ALL
        USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
        WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);
        
        -- Create Trigger
        DROP TRIGGER IF EXISTS set_leads_org_id ON public.leads;
        CREATE TRIGGER set_leads_org_id BEFORE INSERT ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();
    END IF;

    -- 2. Table: automations
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'automations') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'automations' AND column_name = 'organization_id') THEN
            ALTER TABLE public.automations ADD COLUMN organization_id uuid;
        END IF;
        ALTER TABLE public.automations ENABLE ROW LEVEL SECURITY;
        CREATE INDEX IF NOT EXISTS automations_organization_id_idx ON public.automations (organization_id);
        DROP POLICY IF EXISTS "Tenant Isolation" ON public.automations;
        CREATE POLICY "Tenant Isolation" ON public.automations FOR ALL
        USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
        WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);
        DROP TRIGGER IF EXISTS set_automations_org_id ON public.automations;
        CREATE TRIGGER set_automations_org_id BEFORE INSERT ON public.automations FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();
    END IF;

    -- 3. Table: email_templates
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'email_templates') THEN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'email_templates' AND column_name = 'organization_id') THEN
            ALTER TABLE public.email_templates ADD COLUMN organization_id uuid;
        END IF;
        ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
        CREATE INDEX IF NOT EXISTS email_templates_organization_id_idx ON public.email_templates (organization_id);
        DROP POLICY IF EXISTS "Tenant Isolation" ON public.email_templates;
        CREATE POLICY "Tenant Isolation" ON public.email_templates FOR ALL
        USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
        WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);
        DROP TRIGGER IF EXISTS set_email_templates_org_id ON public.email_templates;
        CREATE TRIGGER set_email_templates_org_id BEFORE INSERT ON public.email_templates FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();
    END IF;
END $$;
