-- Add custom_label to deal_products for scenario identification
ALTER TABLE public.deal_products 
ADD COLUMN IF NOT EXISTS custom_label text;
