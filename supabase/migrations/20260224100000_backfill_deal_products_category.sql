-- Migration: Backfill category and subcategory in deal_products
-- Fills in category/subcategory from the products catalog for deal_products
-- rows that have a linked product_id but were saved before these fields were
-- included in the addDealProduct payload.

UPDATE public.deal_products dp
SET
    category    = COALESCE(NULLIF(dp.category, ''),    p.category,    ''),
    subcategory = COALESCE(NULLIF(dp.subcategory, ''), p.subcategory, '')
FROM public.products p
WHERE dp.product_id = p.id
  AND (dp.category IS NULL OR dp.category = ''
    OR dp.subcategory IS NULL OR dp.subcategory = '');
