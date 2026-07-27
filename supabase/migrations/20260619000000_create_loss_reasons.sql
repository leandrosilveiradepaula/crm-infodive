-- Create loss_reasons table
CREATE TABLE IF NOT EXISTS public.loss_reasons (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.loss_reasons ENABLE ROW LEVEL SECURITY;

-- RLS Policy for Tenant Isolation (allowing global NULL organization_id)
DROP POLICY IF EXISTS "Tenant Isolation" ON public.loss_reasons;
CREATE POLICY "Tenant Isolation" ON public.loss_reasons FOR ALL
USING (
    organization_id IS NULL OR 
    organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
)
WITH CHECK (
    organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid
);

-- Insert Default Global Reasons
INSERT INTO public.loss_reasons (name, organization_id) VALUES
    ('Preço muito alto', NULL),
    ('Concorrente ganhou o negócio', NULL),
    ('Projeto cancelado / Falta de orçamento', NULL),
    ('Cliente parou de responder (Ghosting)', NULL),
    ('Faltou funcionalidade no produto/serviço', NULL),
    ('Decisão interna do cliente', NULL),
    ('Desistência / Adiamento do projeto', NULL)
ON CONFLICT DO NOTHING;
