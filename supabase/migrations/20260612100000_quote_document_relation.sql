-- Migration: Add quote_id referencing deal_quotes to public.documents

BEGIN;

ALTER TABLE public.documents 
ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.deal_quotes(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_documents_quote_id ON public.documents(quote_id);

COMMIT;
