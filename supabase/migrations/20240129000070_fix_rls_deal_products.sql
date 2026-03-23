-- FIX RLS ON DEAL_PRODUCTS
-- This script ensures RLS is enabled and proper permissions are granted for the deal_products table.

BEGIN;

-- 1. Enable RLS (idempotent)
ALTER TABLE public.deal_products ENABLE ROW LEVEL SECURITY;

-- 2. Drop potential conflicting policies
DROP POLICY IF EXISTS "Allow all auth users" ON public.deal_products;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.deal_products;
DROP POLICY IF EXISTS "Enable read access for all users" ON public.deal_products;
DROP POLICY IF EXISTS "Enable insert for users based on user_id" ON public.deal_products;

-- 3. Create a permissive policy for authenticated users (Client-Side Insert requires this)
-- Drop first to make this idempotent
DROP POLICY IF EXISTS "Allow all operations for authenticated users" ON public.deal_products;
CREATE POLICY "Allow all operations for authenticated users" 
ON public.deal_products 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- 4. Create policy for service_role (Backend operations)
DROP POLICY IF EXISTS "Allow all operations for service_role" ON public.deal_products;
CREATE POLICY "Allow all operations for service_role" 
ON public.deal_products 
FOR ALL 
TO service_role 
USING (true) 
WITH CHECK (true);

-- 5. Ensure sequence permissions (often overlooked)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON public.deal_products TO authenticated;
GRANT ALL ON public.deal_products TO service_role;

COMMIT;
