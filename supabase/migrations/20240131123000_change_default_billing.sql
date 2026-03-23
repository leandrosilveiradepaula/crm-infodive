-- Change default billing_type to 'indirect'
ALTER TABLE public.deal_products ALTER COLUMN billing_type SET DEFAULT 'indirect';

-- Update existing records that might be null (though previous migration handled this, just to be safe)
UPDATE deal_products SET billing_type = 'indirect' WHERE billing_type IS NULL;
