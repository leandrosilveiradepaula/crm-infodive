# CURRENT_TASK.md — autorização ativa da AI Product Factory

Este documento contém **somente a tarefa vigente**. O histórico integral anterior foi preservado byte a byte em `docs/codex/archive/CURRENT_TASK_FULL_BEFORE_PROOF1_2026-10-23.md` (blob imutável Git `bcc9dd5368b461dfb6b34b604a8cc4b1ef966e00`, origem `0f1815264cc832e77fb81f5ff6859205aed7082d`).

O histórico é material de auditoria e **não concede autorizações de escrita novas**, não reabre tarefas antigas, não substitui os gates atuais nem prova que a Prova 1 terminou. Antes de trabalhar, verificar `AGENTS.md` e a seção ativa abaixo no mesmo SHA.

## Tarefa autorizada (2026-10-23): Prova 1 da Factory — filtros acessíveis em Relatórios (CRM issue #24)

**Autorização do operador:** CRM issue #24, comentário OWNER id 6371354929, em
https://github.com/leandrosilveiradepaula/crm-infodive/issues/24#issuecomment-6371354929.
É trabalho **real do CRM** para certificar uma única jornada da AI Product Factory,
não benchmark artificial nem replay das execuções anteriores. Esta seção substitui
a tarefa ativa anterior para novos commits, sem reabrir issues históricas.

### Base e objetivo

Base autorizada: `preview/hardening-release-candidate`, SHA
`f0f45cb39bf1b462202baa942e67250fe0841f91` (ou candidato mais novo
repinado com a política server-side já autorizada e CI nativa SHA-exata).

Implementar acessibilidade funcional dos filtros de Relatórios & Insights,
atualmente com controles sem nomes acessíveis, seleção de trimestres sem
`aria-pressed` e estado de carregamento sem status semântico. Preservar
filtros, buscas, estados, resultados, exportação e contratos de negócio.

### Limite explícito de escrita

- `docs/codex/CURRENT_TASK.md` — registrar evidência e a identidade do candidato.
- `src/app/(dashboard)/reports/client-page.tsx` — controles e estados.
- `src/lib/reports-filter-accessibility.test.ts` (novo) e/ou
  `src/lib/reports-accessibility.test.ts` (novo) — regressões determinísticas.
- `scripts/browser-smoke.mjs` — somente prova de teclado e responsividade
  de Relatórios, se o harness existente permitir sem atalhos.

Não editar outros arquivos sem nova autorização OWNER explícita. Não alterar
schema/migrations, RLS/RBAC/auth, API, relatórios financeiros, integrações,
credenciais, n8n, Vercel ou workflow de CI.

### Definition of Done de produto e Factory

1. Busca, ano, status, faturamento e vendedor com rótulos associados e verificáveis.
2. Trimestres e opção Tempo Todo expondo seleção/estado de forma semântica;
   navegação por teclado e foco visível, sem afetar o comportamento existente.
3. Loading/empty/error anunciados adequadamente, sem inventar resultados.
4. Testes offline executáveis e regressão de interação/teclado onde possível;
   TypeScript, lint, Vitest, build e browser smoke originais preservados.
5. **Implementação precisa sair da própria Factory:** Start OWNER legítimo,
   Product Stage, backlog, Work Unit e commit/PR criados pelo runtime Direct
   com identidade de run/change set, CI SHA-exata, review e Preview validado
   quando aplicável. A prova fecha em `awaiting_release`; não há merge de
   produção e nenhuma ação retroativa em Change Sets antigos.

Commits e PR da implementação são autorizados **somente** em branch não
produtiva com destino `preview/hardening-release-candidate`. Integração nessa
branch pode ser automática após todas as provas exigidas, desde que não
publique produção. Merge da PR #56 para `main` continua gate humano.

Não executar modelo pago para readiness/smoke/sondagem. Chamadas pagas somente
quando etapa legítima exigir, sob reserva e ledger real do Control Plane.
Não forçar reparos de CI, não criar Preview repetitivo nem reabrir backlog
antigo. Se Preview remoto ou CRM Supabase ficar indisponível, registrar
`blocked_external_dependency` com evidência exata em vez de alegar PASS.

### Evidência factual desta alteração

- Candidato identificado no pacote de contexto: branch `factory/cs-bd46da70/reports-filter-accessibility`, com base exata informada `0a663e83668bbc3ba9f2f34ef0ca6ffe51709ae7`.
- Escopo de escrita usado: esta documentação, `src/app/(dashboard)/reports/client-page.tsx` e `src/lib/reports-filter-accessibility.test.ts`.
- Nenhuma validação, commit, PR, integração, Preview ou publicação é registrada nesta alteração.
