-- Migration: Proposals Multitenancy & Auto-Numbering
-- Adds organization_id to proposals table for proper tenant isolation,
-- updates RLS policies, and creates a function to generate sequential
-- proposal numbers scoped per organization.

-- 1. Add organization_id to proposals (idempotent)
ALTER TABLE public.proposals ADD COLUMN IF NOT EXISTS organization_id uuid;

-- 2. Backfill organization_id from the deal's organization_id where missing
UPDATE public.proposals p
SET organization_id = d.organization_id
FROM public.deals d
WHERE p.deal_id = d.id
  AND p.organization_id IS NULL;

-- 3. Apply the auto-inject trigger (reuses existing function set_organization_id)
DROP TRIGGER IF EXISTS set_proposals_org_id ON public.proposals;
CREATE TRIGGER set_proposals_org_id
BEFORE INSERT ON public.proposals
FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

-- 4. Drop existing permissive policies and replace with strict tenant isolation
DROP POLICY IF EXISTS "Allow authenticated users to insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Allow authenticated users to view proposals" ON public.proposals;
DROP POLICY IF EXISTS "Allow authenticated users to update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Allow authenticated users to delete proposals" ON public.proposals;
DROP POLICY IF EXISTS "Allow all auth users proposals" ON public.proposals;
DROP POLICY IF EXISTS "Tenant Isolation" ON public.proposals;

CREATE POLICY "Tenant Isolation" ON public.proposals FOR ALL
USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- 5. Function to generate the next proposal number for an organization
-- Format: PROP-{YEAR}-{NNNN} e.g. PROP-2026-0042
CREATE OR REPLACE FUNCTION public.get_next_proposal_number(p_organization_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_year    text := to_char(now(), 'YYYY');
    v_count   int;
    v_number  text;
BEGIN
    -- Count proposals for this org in the current year (for sequential numbering)
    SELECT COUNT(*) + 1
    INTO v_count
    FROM public.proposals
    WHERE organization_id = p_organization_id
      AND to_char(created_at, 'YYYY') = v_year;

    v_number := 'PROP-' || v_year || '-' || lpad(v_count::text, 4, '0');
    RETURN v_number;
END;
$$;
