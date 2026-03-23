-- Migration: Create Contact Blacklists (Ignored Emails)

CREATE TABLE IF NOT EXISTS public.contact_blacklists (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id uuid NOT NULL,
    email text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    
    -- Ensure an email is only blacklisted once per organization
    CONSTRAINT contact_blacklists_org_email_unique UNIQUE (organization_id, email)
);

-- Enable RLS
ALTER TABLE public.contact_blacklists ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see blacklists from their own organization
DROP POLICY IF EXISTS "Tenant Isolation" ON public.contact_blacklists;
CREATE POLICY "Tenant Isolation" ON public.contact_blacklists FOR ALL
TO authenticated
USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);
