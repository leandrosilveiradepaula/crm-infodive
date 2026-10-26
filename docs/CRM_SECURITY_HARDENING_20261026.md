# CRM Infodive — plano de contenção e hardening da identidade (26/10/2026)

**Status: CANDIDATO EM PR. Não aplicado no Supabase de produção.**

**Escopo único:** corrigir autorização do banco do CRM para permitir a futura integração segura do Service Desk e retornar à certificação da AI Product Factory. Não ampliar o CRM com novas funcionalidades nesta etapa.

## 1. Evidências reais, sem consultar dados de clientes

- Supabase CRM `mpmhmjepmmpxbsmekldf`, projeto `main / PRODUCTION`, `ACTIVE_HEALTHY` no último preflight.
- `public`: 44 tabelas; **8 sem RLS**. Advisors Supabase confirmam políticas criadas em parte delas, mas desativadas. Há permissões anônimas diretas em tabelas com informações de negócio.
- **25 políticas de 21 tabelas** usam JWT `user_metadata` como origem do `organization_id` (editável pelo usuário). Outras permissivas (`USING true`, `auth.role()=authenticated`) permitem contornar isolamento se não houver limite obrigatório AND.
- `profiles` é a fonte de identidade do CRM, mas há pelo menos um perfil ativo sem organização. Há divergência entre ao menos um `auth.users.raw_user_meta_data` e `profiles`; não atribuir organização por palpite nem usar metadata para sanar divergência.
- Repositório `main`: 72 arquivos SQL de migrations; o Supabase registra 55 versões, com diferenças pós-`20260310142000`. Algumas tabelas/colunas mais novas já existem: isso exige **reconciliação, não execução em massa**.
- Supabase Free: o dashboard não lista backups automáticos para este projeto. **Não iniciar DDL sem cópia de segurança verificável, plano de restauração e autorização humana.**

## 2. Alterações contidas na PR

A migration `20261026204500_crm_authoritative_tenant_rls.sql` executa tudo em uma transação com `lock_timeout` e `statement_timeout`:

1. Helper privado `crm_internal.current_organization_id()`: `SECURITY DEFINER`, `search_path` vazio, escopo apenas `auth.uid()` + perfil `active` e organização válida. Sem endpoints que retornem informações de outros usuários.
2. Compatibilidade: `public.get_jwt_org_id()` e trigger `set_organization_id()` passam a usar essa fonte; escrita sem organização autorizada é negada; serviço privilegiado deve enviar organização explicitamente.
3. Remoção das políticas que dependem de `user_metadata` e substituição por políticas próprias de tenant; para **todas** as tabelas com coluna `organization_id uuid`, política `AS RESTRICTIVE` exige organização do perfil em toda operação. Políticas antigas `true` que fariam OR-bypass são removidas.
4. Todas as tabelas `public` com RLS habilitado ao final; `profiles` com acesso restrito ao próprio tenant, atualização autenticada apenas de campos de apresentação (sem alterar role/status/org); `proposal_versions` e `automation_logs` somente leitura através de pai pertencente ao tenant.
5. Revogação de acesso direto anônimo às tabelas e de acesso `authenticated` a dados privilegiados/sem relação segura de tenant.
6. RPCs `SECURITY DEFINER` historicamente executáveis por `anon`/`authenticated` são restringidas a chamadas `service_role` do BFF, salvo os helpers/triggers que precisam do `authenticated` ou do `supabase_auth_admin`. Novas funções definer não reconhecidas bloqueiam toda a transação. O `search_path` das rotinas privilegiadas fica fixado em `pg_catalog, public, extensions, pg_temp` (schema temporário por último), evitando resolução com caminho mutável e preservando funções criptográficas em `extensions`. A consulta real identificou 10 funções `SECURITY DEFINER` no schema `public`, incluindo operações públicas de proposta/assinatura: a proteção das tabelas não seria suficiente sem essa revogação. Rotas públicas de propostas continuam atendidas pelo BFF Next.js com token/cliente exclusivamente server-side. Não há backfill, limpeza, alteração de clientes nem inferência de organização.

A aplicação usa `service_role` no servidor e **não** altera o login Supabase Auth por senha. O login passa a consultar somente `profiles` ativa/organização; o contexto privilegiado é revalidado por request, sem confiar em organização antiga da Iron Session ou no cabeçalho de usuário desacompanhado de sessão.

## 3. Antes de aplicar: gates operacionais

