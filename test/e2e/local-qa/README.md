# CRM B4 — execução E2E real sem aprovação humana repetida

Esta trilha valida **o mesmo Next.js da PR**, incluindo middleware, IronSession, login Supabase, layout, barra lateral e rotas reais, não uma vitrine de componentes. Ela executa o runner de aceitação `test/e2e/run-authenticated-smoke.mjs` integralmente nos quatro perfis, desktop/mobile e light/dark.

**Nenhum segredo ou projeto hospedado é usado:** a workflow inicializa um Supabase temporário fora da árvore do repositório, sem vinculação a um projeto remoto; aplica em ordem apenas os três SQLs sintéticos existentes em `docs/ui/`; cria usuários reais no Auth local com senhas aleatórias e valida a URL, o DB URL e o isolamento antes de exportar as credenciais efêmeras para o processo Next.js. As senhas ficam em arquivo 0600 do runner e nunca entram nos logs/artefatos. O banco local é destruído no cleanup.

## Regras de certificação

1. O pré-QA Vite de componentes **não é certificação do CRM**. Apenas reproduz componentes isolados e serve como regressão rápida.
2. Esta trilha real local deve estar **SUCCESS** para o SHA exato antes de solicitar uma nova revisão humana para o gate remoto `crm-ui-qa`.
3. O gate remoto continua obrigatório: mesmo com a aplicação real, o esquema sintético de `docs/ui` pode divergir de migrações da base hospedada ou de condições de rede. Nunca declarar 22/22 com base apenas no local.
4. Em qualquer erro, corrigir a causa no **mesmo PR**, executar novamente sem envolver o usuário e não desabilitar rules de axe, middleware, sessão ou controles RLS.
5. O runner autenticado deve percorrer a matriz inteira e manter `incomplete` como falha. Se houver novas diferenças no remoto, registrar quais aspectos locais não reproduziram para melhorar o ambiente, sem transferir debugging ao revisor.

A separação do projeto Supabase local é verificada pelo script `export-local-status.mjs` e pelo `provision-local-auth.mjs`, ambos fail-closed. A importação dos nomes, perfis e rotas autorizadas vem do próprio provisionador protegido do B4, evitando inventários distintos.

O escopo deste experimento é exclusivamente QA. Não executa migration contra Supabase remoto, não altera usuários reais, não cria exceção de autenticação, não afrouxa as regras de proteção Vercel/GitHub e não publica produção.

Referências de projeto: Next.js recomenda Playwright na aplicação compilada; Playwright recomenda estado autenticado isolado por contexto; Supabase oferece stack local para testes. Supabase CLI v3 mudou o default em novembro/2026; por isso o pipeline fixa o canal `v2.stable` para evitar atualizações involuntárias.
