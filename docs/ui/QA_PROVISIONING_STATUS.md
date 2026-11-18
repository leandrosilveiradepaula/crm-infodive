# CRM #214 B4 — ambiente QA segregado e gate autenticado

## Recursos criados (18/11/2026)

**Supabase de testes, sem dados reais:** `crm-infodive-qa`, ref `lwpjiufsetnpjuoyline`, organização `iymxlfzzhofeunezizgu`, região `sa-east-1`, `ACTIVE_HEALTHY`. A cotação da plataforma para o novo projeto foi `US$ 0/mês`.

**Vercel de testes, sem deploy:** projeto `crm-infodive-qa` (`prj_DhLwVxE59HpWzp2YPrWw4sZpKGXc`) na equipe `team_Zkee7KNuBllZCEI327veFF3d`. Não foi associado a Git nem foi criado Preview ou deploy produtivo. Apenas as chaves **do próprio Supabase QA** foram gravadas como variáveis encrypted para Preview/Development: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Também foi configurado `SESSION_SECRET` exclusivo de QA, gerado criptograficamente. Nenhum valor secreto está neste documento.

## Esquema instalado no banco QA — não é dump nem cópia de produção

- `docs/ui/QA_SUPABASE_IDENTITY_BASELINE.sql`: perfis server-owned, Auth FK, RLS de leitura do próprio perfil, tenant privado.
- `docs/ui/QA_SUPABASE_COMMERCIAL_SCHEMA.sql`: base sintética para módulos comerciais e de gestão, derivada de serviços/tipos e migrations de código. Não representa equivalência integral com o esquema produtivo.
- Migrations do repositório `20261027123000_service_desk_crm_module.sql` e `20261027145000_service_desk_private_attachments.sql` aplicadas **somente no QA**; Storage privado ainda sem bucket/documentos de teste.
- `docs/ui/QA_GOALS_COMPATIBILITY.sql`: campos de cenários e campanhas consultados pelo app.
- `docs/ui/QA_SYNTHETIC_FIXTURES.sql`: registros exclusivamente fictícios em dois tenants separados (um de demonstração e um de controle de isolamento). Executado sem copiar backups, tenants, contatos ou credenciais reais.

**Auditoria SQL verificada:** 37 tabelas em `public` e 15 em `service_desk`; **zero tabelas sem RLS**, zero tabelas públicas legíveis por `anon`; zero RPCs Service Desk executáveis por `anon` ou `authenticated`; **zero usuários Auth e zero perfis ainda**. Advisors: um aviso INFO `rls_enabled_no_policy`, esperado nos objetos restritos a `service_role` pelo modelo deny-by-default.

## Gate externo de acesso — único ponto que ainda requer operador

1. Na área **Supabase QA → Authentication → Users**, criar e confirmar (Admin/Auto Confirm) quatro identidades de teste com senhas fortes **guardadas fora do chat**: `qa-admin@example.invalid`, `qa-manager@example.invalid`, `qa-sales@example.invalid`, `qa-isolation@example.invalid`. Não criar usuários em produção.
2. Quando as quatro existirem, executar **somente no Supabase QA** o script `docs/ui/QA_BIND_SYNTHETIC_USERS.sql`. Ele exige todas confirmadas e inexistência de perfis prévios, atribui roles `admin`, `manager`, `vendedor` (roles array `sales`) e separa o quarto usuário no tenant de controle. Não contém senhas e não é uma migration produtiva.
3. No **Supabase QA → Settings/API Keys**, obter uma chave **secret** de QA (`sb_secret_...`; ou legada `service_role`, nunca `anon`); cadastrar no **projeto Vercel QA**, como variável **server-only encrypted** `SUPABASE_SERVICE_ROLE_KEY` para Preview/Development. **Nunca usar a chave do CRM original** e não prefixar com `NEXT_PUBLIC_`.
4. Criar **GitHub environment protegido** `crm-ui-qa` (required reviewers, branch B4 restrita). Cadastrar `CRM_B4_ACCOUNTS_JSON` e `CRM_B4_VERCEL_TOKEN` como secrets nesse environment. Configurar variáveis `CRM_B4_VERCEL_TEAM_ID`, `CRM_B4_VERCEL_PROJECT_ID`, `CRM_B4_PREVIEW_URL`, `CRM_B4_DEPLOYMENT_ID`, `CRM_B4_BACKEND_ISOLATED=true` **somente depois da atestação de isolamento**.
5. Publicar via Vercel QA **somente** o SHA aprovado da branch `ux-ui/crm214-b4-integrated-qa`, com alvo Preview; comparar SHA, branch, URL e deployment ID na API Vercel. A chave `SESSION_SECRET` já está provisionada no QA.
6. **Somente então** ativar `CRM_B4_QA_ENABLED=true` na variável de repositório do GitHub e reexecutar o gate protegido. A workflow `.github/workflows/crm-b4-authenticated.yml` deve gerar o artefato sanitizado `results.json` com PASS no mesmo SHA; nunca contar `SKIPPED`/BLOCKED como sucesso.

**Limitação de escopo:** UI QA read-only valida apresentação, rotas e estado por perfil, não equivalência integral de todas as regras comerciais/migrations. Nenhum merge, migração produtiva ou deploy de produção foi autorizado ou executado. PR #213 da Factory continua separada.

**Não habilitar o Preview nem o E2E até completar o gate de chave server-only e usuários falsos.** A infraestrutura existente não armazena credenciais de Auth fictícias.
