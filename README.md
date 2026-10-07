# CRM Infodive

CRM comercial da Infodive construído em Next.js, React e Supabase, com suporte a pipeline de oportunidades, empresas, contatos, propostas, pedidos, atividades, automações, integrações e recursos opcionais de IA.

> Este repositório contém o produto em evolução. CI verde ou um PR mergeado não significam, por si só, que o produto inteiro está pronto para produção.

## Stack

- Next.js 16 / React 19
- TypeScript
- Supabase / PostgreSQL
- Iron Session
- Tailwind CSS
- Vitest
- Vercel
- Microsoft Graph para recursos de e-mail
- Gemini para recursos de IA configurados no ambiente

## Requisitos locais

- Node.js 22
- npm
- projeto Supabase compatível com o schema/migrations do repositório

Instalação:

```bash
npm ci
npm run dev
```

Validação local principal:

```bash
npx tsc --noEmit
npm test
npm run build
```

O workflow do GitHub adiciona outros gates de qualidade conforme evoluem no repositório.

## Variáveis de ambiente

Variáveis obrigatórias para autenticação e backend:

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SESSION_SECRET=
```

`SESSION_SECRET` deve ter pelo menos 32 caracteres.

Integrações opcionais:

```text
AZURE_CLIENT_ID=
AZURE_CLIENT_SECRET=
GEMINI_API_KEY=
```

Não versionar segredos, tokens, cookies, service role keys ou credenciais de provedores.

## Segurança e multi-tenant

O backend usa clientes privilegiados do Supabase em rotas/server actions específicas. Quando esse cliente é usado, o isolamento de tenant precisa ser aplicado explicitamente no servidor.

Princípios obrigatórios:

- nunca confiar em `user_metadata` editável pelo usuário como fronteira de autorização;
- resolver `organization_id` a partir de contexto autenticado/revalidado;
- aplicar RBAC server-side em operações administrativas;
- manter RLS fail-closed;
- não adicionar políticas públicas permissivas para “corrigir” falhas de acesso;
- não expor `SUPABASE_SERVICE_ROLE_KEY` ou tokens de integração ao browser.

## Sessão

A aplicação usa Iron Session com cookie HTTP-only. Em produção, o cookie é marcado como `secure`.

A sessão identifica o usuário, mas fronteiras sensíveis devem revalidar o contexto no servidor; presença de sessão não substitui autorização.

## Supabase migrations

Migrations ficam em:

```text
supabase/migrations/
```

Aplicar migration em banco real é uma ação separada do merge de código. Mudanças destrutivas, ampliação de acesso ou produção exigem gate humano.

Não editar migrations históricas já aplicadas para “corrigir” produção; adicionar migration corretiva nova.

## Integração de e-mail

Recursos de Microsoft 365 usam Microsoft Graph e dependem das variáveis Azure configuradas no ambiente. Tokens de provedor ficam em cookies HTTP-only e não devem ser registrados em logs.

## Recursos de IA

Recursos Gemini são server-side e opcionais. Quando `GEMINI_API_KEY` não está configurada, a aplicação deve falhar explicitamente em vez de fabricar resposta ou simular sucesso.

Testes e CI não devem fazer chamadas pagas de modelo só para provar conectividade.

## CI e qualidade

A validação do CRM inclui, conforme configurado no workflow atual:

- TypeScript;
- lint incremental para linhas alteradas;
- regressão de vulnerabilidades de dependências;
- testes;
- build;
- `git diff --check`;
- gates adicionais de migrations, superfície de produto e evidência operacional quando presentes no branch.

Dívida herdada pode existir mesmo quando o CI está verde. O critério de produto pronto exige auditoria global de segurança, operação, UX, testes e documentação.

## Release

`main` deve ser tratado como fronteira de produção quando ligado ao deployment do produto.

Antes de release:

1. consolidar o SHA candidato;
2. executar todos os quality gates aplicáveis;
3. validar Preview quando aplicável;
4. revisar migrations separadamente;
5. obter gate humano para merge/release de produção.

Não há auto-merge de produção no runtime.

## Operação

Quando o branch incluir o hardening operacional correspondente, o CRM expõe `GET /api/health` para readiness básica e correlation id por requisição. Consulte `docs/OPERATIONS.md` quando esse documento estiver presente no branch/release candidato.

## Estado do produto

O estado completo não deve ser inferido por quantidade de PRs, CI verde ou ausência de issues. A readiness global é avaliada separadamente e deve considerar, no mínimo:

- segurança;
- isolamento multi-tenant;
- observabilidade/operação;
- estratégia de testes;
- experiência de produto;
- documentação;
- completude funcional.
