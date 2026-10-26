# CURRENT_TASK — CRM P0: banco, tenant e identidade confiável

**Origem:** decisão explícita do proprietário em 26/10/2026 de interromper temporariamente a certificação da AI Product Factory para resolver os riscos do banco de produção do CRM Infodive, depois retornar à Factory.

**Base:** CRM `main=e521308e14380121670b22f1aa3078d14e1883d7`. Antes de concluir ou fazer merge, verificar novamente GitHub, Supabase, CI e Vercel. A branch/PR não confere autorização para aplicar migration em produção.

## Critério de conclusão do trabalho

1. Preparar uma migration atômica, fail-closed e sem alteração de dados: ativar RLS onde faltava, remover privilégios anônimos diretos e políticas `user_metadata`, impor limite de organização sobre todas as tabelas com `organization_id`, proteger `profiles` (incluindo org/status/role), proteger filhos sem org através do pai quando seguro e revogar acesso direto onde não há relação de tenant comprovada.
2. Substituir `public.get_jwt_org_id` e triggers inseguros por identidade da tabela `profiles` ativa, obtida por função pequena e privada. Não aceitar `organization_id` fornecido pelo navegador, cookies antigos ou `user_metadata`.
3. Corrigir login e contexto de sessão server-side. Usuário sem organização ou desativado falha fechado; não executar backfill nem inventar organização padrão.
4. Testar no PostgreSQL 16 descartável com identidade e dados **sintéticos**: anon sem acesso, tenant A não vê/muta tenant B mesmo mudando `user_metadata`, perfil inativo negado, tentativa de alterar cargo/org negada, conta server-role mantém acesso técnico. Testes de autenticação e CI TypeScript/build.
5. Preparar runbook de migração, conciliação de histórico, backup/restauração, janela de produção, verificações após aplicação e riscos residuais. Revalidar Supabase advisors após ativação.

## Escopo autorizado de código e PR (não de produção)

- `supabase/migrations/20261026204500_crm_authoritative_tenant_rls.sql`
- `src/lib/auth-server.ts`
- `src/app/login/actions.ts`
- `test/auth-tenant-boundary.test.ts`
- `scripts/verify_crm_tenant_hardening_pg.py`
- `.github/workflows/crm-tenant-security-postgres.yml`
- `docs/CRM_SECURITY_HARDENING_20261026.md`
- este documento

Permitir somente mudanças diretamente necessárias nesses caminhos e testes que revelem defeitos na mesma correção. Não alterar CRM negócio, Service Desk, Factory, credenciais, Vercel, n8n ou projetos Supabase por rotina. Não repetir benchmark do Agente SQL nem adicionar custo.

## Gates inegociáveis

- **CRM Supabase `mpmhmjepmmpxbsmekldf` é PRODUÇÃO.** Sem migration, alteração de grants/policies ou dados no banco durante a implementação. Exigir autorização humana específica após backup restaurável, conciliação das migrations, CI verde e plano de implantação.
- `main` publica produção: **merge exclusivamente humano**.
- O CRM possui ao menos um perfil ativo sem organização atribuída. A correção não atribui automaticamente essa identidade; o efeito de bloqueio deve ser informado ao operador antes do gate.
- O repositório tem migrations de código ainda não registradas no histórico do banco. **Não aplicar o backlog inteiro** em lote; reconciliar antes de qualquer DDL.
- Auth/RBAC em Server Actions administrativas (issue #22) continua uma frente de segurança separada; RLS e `requireSessionContext` não provam autorização completa de todos os endpoints.

## Verificações exigidas

- `CRM validation`: TypeScript, `npm test`, `npm run build`, `git diff --check`.
- `CRM tenant isolation PostgreSQL 16`: migration real e casos negativos sem banco externo.
- Revisão de diff e riscos; qualquer comportamento que dependa de Preview autenticado só pode receber PASS com prova real.
- Sem merge automático, nenhuma migração aplicada em produção, nenhum crédito pago/modelo por curiosidade.

Após a regularização do banco e hardening de servidor necessários, retornar à certificação da Factory, cujo contrato permanente está em `ai-product-factory/docs/FINALIZATION_EXECUTION_CONTRACT.md`.
