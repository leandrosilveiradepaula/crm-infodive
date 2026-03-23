-- EMERGENCY REPAIR: Consolidação Final (SaaS Multitenant)
-- Esta migração FORÇA a remoção de conflitos de nomes de colunas.

-- 1. Garantir que a tabela 'documents' use 'created_by' e não trave por 'uploaded_by'
DO $$ 
BEGIN 
    -- Se existir 'uploaded_by', garante que não é mais obrigatório antes de qualquer outra coisa
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by') THEN
        ALTER TABLE public.documents ALTER COLUMN uploaded_by DROP NOT NULL;
    END IF;

    -- Se 'created_by' existe e 'uploaded_by' existe, migra dados e deleta a antiga
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'created_by') 
       AND EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by') THEN
        UPDATE public.documents SET created_by = uploaded_by WHERE created_by IS NULL;
        ALTER TABLE public.documents DROP COLUMN uploaded_by;
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'uploaded_by') THEN
        -- Se SÓ existe 'uploaded_by', renomeia
        ALTER TABLE public.documents RENAME COLUMN uploaded_by TO created_by;
    END IF;

    -- Garante que created_by exista 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'documents' AND column_name = 'created_by') THEN
        ALTER TABLE public.documents ADD COLUMN created_by uuid REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. Garantir Tabelas de Vendas
CREATE TABLE IF NOT EXISTS public.sales_orders (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL,
    deal_id uuid REFERENCES public.deals(id) ON DELETE SET NULL,
    distributor_id uuid,
    distributor_branch_id uuid,
    status text NOT NULL DEFAULT 'pending',
    total_value numeric NOT NULL DEFAULT 0,
    invoice_url text,
    billed_at timestamp with time zone,
    shipped_at timestamp with time zone,
    delivered_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    created_by uuid REFERENCES auth.users(id)
);

CREATE TABLE IF NOT EXISTS public.sales_order_items (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL,
    sales_order_id uuid REFERENCES public.sales_orders(id) ON DELETE CASCADE,
    product_sku text,
    product_name text NOT NULL,
    quantity numeric NOT NULL DEFAULT 1,
    unit_price numeric NOT NULL DEFAULT 0,
    cost numeric DEFAULT 0,
    margin numeric DEFAULT 0,
    external_id text
);

-- 3. Defesas de Colunas (Caso as tabelas já existissem incompletas)
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE public.sales_orders ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id);
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS organization_id uuid;
ALTER TABLE public.documents ADD COLUMN IF NOT EXISTS category text DEFAULT 'outro';

-- 4. RLS e Triggers (Isolamento por Tenant)
ALTER TABLE public.sales_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Tenant Isolation" ON public.sales_orders;
CREATE POLICY "Tenant Isolation" ON public.sales_orders FOR ALL USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

DROP POLICY IF EXISTS "Tenant Isolation" ON public.sales_order_items;
CREATE POLICY "Tenant Isolation" ON public.sales_order_items FOR ALL USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

DROP POLICY IF EXISTS "Tenant Isolation" ON public.documents;
CREATE POLICY "Tenant Isolation" ON public.documents FOR ALL USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- Gatilhos de Auto-Tenant
DROP TRIGGER IF EXISTS set_sales_orders_org_id ON public.sales_orders;
CREATE TRIGGER set_sales_orders_org_id BEFORE INSERT ON public.sales_orders FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_sales_order_items_org_id ON public.sales_order_items;
CREATE TRIGGER set_sales_order_items_org_id BEFORE INSERT ON public.sales_order_items FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

DROP TRIGGER IF EXISTS set_documents_org_id ON public.documents;
CREATE TRIGGER set_documents_org_id BEFORE INSERT ON public.documents FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();
