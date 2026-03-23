-- Ensure billing_type column exists (Idempotent)
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'deal_products' AND column_name = 'billing_type') THEN
        ALTER TABLE public.deal_products ADD COLUMN billing_type text DEFAULT 'direct';
        ALTER TABLE public.deal_products ADD CONSTRAINT deal_products_billing_type_check CHECK (billing_type IN ('direct', 'indirect'));
    END IF;
END $$;

-- Force schema cache reload just in case
NOTIFY pgrst, 'reload schema';
