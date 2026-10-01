# CURRENT_TASK.md

## Status
Active

## Objective
Corrigir o gap confirmado em 2026-10-01: `addDealProduct` nao deve inventar `exchange_rate=5.0` quando a taxa nao foi informada.

O usuario autorizou explicitamente a continuidade deste trabalho pela AI Product Factory.

## Allowed scope
- `docs/codex/CURRENT_TASK.md`
- `src/services/DealService.ts`
- `test/present-in-usd-core.test.ts`
- `.github/workflows/crm-validation.yml` (somente para executar os checks obrigatorios deste PR)
- `src/app/api/gemini/enrich/route.ts` (somente para remover a exigencia de GEMINI_API_KEY durante o build; a key continua obrigatoria em runtime)
- `src/app/api/gemini/extract/route.ts` (mesma correcao de inicializacao runtime-only)
- `src/app/api/gemini/specs/route.ts` (mesma correcao de inicializacao runtime-only)
- `src/app/api/gemini/parse-company/route.ts` (mesma correcao de inicializacao runtime-only)
- `src/app/api/gemini/parse-signature/route.ts` (mesma correcao de inicializacao runtime-only)
- `src/app/debug/page.tsx` (somente para impedir uso de service role durante prerender/build e manter acesso privilegiado condicionado a sessao em runtime)

## CI blocker discovered
- O primeiro CI real do PR passou TypeScript e 92 testes, mas `next build` falhou ao importar rotas Gemini que instanciavam clientes no escopo de modulo sem `GEMINI_API_KEY`.
- A auditoria confirmou o mesmo padrao em `enrich`, `extract`, `specs`, `parse-company` e `parse-signature`.
- A correcao autorizada e limitada a instanciar o cliente apenas no runtime da requisicao, depois de validar a variavel de ambiente.
- Nenhuma credencial sera adicionada ao CI ou ao repositorio.
- O terceiro CI revelou `/debug` prerenderizando sem sessao e chamando `createAdminClient()`, o que exige `SUPABASE_SERVICE_ROLE_KEY` durante o build. A correcao autorizada e tornar a pagina dinamica e criar o cliente privilegiado somente quando houver sessao valida.

## Required behavior
- taxa ausente permanece ausente/null-safe;
- taxa explicita, inclusive zero, e preservada;
- `deal.value` e comissao nao mudam;
- nenhuma migration ou schema change;
- patch minimo e geral.

## Validation
- `npx tsc --noEmit`
- `npm test`
- `npm run build`
- `git diff --check`

## Commit / PR
Commit e PR estao autorizados. A continuidade foi reafirmada pelo usuario em 2026-10-01. E autorizado adicionar um workflow minimo de CI no escopo acima apenas para executar os checks obrigatorios deste PR. Auto-merge continua proibido. Producao permanece sob gate humano.

## External side effects
Sem deploy, migration, mutacao de dados externos, secrets ou alteracoes de auth/RBAC.
