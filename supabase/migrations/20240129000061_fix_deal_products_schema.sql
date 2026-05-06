-- FIX DEAL PRODUCTS SCHEMA
-- This script adds missing columns to deal_products that are required by the application logic.

DO $$
BEGIN
    -- 1. Manufacturer
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'manufacturer') THEN
        ALTER TABLE public.deal_products ADD COLUMN manufacturer text;
    END IF;

    -- 2. Category / Subcategory
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'category') THEN
        ALTER TABLE public.deal_products ADD COLUMN category text;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'subcategory') THEN
        ALTER TABLE public.deal_products ADD COLUMN subcategory text;
    END IF;

    -- 3. Distributor Info (Per Product)
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'distributor_id') THEN
        ALTER TABLE public.deal_products ADD COLUMN distributor_id uuid REFERENCES public.accounts(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'distributor_branch_id') THEN
        ALTER TABLE public.deal_products ADD COLUMN distributor_branch_id uuid REFERENCES public.account_branches(id) ON DELETE SET NULL;
    END IF;

    -- 4. Tax / Fiscal
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'ncm') THEN
        ALTER TABLE public.deal_products ADD COLUMN ncm text;
    END IF;

    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'icms') THEN
        ALTER TABLE public.deal_products ADD COLUMN icms numeric DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'ipi') THEN
        ALTER TABLE public.deal_products ADD COLUMN ipi numeric DEFAULT 0;
    END IF;

END $$;
