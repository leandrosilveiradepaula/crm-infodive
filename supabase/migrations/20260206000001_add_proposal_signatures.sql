-- Migration: Add Proposal Signatures
-- Implements digital signature functionality for proposals

-- 1. Create proposal_signatures table
CREATE TABLE IF NOT EXISTS public.proposal_signatures (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    proposal_id uuid REFERENCES public.proposals(id) ON DELETE CASCADE NOT NULL,
    
    -- Signature data
    signature_data text NOT NULL, -- Base64 canvas or image URL
    signature_type text NOT NULL CHECK (signature_type IN ('draw', 'type', 'upload')),
    
    -- Signer information
    signer_name text NOT NULL,
    signer_email text NOT NULL,
    signer_company text,
    signer_title text,
    
    -- Audit and security
    signer_ip text,
    user_agent text,
    signed_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    -- Digital certificate
    certificate_hash text UNIQUE, -- SHA-256 hash for validation
    certificate_pdf_url text,
    
    -- Metadata
    is_valid boolean DEFAULT true,
    invalidated_at timestamp with time zone,
    invalidated_reason text,
    
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add columns to proposals table
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS public_token text UNIQUE DEFAULT encode(gen_random_bytes(16), 'hex');
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS allow_signature boolean DEFAULT false;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS sent_at timestamp with time zone;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS viewed_at timestamp with time zone;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS signed_at timestamp with time zone;
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS signature_required boolean DEFAULT false;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposal_signatures_proposal_id ON public.proposal_signatures(proposal_id);
CREATE INDEX IF NOT EXISTS idx_proposals_public_token ON public.proposals(public_token);
CREATE INDEX IF NOT EXISTS idx_proposals_status ON public.proposals(status);

-- 4. Enable RLS
ALTER TABLE public.proposal_signatures ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies (idempotent)
DROP POLICY IF EXISTS "Allow authenticated full access to signatures" ON public.proposal_signatures;
CREATE POLICY "Allow authenticated full access to signatures" 
    ON public.proposal_signatures 
    FOR ALL 
    USING (auth.role() = 'authenticated');

-- 6. RPC: Get proposal by public token
CREATE OR REPLACE FUNCTION public.get_proposal_by_public_token(token_input text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    proposal_data jsonb;
BEGIN
    -- Fetch proposal and register view
    SELECT row_to_json(p)::jsonb
    INTO proposal_data
    FROM public.proposals p
    WHERE p.public_token = token_input
      AND p.status != 'draft'; -- Don't expose drafts
    
    -- If found, update viewed_at if first time
    IF proposal_data IS NOT NULL THEN
        UPDATE public.proposals 
        SET viewed_at = COALESCE(viewed_at, now()),
            status = CASE 
                WHEN status = 'sent' THEN 'viewed'::text 
                ELSE status 
            END
        WHERE public_token = token_input;
    END IF;
    
    RETURN proposal_data;
END;
$$;

-- 7. RPC: Sign proposal
CREATE OR REPLACE FUNCTION public.sign_proposal(
    token_input text,
    signature_data_input text,
    signature_type_input text,
    signer_name_input text,
    signer_email_input text,
    signer_company_input text DEFAULT NULL,
    signer_title_input text DEFAULT NULL,
    signer_ip_input text DEFAULT NULL,
    user_agent_input text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    proposal_id_var uuid;
    signature_id_var uuid;
    cert_hash_var text;
    result jsonb;
BEGIN
    -- Find proposal
    SELECT id INTO proposal_id_var
    FROM public.proposals
    WHERE public_token = token_input
      AND allow_signature = true
      AND status IN ('sent', 'viewed');
    
    IF proposal_id_var IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Proposta não encontrada ou não disponível para assinatura');
    END IF;
    
    -- Generate certificate hash
    cert_hash_var := encode(digest(
        proposal_id_var::text || signer_email_input || now()::text,
        'sha256'
    ), 'hex');
    
    -- Insert signature
    INSERT INTO public.proposal_signatures (
        proposal_id,
        signature_data,
        signature_type,
        signer_name,
        signer_email,
        signer_company,
        signer_title,
        signer_ip,
        user_agent,
        certificate_hash
    ) VALUES (
        proposal_id_var,
        signature_data_input,
        signature_type_input,
        signer_name_input,
        signer_email_input,
        signer_company_input,
        signer_title_input,
        signer_ip_input,
        user_agent_input,
        cert_hash_var
    ) RETURNING id INTO signature_id_var;
    
    -- Update proposal status
    UPDATE public.proposals
    SET status = 'signed',
        signed_at = now()
    WHERE id = proposal_id_var;
    
    result := jsonb_build_object(
        'success', true,
        'signatureId', signature_id_var,
        'certificateHash', cert_hash_var
    );
    
    RETURN result;
END;
$$;
