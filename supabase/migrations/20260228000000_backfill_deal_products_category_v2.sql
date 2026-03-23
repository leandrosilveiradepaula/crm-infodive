-- Migration: Backfill category for deal_products without a product_id link
-- This complements 20260224100000_backfill_deal_products_category.sql which
-- only handled rows with a linked product_id.
-- This migration infers category from the product name for unlinked rows.

UPDATE public.deal_products
SET category = CASE
    -- Services / Support keywords
    WHEN name ILIKE '%suporte%'    THEN 'Serviço'
    WHEN name ILIKE '%support%'    THEN 'Serviço'
    WHEN name ILIKE '%expert care%' THEN 'Serviço'
    WHEN name ILIKE '%maintenance%' THEN 'Serviço'
    WHEN name ILIKE '%manutencao%'  THEN 'Serviço'
    WHEN name ILIKE '%manutenção%'  THEN 'Serviço'
    WHEN name ILIKE '%consultoria%' THEN 'Serviço'
    WHEN name ILIKE '%implantacao%' THEN 'Serviço'
    WHEN name ILIKE '%implantação%' THEN 'Serviço'
    WHEN name ILIKE '%treinamento%' THEN 'Serviço'
    WHEN name ILIKE '%training%'    THEN 'Serviço'
    WHEN name ILIKE '%anos%'        THEN 'Serviço'  -- "5 anos" = multi-year warranty/support
    WHEN name ILIKE '%year%'        THEN 'Serviço'

    -- Licensing keywords
    WHEN name ILIKE '%licença%'     THEN 'Licenciamento'
    WHEN name ILIKE '%license%'     THEN 'Licenciamento'
    WHEN name ILIKE '%subscription%' THEN 'Licenciamento'
    WHEN name ILIKE '%assinatura%'  THEN 'Licenciamento'

    -- Software keywords
    WHEN name ILIKE '%software%'    THEN 'Software'
    WHEN name ILIKE '%vmware%'      THEN 'Software'
    WHEN name ILIKE '%veeam%'       THEN 'Software'
    WHEN name ILIKE '%windows%'     THEN 'Software'
    WHEN name ILIKE '%office%'      THEN 'Software'
    WHEN name ILIKE '%microsoft%'   THEN 'Software'
    WHEN name ILIKE '%redhat%'      THEN 'Software'
    WHEN name ILIKE '%red hat%'     THEN 'Software'

    -- Hardware keywords (known brands/product lines)
    WHEN name ILIKE 'IBM%'          THEN 'Hardware'
    WHEN name ILIKE 'LENOVO%'       THEN 'Hardware'
    WHEN name ILIKE 'DELL%'         THEN 'Hardware'
    WHEN name ILIKE 'HP%'           THEN 'Hardware'
    WHEN name ILIKE 'HPE%'          THEN 'Hardware'
    WHEN name ILIKE 'CISCO%'        THEN 'Hardware'
    WHEN name ILIKE 'NETAPP%'       THEN 'Hardware'
    WHEN name ILIKE 'PURE STORAGE%' THEN 'Hardware'
    WHEN name ILIKE '%storage%'     THEN 'Hardware'
    WHEN name ILIKE '%servidor%'    THEN 'Hardware'
    WHEN name ILIKE '%server%'      THEN 'Hardware'
    WHEN name ILIKE '%switch%'      THEN 'Hardware'
    WHEN name ILIKE '%firewall%'    THEN 'Hardware'
    WHEN name ILIKE '%flash system%' THEN 'Hardware'
    WHEN name ILIKE '%blade%'       THEN 'Hardware'
    WHEN name ILIKE '%tape%'        THEN 'Hardware'
    WHEN name ILIKE '%fita%'        THEN 'Hardware'

    -- Default fallback
    ELSE 'Produto'
END
WHERE (category IS NULL OR category = '')
  AND product_id IS NULL;

-- Also re-run the catalog-based backfill in case it was missed for some rows
UPDATE public.deal_products dp
SET
    category    = COALESCE(NULLIF(dp.category, ''), p.category, 'Produto'),
    subcategory = COALESCE(NULLIF(dp.subcategory, ''), p.subcategory, '')
FROM public.products p
WHERE dp.product_id = p.id
  AND (dp.category IS NULL OR dp.category = ''
    OR dp.subcategory IS NULL OR dp.subcategory = '');
