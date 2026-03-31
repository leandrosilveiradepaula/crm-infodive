-- Migration: Add display_name column to deal_products
-- Purpose: Allow users to set a customer-friendly name for proposals,
--          separate from the internal/technical IBM catalog name.
-- Created: 2026-03-27

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'deal_products' AND column_name = 'display_name'
    ) THEN
        ALTER TABLE public.deal_products
        ADD COLUMN display_name text DEFAULT NULL;

        COMMENT ON COLUMN public.deal_products.display_name IS
            'Optional customer-friendly name displayed in proposals. Falls back to "name" if null.';
    END IF;
END $$;
