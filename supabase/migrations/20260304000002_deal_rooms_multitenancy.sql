-- Migration: Deal Rooms Multitenancy
-- Adds organization_id to deal_rooms table, backfills data, and enables strict RLS.

-- 1. Add organization_id column
ALTER TABLE public.deal_rooms ADD COLUMN IF NOT EXISTS organization_id uuid;

-- 2. Backfill organization_id from associated deals
UPDATE public.deal_rooms dr
SET organization_id = d.organization_id
FROM public.deals d
WHERE dr.deal_id = d.id
  AND dr.organization_id IS NULL;

-- 3. Create index for performance
CREATE INDEX IF NOT EXISTS deal_rooms_organization_id_idx ON public.deal_rooms (organization_id);

-- 4. Apply auto-inject trigger
DROP TRIGGER IF EXISTS set_deal_rooms_org_id ON public.deal_rooms;
CREATE TRIGGER set_deal_rooms_org_id
BEFORE INSERT ON public.deal_rooms
FOR EACH ROW EXECUTE FUNCTION public.set_organization_id();

-- 5. Drop existing permissive policies
DROP POLICY IF EXISTS "Allow all auth users deal_rooms" ON public.deal_rooms;
DROP POLICY IF EXISTS "Tenant Isolation" ON public.deal_rooms;

-- 6. Create strict tenant isolation policy
CREATE POLICY "Tenant Isolation" ON public.deal_rooms FOR ALL
USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid)
WITH CHECK (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- 7. Ensure RLS is enabled
ALTER TABLE public.deal_rooms ENABLE ROW LEVEL SECURITY;
