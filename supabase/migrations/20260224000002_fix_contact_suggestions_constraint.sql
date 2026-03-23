-- Migration: Replace partial expression index with a proper named UNIQUE CONSTRAINT
-- Supabase's upsert (ON CONFLICT) requires a named constraint, not a partial/expression index.

-- Drop the previous index created in 20260224000001
DROP INDEX IF EXISTS public.contact_suggestions_org_email_unique;

-- Add a proper named unique constraint on (organization_id, email)
-- PostgreSQL allows multiple NULLs in a unique constraint (NULLs are never equal),
-- so rows with null emails can coexist — only non-null duplicate emails are blocked.
ALTER TABLE public.contact_suggestions
    DROP CONSTRAINT IF EXISTS contact_suggestions_org_email_key;

ALTER TABLE public.contact_suggestions
    ADD CONSTRAINT contact_suggestions_org_email_key UNIQUE (organization_id, email);
