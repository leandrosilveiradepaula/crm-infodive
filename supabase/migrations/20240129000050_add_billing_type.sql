-- Add billing_type column to deal_products table
ALTER TABLE deal_products 
ADD COLUMN IF NOT EXISTS billing_type text DEFAULT 'direct';

-- Add check constraint for valid values (idempotent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'deal_products_billing_type_check'
    ) THEN
        ALTER TABLE deal_products
        ADD CONSTRAINT deal_products_billing_type_check
        CHECK (billing_type IN ('direct', 'indirect'));
    END IF;
END $$;

-- Update existing records to default 'direct'
UPDATE deal_products SET billing_type = 'direct' WHERE billing_type IS NULL;
