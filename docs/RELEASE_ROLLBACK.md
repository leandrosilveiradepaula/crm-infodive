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