1. Validar a PR e seus checks no **SHA final**: `CRM validation` (TypeScript/test/build) e `CRM tenant isolation PostgreSQL 16` (SQL real com permissões e multitenancy sintético), sem falsas aprovações.
2. Inventariar migrations aplicadas vs repositório. **Não executar as 17 faltantes automaticamente.** Avaliar os campos/policies atuais, inclusive backfills e triggers que podem já existir fora do histórico.
3. Fazer **backup completo e verificável** do PostgreSQL, Auth, objetos Storage e configurações importantes; comprovar restauração em ambiente isolado. Supabase Free não fornece PITR; confirmar estratégia antes da janela.

   Executar o procedimento de backup **na máquina do operador**, com credencial PostgreSQL válida armazenada apenas em variáveis/gerenciador de segredos locais; **nunca** copiar senha, DSN, dumps ou perfis para issue, PR, navegador ou chat. Referência oficial: https://supabase.com/docs/guides/platform/migrating-within-supabase/backup-restore . Exemplo orientativo para Supabase CLI recente (consultar \`supabase db dump --help\` da versão realmente instalada):

   \`\`\`bash
   # CRM_DATABASE_URL é uma DSN privada injetada localmente, sem eco em terminal.
   supabase db dump --db-url "$CRM_DATABASE_URL" -f crm_roles.sql --role-only
   supabase db dump --db-url "$CRM_DATABASE_URL" -f crm_schema.sql
   supabase db dump --db-url "$CRM_DATABASE_URL" -f crm_data.sql --data-only --use-copy
   \`\`\`

   **Não considerar backup concluído por arquivos existentes:** verificar integridade/restauração em PostgreSQL isolado, compatibilidade de versão, perfis/identidades/Auth e exportação independente de objetos Storage, e registrar apenas recibo não sensível (tamanho/sha256/data), nunca os arquivos. Plano Free não substitui backup do operador nem fornece PITR.

4. Informar ao proprietário que o perfil ativo sem `organization_id` será negado até correção administrativa autorizada. A migration não alterará esse registro.
5. Planejar janela curta de manutenção e autorização humana **separada** para aplicar SQL no **Supabase CRM**. `main` do GitHub dispara publicação de produção: merge humano apenas. A ordem preferida é proteção do banco na janela seguida da publicação do código de autenticação, sem deixar intervalos longos em versões incompatíveis.
6. Exigir Preview autenticado real da navegação que depende de sessão e smoke de rotas públicas em ambiente autorizado; CI/teste PG isolado não substitui validação de produção/Preview.

## 4. Depois da migration: verificação, não presunção

Consultar **somente** metadados e confirmar:
- 0 tabelas públicas com RLS desabilitado;
- 0 políticas que usam `user_metadata`;
- 0 permissões diretas de SELECT para `anon` nas tabelas públicas do CRM;
- política `crm_verified_tenant_boundary` para cada tabela com `organization_id uuid`;
- `crm_internal.current_organization_id` em schema não exposto, `SECURITY DEFINER` com `search_path` vazio e EXECUTE restrito;
- JWT adulterado de teste não habilita acesso cross-tenant **no PostgreSQL descartável**, sem testar dados reais;
- Supabase security advisor reexecutado e classificar todos os alertas remanescentes antes de declarar encerramento;
- smoke funcional, autorização admin/operador, expiração/revogação de sessão e tokens públicos em Preview legítimo.

**A implementação de RLS não equivale ao encerramento de toda a segurança do CRM.** A issue #22 de RBAC nas Server Actions privilegiadas continua aberta, mesmo após os testes PG/CI. Não liberar Salesforce/Service Desk com base apenas nesta migration.

**Não há rollback automático para policies abertas.** Se houver erro, a transação aborta integralmente. Uma falha funcional após aplicação exige plano de forward-fix seguro e gate humano; não reabrir acesso anônimo nem desabilitar RLS para "restaurar" funcionamento.

## 5. Limites e trabalho residual

- Não consultar/copiar linhas ou credenciais de clientes para testes.
- Não instalar o Service Desk Vite no CRM nem importar suas migrations de `tenant_id` para um schema incompatível.
- A correção de RLS/identidade **não implementa todo RBAC server-side** das Server Actions; acompanhar [CRM #22](https://github.com/leandrosilveiradepaula/crm-infodive/issues/22). Mesmo com Supabase advisor sem erro, ações que usam o cliente `service_role` precisam controle de permissão explícito.
- Retornar à Factory após fechar os gates de segurança do banco e registrar evidência na [Factory #713](https://github.com/leandrosilveiradepaula/ai-product-factory/issues/713).

**Sources:** evidências somente leitura de Supabase/pg_catalog e GitHub em 26/10/2026; [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security), [Supabase Securing Data API](https://supabase.com/docs/guides/api/securing-your-api), [CRM #21](https://github.com/leandrosilveiradepaula/crm-infodive/issues/21).
