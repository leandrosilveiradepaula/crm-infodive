# CURRENT_TASK — CRM #200: Service Desk como módulo do CRM (27/10/2026)

**Decisão atual do operador substitui a tarefa anterior para esta branch.**
A issue CRM #200 e Service Desk #12 autorizam preparar a integração
aditiva do módulo Service Desk ao CRM, sem modificar produção. A tarefa
anterior de RBAC #22 continua válida em seu escopo já entregue e não deve
ser revertida ou duplicada.

## Escopo autorizado para esta branch

- `supabase/migrations/20261027123000_service_desk_crm_module.sql` (arquivo,
  **não aplicar ao Supabase gerenciado**).
- `src/app/(dashboard)/service-desk/**` (página incorporada e ações).
- `src/components/layout/Sidebar.tsx` (somente entrada do módulo).
- `test/service-desk-crm-module.test.ts` (negação de acesso e contexto).
- `docs/SERVICE_DESK_CRM_INTEGRATION.md` (contratos/rollback).
- Este arquivo de tarefa.

**Proibido**: promover migration CRM, enviar service_role ao navegador,
copiar tenants demo, criar novo Supabase, cortar Vercel, auto-merge, usar
WIF/modelos pagos ou reativar a PR Service Desk #10 sem recibo válido.
Produção e migration requerem gates humanos separados.

## Critérios para PR

- Reusar `profiles`, `accounts`, `service_contracts`, CRM Auth e
  `crm_internal.current_organization_id()`, sem duplicar esses cadastros.
- Testar autoridade server-side e isolamento no banco; CI real do HEAD,
  TypeScript, Vitest, build e Preview obrigatório por UI.
- PR contra `main` para revisão humana. Nada se considera integrado ou
  certificado até migration aprovada, Preview real e E2E completo.

---

# CURRENT_TASK — CRM P0: RBAC real no servidor (issue #22)

**Decisão atual, 26/10/2026:** PR #198 foi mergeada humanamente na `main=adaea55f88eaa80d12a8b19596189398a3364837`; migration `crm_authoritative_tenant_rls` já aplicada e auditada no Supabase CRM. O proprietário pediu concluir o parêntese de segurança do CRM para então retornar à certificação da AI Product Factory. Esta tarefa atende **somente** o bloqueio P0 de RBAC em Server Actions e APIs, vinculado à [issue #22](https://github.com/leandrosilveiradepaula/crm-infodive/issues/22).

## Objetivo e critérios de aceite

1. Fonte única de papéis/permissões para UI e servidor, mantendo o comportamento visual existente. Os papéis persistidos em `public.profiles.role` são a autoridade; não aceitar role, organização, claims `user_metadata` ou cabeçalho enviado pelo cliente.
2. Verificar sessão, status `active`, tenant no banco e permissão imediatamente antes do uso de `service_role` para mudar usuários/papéis/status, transferir deals, convidar usuários, configurar organização/pipeline, gerenciar integrações, API keys e webhooks. Negar por padrão papel desconhecido, perfil revogado, tenant divergente e erros do banco.
3. Tratar entradas duplicadas (por exemplo, `settings/actions.ts` e `settings/users-actions.ts`, `integrations/actions.ts` e as ações dedicadas de API keys/webhooks). Testar chamadas **diretas** às Server Actions, sem depender do PermissionGate da UI.
4. Prevenir falsificação de trilha de auditoria por Server Action genérica; eventos administrativos devem ter ator e tenant derivados do servidor, com dados não sensíveis. Se não houver garantia transacional entre audit log e mudança de dados, declarar explicitamente a limitação — não declarar auditoria integral concluída.
5. `/api/auth/me` deve negar sessão revogada/sem organização de modo consistente com `requireSessionContext`. Não retornar `isLoggedIn=true` a quem não possui perfil autorizado.
6. Vitest negativos, TypeScript, build e checks no SHA exato; entregar **uma PR** pronta para merge humano, sem auto-merge.

## Escopo autorizado para a branch/PR atual

- `docs/codex/CURRENT_TASK.md` e documentação de segurança deste escopo;
- `src/lib/permission-matrix.ts`, `src/lib/server-authorization.ts`, `src/lib/admin-audit.ts`;
- `src/types/auth.ts`, `src/hooks/usePermissions.ts`;
- `src/app/(dashboard)/settings/{actions,users-actions,audit-actions}.ts`;
- `src/app/(dashboard)/integrations/{actions,apikey-actions,webhook-actions}.ts`;
- `src/app/api/auth/me/route.ts`;
- `src/app/(dashboard)/settings/price-lists-actions.ts`;
- `src/services/{UserService,SettingsService}.ts` (tenant validation before service-role updates);
- testes Vitest sob `test/*-rbac*.test.ts` ou extensões focadas dos testes de auth;
- qualquer outra ação administrativa somente se a prova descobrir bypass direto, registrando sua relevância ao gate #22.

**Fora do escopo:** mais migrações, backfill de tenant, schema de Salesforce/Service Desk, alterações de quotas, mudanças de preços, n8n, modelos pagos, GitHub da Factory e PR #56 de release separado. Não repetir as 17 migrations históricas.

## Gates

CRM `main` publica produção e **somente humano pode fazer merge**. Não alterar Supabase, RLS, grants, Auth, usuários, chaves ou Vercel diretamente. Testes usam mocks/sintéticos. No post-merge da PR #198, verificação Vercel READY / navegador de login real ainda é necessária antes de certificar operação. A emissão de CI verde não é autorização de produção.

Após resolver este P0 e registrar evidências, retornar a `ai-product-factory/docs/FINALIZATION_EXECUTION_CONTRACT.md`.
