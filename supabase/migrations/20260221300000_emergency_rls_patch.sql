-- CRITICAL SECURITY PATCH V4: ROOT GRANT REVOKE
-- RLS não está funcionando por causa de permissões globais superiores dadas acidentalmente à Role Anon
-- no nível de Grants padrão do Supabase. Este script corta o mal pela raiz.

-- 1. Remove qualquer permissão global de leitura da Chave Anônima para os dados sensíveis
REVOKE ALL PRIVILEGES ON TABLE public.accounts FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.deals FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.deal_products FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.deal_activities FROM anon;
REVOKE ALL PRIVILEGES ON TABLE public.products FROM anon;

-- 2. Assegura que a Chave de Autenticados mantém acesso base (para o RLS agir dentro dele)
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.deals TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.deal_products TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.deal_activities TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.products TO authenticated;

-- 3. Caso use Service Role internamente nos actions (como trigger ou bypass system)
GRANT ALL PRIVILEGES ON TABLE public.accounts TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.deals TO service_role;

-- 4. Reafirma que todas tabelas devem obrigatoriamente forçar Row Level Security (NUNCA ignorar)
ALTER TABLE public.accounts FORCE ROW LEVEL SECURITY;
ALTER TABLE public.deals FORCE ROW LEVEL SECURITY;
