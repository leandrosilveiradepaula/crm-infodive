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

1. **Automatizado:** o script `test/e2e/provision-qa-auth.mjs`, executado somente no job GitHub protegido `crm-ui-qa`, cria/confirma quatro usuários via `auth.admin.createUser`, atribui perfis e tenants fictícios, e gera senhas aleatórias novas para cada execução. Guarda as credenciais somente em arquivo privado e efêmero no runner, que é consumido pelo E2E; não imprime senhas ou usuários. O script também recusa outro Supabase, contas inesperadas e perfis de outro tenant. Não é necessário cadastrar usuários manualmente.
2. **Alternativa não executada:** `docs/ui/QA_BIND_SYNTHETIC_USERS.sql` permanece como referência de ligação de usuários existentes, mas **não deve ser executado após o bootstrap automático**, pois o provisionador já grava os perfis. Evitar dois métodos concorrentes.
3. No **Supabase QA → Settings/API Keys**, obter uma chave **secret** de QA (`sb_secret_...`; ou legada `service_role`, nunca `anon`); cadastrar no **projeto Vercel QA**, como variável **server-only encrypted** `SUPABASE_SERVICE_ROLE_KEY` para Preview/Development. **Nunca usar a chave do CRM original** e não prefixar com `NEXT_PUBLIC_`.
4. Criar **GitHub environment protegido** `crm-ui-qa` (required reviewers, branch B4 restrita). Cadastrar **somente** `CRM_B4_SUPABASE_SERVICE_ROLE_KEY` (chave QA exclusivamente) e `CRM_B4_VERCEL_TOKEN` como secrets nesse environment; `CRM_B4_ACCOUNTS_JSON` deixou de ser necessário porque o provisionador produz um arquivo efêmero. Configurar variáveis `CRM_B4_VERCEL_TEAM_ID`, `CRM_B4_VERCEL_PROJECT_ID`, `CRM_B4_PREVIEW_URL`, `CRM_B4_DEPLOYMENT_ID`, `CRM_B4_BACKEND_ISOLATED=true` **somente depois da atestação de isolamento**.
5. Publicar via Vercel QA **somente** o SHA aprovado da branch `ux-ui/crm214-b4-integrated-qa`, com alvo Preview; comparar SHA, branch, URL e deployment ID na API Vercel. A chave `SESSION_SECRET` já está provisionada no QA.
6. **Somente então** ativar `CRM_B4_QA_ENABLED=true` na variável de repositório do GitHub e reexecutar o gate protegido. A workflow `.github/workflows/crm-b4-authenticated.yml` deve gerar o artefato sanitizado `results.json` com PASS no mesmo SHA; nunca contar `SKIPPED`/BLOCKED como sucesso.

**Limitação de escopo:** UI QA read-only valida apresentação, rotas e estado por perfil, não equivalência integral de todas as regras comerciais/migrations. Nenhum merge, migração produtiva ou deploy de produção foi autorizado ou executado. PR #213 da Factory continua separada.

**Não habilitar o Preview nem o E2E até configurar a chave server-only do QA no Vercel QA e no environment GitHub protegido.** Após esse gate, a própria workflow cria usuários/perfis fictícios antes do E2E; não existe necessidade de criar contas manualmente.


## 18/11/2026 — implantação controlada e teste automatizado com aprovação humana

- O primeiro deployment no Vercel QA foi retornado com `target=production` **apesar da intenção de Preview**; foi cancelado imediatamente em `INITIALIZING` (ID `dpl_3NEof5soAGF9UhNG3btT4uUsVCUs`) e permanece `CANCELED`. Nenhum ambiente produtivo do CRM original foi alterado.
- Repetido com `target=staging` explícito para o projeto QA. Deployment `dpl_BgCikCd93XYi6HPaK6Lok8ENanxu` concluído **READY** no SHA `c67bf48bd2f012e3386d73b1b3352c1804533979`, com branch B4. Esse SHA poderá ficar desatualizado após alterações de automação; sempre redeploy Staging no HEAD final antes do E2E.
- O projeto QA mantém `ssoProtection` ativado. A workflow protegida usa autorização temporária Vercel **limitada ao hostname do deployment**, não sessão artificial do CRM. O operador só precisa aprovar o workflow no environment `crm-ui-qa`; descoberta de deployment e rotação/revogação do bypass são automáticas. A etapa `always()` revoga o bypass, mas cancelamento abrupto requer revisão manual no painel de Vercel.
- Não é mais necessário cadastrar variáveis de URL/ID do Preview nem o toggle `CRM_B4_QA_ENABLED`; **não** habilitar deploy produtivo, nem tocar no projeto original.
