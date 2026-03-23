-- Migration: Create Contact Suggestions (AI Quarantine Inbox)

CREATE TABLE IF NOT EXISTS public.contact_suggestions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL,
    status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    name text,
    email text,
    phone text,
    role text,
    company_name text,
    original_source text, -- Optional: Raw signature text for reference
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.contact_suggestions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see suggestions from their own organization
DROP POLICY IF EXISTS "Tenant Isolation" ON public.contact_suggestions;
CREATE POLICY "Tenant Isolation" ON public.contact_suggestions FOR ALL
TO authenticated
USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);
