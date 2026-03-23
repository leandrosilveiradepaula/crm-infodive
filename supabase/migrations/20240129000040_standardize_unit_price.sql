-- COMPREHENSIVE REPAIR FOR DEAL_PRODUCTS TABLE
-- This script ensures all columns expected by the application and the Math Engine are present.

DO $$
BEGIN
    -- 1. Standardize unit_price (previously price)
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'price') 
       AND NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'unit_price') THEN
        ALTER TABLE public.deal_products RENAME COLUMN price TO unit_price;
        RAISE NOTICE 'Renamed price to unit_price in deal_products.';
    ELSIF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'unit_price') THEN
        ALTER TABLE public.deal_products ADD COLUMN unit_price numeric DEFAULT 0;
        RAISE NOTICE 'Added unit_price column to deal_products.';
    END IF;

    -- 2. Basic Catalog and Item Info
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'product_id') THEN
        ALTER TABLE public.deal_products ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'sku') THEN
        ALTER TABLE public.deal_products ADD COLUMN sku text;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'description') THEN
        ALTER TABLE public.deal_products ADD COLUMN description text;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'display_order') THEN
        ALTER TABLE public.deal_products ADD COLUMN display_order integer DEFAULT 0;
    END IF;

    -- 3. Financial Columns (Standard & Margin)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'cost') THEN
        ALTER TABLE public.deal_products ADD COLUMN cost numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'margin') THEN
        ALTER TABLE public.deal_products ADD COLUMN margin numeric DEFAULT 30;
    END IF;

    -- 4. USD and International Logic
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'is_usd') THEN
        ALTER TABLE public.deal_products ADD COLUMN is_usd boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'usd_cost') THEN
        ALTER TABLE public.deal_products ADD COLUMN usd_cost numeric DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'exchange_rate') THEN
        ALTER TABLE public.deal_products ADD COLUMN exchange_rate numeric DEFAULT 0;
    END IF;

    -- 5. BID Mode and Registration
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'is_bid') THEN
        ALTER TABLE public.deal_products ADD COLUMN is_bid boolean DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'bid_number') THEN
        ALTER TABLE public.deal_products ADD COLUMN bid_number text;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'bid_validity') THEN
        ALTER TABLE public.deal_products ADD COLUMN bid_validity date;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'external_id') THEN
        ALTER TABLE public.deal_products ADD COLUMN external_id text;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'expiration_date') THEN
        ALTER TABLE public.deal_products ADD COLUMN expiration_date date;
    END IF;

    -- 6. Cleanup: drop legacy price if standard unit_price is now there
    IF EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'price') 
       AND EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'unit_price') THEN
        ALTER TABLE public.deal_products DROP COLUMN price;
        RAISE NOTICE 'Dropped legacy price column.';
    END IF;
    
END $$;
