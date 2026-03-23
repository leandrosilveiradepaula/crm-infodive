-- Clean up existing state to ensure all columns are created correctly (Surgical Fix)
DROP TABLE IF EXISTS public.contracts CASCADE;

-- Create contracts table
CREATE TABLE public.contracts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL, -- Core for multitenancy
    title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    value NUMERIC(15, 2) DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'declined')),
    type TEXT NOT NULL DEFAULT 'service' CHECK (type IN ('service', 'nda', 'sales')),
    signer_name TEXT,
    signer_role TEXT,
    deal_id UUID REFERENCES public.deals(id) ON DELETE SET NULL,
    proposal_id UUID REFERENCES public.proposals(id) ON DELETE SET NULL,
    content_json JSONB,
    signature_image TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.contracts ENABLE ROW LEVEL SECURITY;

-- Multi-tenant isolation policy using standard public.get_jwt_org_id()
CREATE POLICY "Tenant Isolation" ON public.contracts FOR ALL
USING (organization_id = public.get_jwt_org_id())
WITH CHECK (organization_id = public.get_jwt_org_id());

-- Auto-inject organization_id on INSERT using existing project trigger
CREATE TRIGGER ensure_org_id_contracts
  BEFORE INSERT ON public.contracts
  FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

-- Index for performance
CREATE INDEX IF NOT EXISTS contracts_organization_id_idx ON public.contracts(organization_id);
CREATE INDEX IF NOT EXISTS contracts_deal_id_idx ON public.contracts(deal_id);
