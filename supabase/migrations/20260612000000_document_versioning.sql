-- Migration: Add parent_id and version to public.documents for document versioning

BEGIN;

-- Add parent_id pointing to the original document (null means it is the original/latest document root)
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.documents(id) ON DELETE CASCADE;

-- Add version column to track version sequence (1 = initial version)
ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1 NOT NULL;

-- Create an index on parent_id to speed up retrieving histories
CREATE INDEX IF NOT EXISTS idx_documents_parent_id ON public.documents(parent_id);

COMMIT;
