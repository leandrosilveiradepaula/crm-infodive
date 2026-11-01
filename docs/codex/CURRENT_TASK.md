# CURRENT_TASK — CRM #209: escopo vigente para a nova Jornada V2

**Autorização específica do OWNER, em 01/11/2026:** [CRM issue #209](https://github.com/leandrosilveiradepaula/crm-infodive/issues/209), [Factory issue operacional #1055](https://github.com/leandrosilveiradepaula/ai-product-factory/issues/1055). Esta seção é a autoridade **somente** para uma nova Jornada V2 legítima de CRM #209 admitida depois da incorporação humana deste arquivo na `main`, com `source_commit` imutável que contenha esta seção. Não retroage para journeys anteriores, não reabre Change Sets bloqueados e não atribui código humano à Factory.

## Objetivo e decisão de escopo

Resolver a falha **atual e reproduzível** da `main`: `ContractService.getContracts(organizationId)` usa `createAdminClient()` e somente `organization_id` para listar contratos. `service_role` contorna RLS; um vendedor não pode receber contratos fora de sua titularidade. O antigo filtro gigante `.in('deal_id', visibleIds)` da issue #171 **não existe** no source atual: é proibido implementá-lo ou alegar que foi corrigido nesta jornada. Inspecionar código, chamadas e relacionamentos exatos antes de alterar.

### Arquivos autorizados

- `src/services/ContractService.ts` — leitura paginada, filtros de tenant/proprietário e falha explícita.
- `src/app/(dashboard)/contracts/actions.ts` — sessão, perfil ativo, autoridade server-side e tratamento de erros.
- `src/types/contract.ts` — somente se estritamente necessário para tipos existentes, sem nova semântica.
- `test/*contract*.test.ts` ou `tests/*contract*.test.ts` — testes negativos e positivos focados, sem chamadas de rede.
- `docs/CRM209_CONTRACT_ACCESS.md` — decisão de arquitetura, riscos e evidências da tarefa.
- `docs/codex/CURRENT_TASK.md` — apenas atualização documental desta autorização, se necessária.

Não ampliar arquivos, dependências ou API sem demonstrar necessidade e autorização adicional. Inspecionar `profiles`, `deals`, `contracts`, contratos sem negócio e chamadores existentes. Os papéis existentes são a única autoridade; não aceitar tenant, perfil ou proprietário de argumentos do navegador. Não modificar sem decisão humana explícita a visibilidade de contratos legados sem `deal_id`, transferência concorrente de proprietário ou a matriz de papéis.

### Aceite e limites

- Isolamento por organização e proprietário com filtros aplicados no servidor, sem lista `IN` não limitada, sem leitura parcial silenciosa; paginação total estável por `created_at` e ID único.
- Testes de dois tenants, vendedor/admin/diretoria conforme permissões realmente existentes, mais de 1.000 vínculos, duplicatas, páginas subsequentes, falha no meio da paginação e denegação segura.
- Execução na própria branch exclusiva `factory/journey-<UUID>` da nova Journey V2, vinculada ao novo `source_commit` que contenha esta autorização; nunca reaproveitar PR humano #207, PR histórico #172, SHA de outra jornada ou branches já compartilhadas como produto autônomo.
- Autoriza commits de código somente dentro deste escopo, testes e abertura de PR **não draft quando todos os gates estarem completos**; a `main` publica produção e exige merge humano. Sem auto-merge nem migração, RLS, credenciais, novos serviços pagos, alterações de produção ou dados. Preview real e CI exata conforme política.
- Não usar modelos pagos só para testar, não comprar créditos e não executar o benchmark financeiro SQL. Falhas de prova permanecem bloqueio, sem inventar evidências.

**Este arquivo de governança atualizado é um pré-requisito de source, não uma entrega autônoma.** A Factory só poderá reivindicar autonomia com run/commit/CI/Preview independentes, posteriores ao novo Start válido.

---

# CURRENT_TASK — CRM #171: contratos escaláveis (Factory journey V2)

**Autorização específica para a branch de implementação da issue #171**, vinculada à jornada V2 da AI Product Factory. Este bloco não autoriza alterações no escopo de outras issues, não substitui as regras permanentes de `AGENTS.md` e não concede permissão para produção.

## Escopo e objetivo

Corrigir `ContractService.getContracts` para não enviar todos os IDs de negócios visíveis em um único filtro PostgREST `.in('deal_id', visibleIds)`. Preservar organização, proprietário, RLS, autorização server-side, paginação global e ordenação estável. Cobrir mais de 1.000 vínculos, IDs duplicados, falhas parciais e limites; sem truncar resultados.

## Arquivos permitidos exclusivamente para a issue #171

- `src/services/ContractService.ts`;
- `src/services/ContractService.test.ts` (se necessário, criar);
- testes diretamente relacionados em `test/**` ou `tests/**` (somente contratos e regressão de escopo);
- documentação específica da issue #171, se necessária.

**Proibido:** alterar papéis, políticas RLS, migrations, permissões, credenciais, produção, módulos RBAC #22 ou Service Desk #200; ampliar escopo sem decisão humana. Não utilizar modelos pagos para sondagem. Não criar bypass de autorização.

## Entrega

Uma PR contra `main` para revisão e merge exclusivamente humanos. CI e testes no SHA exato; Preview somente conforme a política real do projeto. A autorização desta seção só vale para a execução da issue #171; não é uma autorização genérica para modificar `ContractService` em outras jornadas.

---

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
