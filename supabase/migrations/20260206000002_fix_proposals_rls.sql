-- Fix RLS Policies for Proposals Table
-- Run this SQL in Supabase Dashboard SQL Editor

-- Drop existing restrictive policies if they exist
DROP POLICY IF EXISTS "Users can insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can view own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can update own proposals" ON public.proposals;
DROP POLICY IF EXISTS "Users can delete own proposals" ON public.proposals;

-- Drop new policy names if they exist (for idempotency)
DROP POLICY IF EXISTS "Allow authenticated users to insert proposals" ON public.proposals;
DROP POLICY IF EXISTS "Allow authenticated users to view proposals" ON public.proposals;
DROP POLICY IF EXISTS "Allow authenticated users to update proposals" ON public.proposals;
DROP POLICY IF EXISTS "Allow authenticated users to delete proposals" ON public.proposals;

-- Create comprehensive policies that work with new signature fields
CREATE POLICY "Allow authenticated users to insert proposals"
ON public.proposals
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Allow authenticated users to view proposals"
ON public.proposals
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to update proposals"
ON public.proposals
FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Allow authenticated users to delete proposals"
ON public.proposals
FOR DELETE
TO authenticated
USING (true);
