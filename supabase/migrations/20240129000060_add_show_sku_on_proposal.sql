-- Adiciona a coluna show_sku_on_proposal na tabela deal_products
ALTER TABLE public.deal_products 
ADD COLUMN IF NOT EXISTS show_sku_on_proposal BOOLEAN DEFAULT TRUE;

-- Comentário para documentação
COMMENT ON COLUMN public.deal_products.show_sku_on_proposal IS 'Controla se o SKU/Partnumber deste produto deve ser exibido no PDF da proposta.';
