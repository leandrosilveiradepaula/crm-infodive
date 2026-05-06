-- Add present_in_usd column to deal_products
ALTER TABLE public.deal_products 
ADD COLUMN IF NOT EXISTS present_in_usd BOOLEAN DEFAULT false;
