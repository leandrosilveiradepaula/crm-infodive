-- Migration: Add unique constraint to prevent duplicate contact suggestions per org+email
-- This prevents double-inserts from React StrictMode double-invocation in dev
-- and from any other race condition between parallel sync calls.

-- First, remove existing duplicates keeping the most recent entry
DELETE FROM public.contact_suggestions a
USING public.contact_suggestions b
WHERE a.id < b.id
  AND a.organization_id = b.organization_id
  AND lower(a.email) = lower(b.email)
  AND a.email IS NOT NULL;

-- Add unique constraint: one pending suggestion per org+email
-- Using a partial unique index so we only deduplicate on non-null emails
CREATE UNIQUE INDEX IF NOT EXISTS contact_suggestions_org_email_unique
    ON public.contact_suggestions (organization_id, lower(email))
    WHERE email IS NOT NULL;
