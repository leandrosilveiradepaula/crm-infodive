-- 1. Create deal_quotes table
CREATE TABLE IF NOT EXISTS public.deal_quotes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL,
    deal_id UUID NOT NULL REFERENCES public.deals(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. RLS Policies for deal_quotes
ALTER TABLE public.deal_quotes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tenant Isolation" ON public.deal_quotes FOR ALL USING (organization_id = (auth.jwt() -> 'user_metadata' ->> 'organization_id')::uuid);

-- 3. Add quote_id to deal_products
ALTER TABLE public.deal_products 
ADD COLUMN IF NOT EXISTS quote_id UUID REFERENCES public.deal_quotes(id) ON DELETE CASCADE;

-- 4. Initial Data Migration (Backfill)
DO $$
DECLARE
    deal_record RECORD;
    new_quote_id UUID;
BEGIN
    FOR deal_record IN SELECT id, organization_id FROM public.deals LOOP
        -- For each deal, create a primary quote
        INSERT INTO public.deal_quotes (deal_id, organization_id, title, is_primary)
        VALUES (deal_record.id, deal_record.organization_id, 'Cotação Padrão', true)
        RETURNING id INTO new_quote_id;

        -- Update all products of this deal to belong to this new quote (that don't already have one)
        UPDATE public.deal_products
        SET quote_id = new_quote_id
        WHERE deal_id = deal_record.id AND quote_id IS NULL;
    END LOOP;
END $$;
