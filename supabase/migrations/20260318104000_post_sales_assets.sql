-- Módulo de Pós-Venda: service_contracts e customer_assets

-- 1. Criação da Tabela de Contratos de Suporte
CREATE TABLE IF NOT EXISTS public.service_contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'support' CHECK (type IN ('support', 'warranty_extension', 'subscription')),
    start_date DATE,
    end_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'pending_renewal', 'canceled')),
    monthly_value NUMERIC(15, 2) DEFAULT 0,
    coverage_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices e Segurança de service_contracts
CREATE INDEX IF NOT EXISTS service_contracts_organization_id_idx ON public.service_contracts(organization_id);
CREATE INDEX IF NOT EXISTS service_contracts_account_id_idx ON public.service_contracts(account_id);

ALTER TABLE public.service_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation" ON public.service_contracts FOR ALL
USING (organization_id = public.get_jwt_org_id())
WITH CHECK (organization_id = public.get_jwt_org_id());

CREATE TRIGGER set_service_contracts_org_id 
BEFORE INSERT ON public.service_contracts 
FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

-- 2. Criação da Tabela de Equipamentos e Licenças (customer_assets)
CREATE TABLE IF NOT EXISTS public.customer_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    account_id UUID NOT NULL REFERENCES public.accounts(id) ON DELETE CASCADE,
    service_contract_id UUID REFERENCES public.service_contracts(id) ON DELETE SET NULL,
    type TEXT NOT NULL DEFAULT 'hardware' CHECK (type IN ('hardware', 'software_license', 'cloud_subscription')),
    manufacturer TEXT NOT NULL,
    name_model TEXT NOT NULL,
    serial_number_or_key TEXT,
    purchase_date DATE,
    warranty_expires_at DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'in_maintenance', 'retired')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Índices e Segurança de customer_assets
CREATE INDEX IF NOT EXISTS customer_assets_organization_id_idx ON public.customer_assets(organization_id);
CREATE INDEX IF NOT EXISTS customer_assets_account_id_idx ON public.customer_assets(account_id);

ALTER TABLE public.customer_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation" ON public.customer_assets FOR ALL
USING (organization_id = public.get_jwt_org_id())
WITH CHECK (organization_id = public.get_jwt_org_id());

CREATE TRIGGER set_customer_assets_org_id 
BEFORE INSERT ON public.customer_assets 
FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();
