-- Add parent_id to deal_products for product grouping/linking
ALTER TABLE public.deal_products 
ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.deal_products(id) ON DELETE SET NULL;

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_deal_products_parent_id ON public.deal_products(parent_id);
