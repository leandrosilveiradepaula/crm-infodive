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
Commit e PR estao autorizados. Auto-merge continua proibido. Producao permanece sob gate humano.

## External side effects
Sem deploy, migration, mutacao de dados externos, secrets ou alteracoes de auth/RBAC.
