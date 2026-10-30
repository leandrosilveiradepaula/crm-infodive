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
- `scripts/verify_crm_service_desk_pg.py` e `.github/workflows/crm-service-desk-postgres.yml` (PG16 isolado).
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

---

## Tarefa autorizada — CRM issue #22 (29/10/2026; continuação OWNER)

**Esta seção é a autorização ativa somente para a branch
`preview/crm22-rbac-security-evidence` e a PR #202.** O Start real do OWNER
na [issue operacional da Factory #1055](https://github.com/leandrosilveiradepaula/ai-product-factory/issues/1055),
comentário 6487569648, e o gate humano de escopo aprovado autorizam
concluir a [issue CRM #22](https://github.com/leandrosilveiradepaula/crm-infodive/issues/22).
O escopo Service Desk CRM #200 acima continua histórico e válido para
sua própria linhagem; **não** integra este candidato #22.

A lacuna concreta identificada era consulta global com `service_role`
em `src/app/api/email/sync/route.ts` aos remetentes existentes e às
blacklists, sem filtro por organização. A PR #202 modifica somente os
caminhos necessários ao isolamento da consulta, com denegação em caso de
erro de banco, testes negativos e documentação de escopo:

- `src/app/api/email/sync/route.ts` — chamada do helper com tenant
  proveniente de `requireSessionContext`, sem alterar autenticação;
- `src/lib/email-sync-tenant.ts` — filtro por organização, incluindo
  o vínculo `account_contacts.account_id → accounts.organization_id`;
- `test/email-sync-tenant-rbac.test.ts` — testes negativos de tenant,
  falhas de leitura e respostas inválidas;
- `docs/CRM22_EMAIL_SYNC_TENANCY.md` — causa, escopo e limitações;
- `docs/codex/CURRENT_TASK.md` — reconciliação do escopo autorizado.

Os checks de permissão, auditoria e perfis já presentes na main continuam
sob o contrato RBAC #22 acima; não reimplementá-los sem falha demonstrada.
Não alterar papéis, privilégios, RLS, banco, migrations, credenciais,
integradores externos nem Service Desk. Não executar chamadas pagas de
modelo nem benchmarks. Não alegar que a PR criada por executor externo
foi produzida por Work Units da Factory: a prova ponta a ponta deve
ter sua **própria** linhagem verificável, sem backfill artificial.

**Critérios:** TypeScript, Vitest, build e CI no HEAD exato, Preview
Vercel + browser verificado no mesmo SHA e revisão de autorização;
proteger `main` com merge exclusivamente humano, após gate legítimo.

---

## Tarefa autorizada — CRM issue #22 (29/10/2026; nova linhagem após PR #202)

**Fonte de autorização e não implementação.** Origem canônica da autorização:
https://github.com/leandrosilveiradepaula/crm-infodive/issues/22.
Este trecho documenta um defeito existente **observado no código da main**
f9b953e9c22ca112cb508c9ca89ddba4e5849cf7. A PR de bootstrap em DRAFT modifica somente este documento,
não é Work Unit nem entrega de produto. Não fazer merge desta PR de fonte
em produção como se concluísse o defeito.

**Falha comprovada e ainda não implementada:**
`updateUserAction` usa `.update(...).eq('id', updateId).eq('organization_id', organizationId)`
e retorna `{ success: true }` sempre que o Supabase não retornar erro. Mas uma atualização
que afeta zero registros (usuário inexistente ou de outra organização)
não representa erro. `archiveUserAction` também responde sucesso quando o perfil
alvo não existe no tenant; a transferência opcional de negócios é iniciada
antes de se comprovar que o perfil-alvo pertence à organização. O registro
de auditoria atual indica `authorized_attempt`, não mutação concluída.

**Escopo gravável estrito para a próxima implementação pela Factory:**
- `src/app/(dashboard)/settings/users-actions.ts`
- `test/server-admin-actions-rbac.test.ts`

**Critérios de aceite exigidos para a Work Unit real:**
- Atualizações/arquivamentos contra ID ausente ou de outro tenant são negados
  com resultado de falha, sem declarar sucesso e sem transferir deals;
- A ação valida existência/tenant antes de qualquer transferência; a
  própria alteração confirma exatamente o registro pretendido;
- As operações legítimas existentes continuam funcionando, com autorização
  server-side e perfis preservados, sem novas permissões;
- Vitest inclui testes negativos de chamada direta para ID ausente, outro
  tenant e erro de banco, mais regressão de operação legítima;
- Auditoria não declara sucesso transacional sem recibo atômico real;
  manter `authorized_attempt` com seu significado atual;
- CI nativa, revisão de segurança, Preview no SHA exato e gate humano de
  produção são necessários para o candidato implementado pela Factory.

**Proibições:** sem alterações no Supabase, migrations, RLS, políticas de
acesso, tokens, dados reais, Service Desk, outros módulos ou chamadas pagas
a modelo sem aprovação. Não reabrir Change Sets antigos, não reproduzir
planos vazios pagos e não atribuir uma implementação externa à Factory.
O próximo Start deve ser novo, registrado pelo canal OWNER, com linhagem
própria e sempre parar em `awaiting_release` antes de merge humano.
