-- Migration: Add catalog_description and show_description_on_proposal to deal_products
-- Purpose: Allow per-product editable description for proposals (service scope, etc.)

-- 1. Add catalog_description column (free-text description for proposal display)
ALTER TABLE public.deal_products ADD COLUMN IF NOT EXISTS catalog_description TEXT;

-- 2. Add show_description_on_proposal toggle (controls visibility in PDF proposal)
ALTER TABLE public.deal_products ADD COLUMN IF NOT EXISTS show_description_on_proposal BOOLEAN DEFAULT true;

-- 3. Backfill: copy product catalog description to deal_products where it's plain text (not JSON)
-- Only for products that have a product_id link and where description is NOT JSON (starts with '[')
UPDATE public.deal_products dp
SET catalog_description = p.description
FROM public.products p
WHERE dp.product_id = p.id
  AND dp.catalog_description IS NULL
  AND p.description IS NOT NULL
  AND p.description != ''
  AND LEFT(TRIM(p.description), 1) != '[';
