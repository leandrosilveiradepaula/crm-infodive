-- 1. Adicionar colunas de duração (Correção da tarefa anterior)
ALTER TABLE public.deal_products
ADD COLUMN IF NOT EXISTS duration NUMERIC,
ADD COLUMN IF NOT EXISTS duration_unit TEXT;

-- 2. Adicionar opção de visibilidade do SKU no Cadastro de Produtos
ALTER TABLE public.products
ADD COLUMN IF NOT EXISTS show_sku_on_proposal BOOLEAN DEFAULT TRUE;

-- 3. Adicionar opção de visibilidade do SKU nos Produtos da Oportunidade
ALTER TABLE public.deal_products
ADD COLUMN IF NOT EXISTS show_sku_on_proposal BOOLEAN DEFAULT TRUE;
