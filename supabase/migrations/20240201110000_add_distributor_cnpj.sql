-- Add distributor_cnpj column to deal_products
-- This allows snapshotting the exact CNPJ used for a transaction, 
-- regardless of whether it came from the main account or a branch.

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'distributor_cnpj') THEN
        ALTER TABLE public.deal_products ADD COLUMN distributor_cnpj text;
    END IF;
END $$;
