-- Tabela de Convites Seguros
CREATE TABLE IF NOT EXISTS public.invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL,
    organization_id UUID NOT NULL,
    invited_by UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, accepted, revoked
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index para buscar convites rápidos por email ou token (id)
CREATE INDEX IF NOT EXISTS idx_invitations_email ON public.invitations (email);
CREATE INDEX IF NOT EXISTS idx_invitations_org ON public.invitations (organization_id);

-- Habilitar RLS
ALTER TABLE public.invitations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
-- 1. Qualquer pessoa logada que pertence a organização pode ler os convites da empresa
CREATE POLICY "Users can view invitations from their organization"
    ON public.invitations
    FOR SELECT
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles WHERE organization_id = invitations.organization_id
        )
    );

-- 2. Somente Admin e Managers podem criar convites
CREATE POLICY "Admins and Managers can create invitations"
    ON public.invitations
    FOR INSERT
    WITH CHECK (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE organization_id = invitations.organization_id 
            AND role IN ('admin', 'manager')
        )
    );

-- 3. Somente Admin e Managers podem revogar convites
CREATE POLICY "Admins and Managers can update invitations"
    ON public.invitations
    FOR UPDATE
    USING (
        auth.uid() IN (
            SELECT id FROM public.profiles 
            WHERE organization_id = invitations.organization_id 
            AND role IN ('admin', 'manager')
        )
    );
