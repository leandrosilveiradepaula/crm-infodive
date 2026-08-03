-- Add recurring pricing model to deal_products.
-- Supported values: one_time, monthly, annual.

ALTER TABLE public.deal_products
ADD COLUMN IF NOT EXISTS pricing_model text DEFAULT 'one_time';

UPDATE public.deal_products
SET pricing_model = 'one_time'
WHERE pricing_model IS NULL;

ALTER TABLE public.deal_products
ALTER COLUMN pricing_model SET DEFAULT 'one_time',
ALTER COLUMN pricing_model SET NOT NULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'deal_products_pricing_model_check'
        AND conrelid = 'public.deal_products'::regclass
    ) THEN
        ALTER TABLE public.deal_products
        ADD CONSTRAINT deal_products_pricing_model_check
        CHECK (pricing_model IN ('one_time', 'monthly', 'annual'));
    END IF;
END $$;
