-- SURGICAL SCHEMA CORRECTION: Definitive Fix for 42703 (Undefined Column)
-- Standardizes organization_id across all tables and normalizes the documents schema.

BEGIN;

-- 1. FIX: deal_products
-- Add organization_id if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deal_products' AND column_name = 'organization_id') THEN
        ALTER TABLE public.deal_products ADD COLUMN organization_id uuid;
    END IF;
END $$;

-- Backfill organization_id from parent deals
UPDATE public.deal_products dp
SET organization_id = d.organization_id
FROM public.deals d
WHERE dp.deal_id = d.id AND dp.organization_id IS NULL;

-- Make it NOT NULL after backfill (only if we have data or it's safe)
-- ALTER TABLE public.deal_products ALTER COLUMN organization_id SET NOT NULL;

-- 2. FIX: deal_activities (or activities)
-- Ensure both have organization_id to avoid code mismatches
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'deal_activities' AND column_name = 'organization_id') THEN
        ALTER TABLE public.deal_activities ADD COLUMN organization_id uuid;
    END IF;
END $$;

UPDATE public.deal_activities da
SET organization_id = d.organization_id
FROM public.deals d
WHERE da.deal_id = d.id AND da.organization_id IS NULL;

-- 3. FIX: documents (Normalization to SaaS Standard)
DO $$ 
BEGIN 
    -- Ensure basic columns exist for the generic DocumentService
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'entity_type') THEN
        ALTER TABLE public.documents ADD COLUMN entity_type text;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'entity_id') THEN
        ALTER TABLE public.documents ADD COLUMN entity_id uuid;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_path') THEN
        ALTER TABLE public.documents ADD COLUMN file_path text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_type') THEN
        ALTER TABLE public.documents ADD COLUMN file_type text;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'file_size') THEN
        ALTER TABLE public.documents ADD COLUMN file_size bigint;
    END IF;

    -- Backfill entity_type/entity_id from legacy deal_id if present
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'deal_id') THEN
        UPDATE public.documents SET entity_type = 'deal', entity_id = deal_id WHERE entity_type IS NULL AND deal_id IS NOT NULL;
    END IF;
END $$;

-- 4. RLS & TRIGGERS (Enforce SaaS Isolation)
ALTER TABLE public.deal_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deal_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

-- Dynamic Tenant Isolation Policies using auth context
DROP POLICY IF EXISTS "Tenant Isolation" ON public.deal_products;
CREATE POLICY "Tenant Isolation" ON public.deal_products FOR ALL USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

DROP POLICY IF EXISTS "Tenant Isolation" ON public.deal_activities;
CREATE POLICY "Tenant Isolation" ON public.deal_activities FOR ALL USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

DROP POLICY IF EXISTS "Tenant Isolation" ON public.documents;
CREATE POLICY "Tenant Isolation" ON public.documents FOR ALL USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- Auto-Tenant Triggers
DROP TRIGGER IF EXISTS set_deal_products_org_id ON public.deal_products;
CREATE TRIGGER set_deal_products_org_id BEFORE INSERT ON public.deal_products FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_deal_activities_org_id ON public.deal_activities;
CREATE TRIGGER set_deal_activities_org_id BEFORE INSERT ON public.deal_activities FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_documents_org_id ON public.documents;
CREATE TRIGGER set_documents_org_id BEFORE INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

COMMIT;
