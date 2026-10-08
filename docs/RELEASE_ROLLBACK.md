# Release & Rollback Checklist

Use este checklist para cada release candidato do CRM.

## Candidato

- [ ] SHA candidato registrado
- [ ] CI verde no SHA exato
- [ ] Preview aplicável e Ready
- [ ] Browser/smoke evidence registrada
- [ ] Migrations revisadas separadamente
- [ ] Product readiness assessment atual ligado ao mesmo SHA
- [ ] Blockers críticos conhecidos explicitados
- [ ] Gate humano de produção registrado

## Pós-release

- [ ] Merge SHA registrado
- [ ] Deployment de produção concluído
- [ ] `/api/health` retorna estado saudável
- [ ] Version/SHA confere com o release
- [ ] Login/autorização validados
- [ ] Pipeline/oportunidades validados
- [ ] Uma mutação de negócio crítica validada
- [ ] Integração crítica aplicável validada
- [ ] Sem incidente crítico aberto pelo release

## Rollback / Recovery

Se houver falha crítica:

- [ ] congelar novas mudanças
- [ ] registrar sintoma, request id e SHA
- [ ] identificar último SHA saudável
- [ ] avaliar se há impacto de schema/dados
- [ ] obter gate humano se houver risco de perda/destruição
- [ ] preferir forward-fix para migrations
- [ ] restaurar código/deployment saudável quando seguro
- [ ] validar health e smoke checks
- [ ] registrar resultado e causa raiz

Este checklist é evidência de processo; não substitui evidência de execução real.


## Automation runtime candidate
The candidate adds the versioned migration `20261007233000_automation_runtime_executions.sql` and code that depends on `automation_executions`.

Important:
- the CRM Supabase project is not accessible through the current connector, so the migration has not been applied or dynamically validated against the real schema;
- deployment of this candidate must remain fail-closed until the real CRM database schema confirms compatible identifier types and the migration is applied in a reviewed environment;
- code and migration may be merged into the non-production release candidate branch before database application, but production release must not enable the runtime without the schema evidence.

Rollback order if the runtime is activated later:
1. disable all configurable automations;
2. revert the application release to the previous verified SHA;
3. preserve `automation_executions` for audit/evidence; do not drop it during emergency rollback;
4. inspect failed/running rows before any schema cleanup;
5. schema removal, if ever desired, is a separate destructive change and requires an explicit human gate.
