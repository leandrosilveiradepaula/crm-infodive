-- FIX DEAL PRODUCTS MISSING COLUMNS
-- This script adds missing columns that are causing the backend queries to fail silently.

BEGIN;

-- 1. Add display_order (Required for sorting)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'display_order') THEN
        ALTER TABLE public.deal_products ADD COLUMN display_order integer DEFAULT 0;
    END IF;
END $$;

-- 2. Add created_at (Required for audit and sorting)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'created_at') THEN
        ALTER TABLE public.deal_products ADD COLUMN created_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 3. Add updated_at (Required for audit)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'updated_at') THEN
        ALTER TABLE public.deal_products ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;
END $$;

-- 4. Backfill existing NULLs (Just in case)
UPDATE public.deal_products SET display_order = 0 WHERE display_order IS NULL;
UPDATE public.deal_products SET created_at = now() WHERE created_at IS NULL;
UPDATE public.deal_products SET updated_at = now() WHERE updated_at IS NULL;

COMMIT;
