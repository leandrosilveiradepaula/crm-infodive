-- Migration: Add pricing_model to deal_products
-- Supports: 'one_time' (default), 'monthly', 'annual'

ALTER TABLE public.deal_products
ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'one_time';

-- Add constraint for valid values
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'deal_products_pricing_model_check'
    ) THEN
        ALTER TABLE public.deal_products
        ADD CONSTRAINT deal_products_pricing_model_check
        CHECK (pricing_model IN ('one_time', 'monthly', 'annual'));
    END IF;
END $$;

-- Also add to products catalog for defaults
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'one_time';
