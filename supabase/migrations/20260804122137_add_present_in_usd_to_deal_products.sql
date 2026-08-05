ALTER TABLE public.deal_products
ADD COLUMN IF NOT EXISTS present_in_usd BOOLEAN;

UPDATE public.deal_products
SET present_in_usd = false
WHERE present_in_usd IS NULL;

ALTER TABLE public.deal_products
ALTER COLUMN present_in_usd SET DEFAULT false;

ALTER TABLE public.deal_products
ALTER COLUMN present_in_usd SET NOT NULL;
