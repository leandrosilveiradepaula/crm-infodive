## 27/11/2026 — second integrated QA and primary-button correction

Candidate `5f762cea3014e6638a93a823a158f0a316a48e28`: [CI 45854822248](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45854822248) PASS (509/509 tests, build, PDF rendering, synthetic accessibility, zero monitored debt). [QA 45854822312](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45854822312) partial: the entire authenticated matrix passed (458 checks), 27/33 complementary cases passed, including every persistence and tenant isolation scenario. All remaining failures concern one control: Gerar PDF in the proposal editor, reproduced in six viewport/theme combinations. [Artifact 15135898306](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45854822312/artifacts/15135898306), 355 PNGs, exact candidate. The sanitized axe diagnostic reports 2.95:1 in light and 1.2:1 in dark. No other complementary accessibility finding remained. Local checkout exact SHA and tree verified; private reference montage inspected again and UI/UX Pro Max research run.

The primary CTA redundantly supplied both the semantic foreground and a custom text-size class to the shared Button class-merging function. The computed color shows the semantic foreground is not effective. Remove the entire local CTA style override and explicitly use the standard primary variant and shared small size. Do not change global token values, PDF generation, permissions, data or already-passing routes. Add a guard requiring the shared variant without local styles and a real-browser assertion comparing the enabled button foreground/background to computed semantic token values in all six editor cases. Keep axe and all 33 cases intact. New exact-SHA CI and browser QA plus visual inspection are required before merge. Portability remains a separately documented readiness limitation; no generic export authorized.

---

## 26/11/2026 — first real integrated QA: findings and corrections

Candidate `f0ff7d870e7cd54b76a5f4b4df45647ac58293a1`: [CI 45850769110](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45850769110) PASS, 508/508 tests, 43 suites, build, synthetic axe, 16 PDF pages, zero inventory debt. [QA 45850769280](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45850769280) FAIL. Directly inspected [artifact 15134466097](https://github.com/leandrosilveiradepaula/crm-infodive/actions/runs/45850769280/artifacts/15134466097), product-readiness/results.json and complementary screenshots, local exact checkout. 18/33 complementary cases passed, including actual company/contact/lead creation, draft persistence/reopening and amount, real order status transition without value change, tenant segregation, anonymous invalid/draft token rejection, foreign editor denial, public view receipt and portal access receipt. The prior matrix failed six orders accessibility cases (one unlabeled icon in all viewports/themes).

- Opportunity not persisted: required closing date was unfilled and currency input unset in test. Fill actual form controls, verify HTML validity, independent amount and date readback; keep activity dependency and all checks.
- Sales orders: label real menu trigger, keep actions visible and use opaque menu surface; avoid low-contrast finalized label.
- Editor: use semantic primary foreground and readable AI button, do not dim the active section switches along with disabled rows.
- Public status: use readable foreground on info-subtle in both themes.
- Portal: remove text opacity on the next-step block, use readable contact surfaces, render legacy initials correctly with shared avatar fallback (RPC returns initials, not URL); replace hardcoded workflow claims with general guidance and real expected closing date, remove dead footer links, avoid invented job title. Keep actual access and financial behavior unchanged.
- Add bounded axe computed-color diagnostics (no raw text, selectors, credentials or tokens). First report recorded rule/count only; contrast repairs are based on screenshot/source review and must pass re-execution.
- Portability inventory on this exact candidate: 10 exclusion/review paths, 7 environment-bound files, 25 identity-bound app files (the previous 26 was a baseline count), 37 env variable names. BLOCKED_FOR_DIRECT_CLONE. No export, no production changes.

This is remediation, not a certified result. Require new same-SHA CI, all previous browser checks, 33 complementary cases, visual review and owner merge.

---

# Auditoria complementar de produto e prontidão de reutilização — 26/11/2026

## Escopo e baseline
Autorização do proprietário na conversa de 26/11: concluir interfaces complementares, jornadas comerciais reais e preparar a base reutilizável, sem depender de aceite visual pessoal. Base main `382cabde622c4712fb1b3a15e4ff63e7c49ef266`, árvore `a871da863c478dedc55e54b7935304a4107eafda`, idêntica ao candidato certificado da #224. CI e QA isolado anteriores passaram (502 testes, 454 verificações, 324 capturas, 1.260 provas de tokens). Checkout local recuperado do artefato dessa árvore; pesquisa UI/UX Pro Max executada. A nova rodada exige evidência nova; não herda PASS.

### Achados confirmados por código
- Portal: parâmetros de rota no formato síncrono anterior ao Next 16; agregação SQL de itens pode retornar null, e responsável pode ser null. Corrigir leitura de params e renderização das ausências, sem inventar contatos.
- Editor: cabeçalho e três painéis de largura fixa em qualquer viewport; navegação de seção e switches sem rótulos consistentes. Manter os painéis lado a lado no desktop largo, empilhar em telas menores, região rolável identificada para o documento, dimensões físicas do documento preservadas.
- Proposta pública: editor grava content_json, activeSections e products_json; visualização só verificava flags legadas. Preservar compatibilidade com formatos anteriores, usar seleção e ordem salvas, incluir notas e ajustar largura/estado de carregamento/erro. Não alterar cálculos, assinatura, exportação ou regras de publicação.
- Pedidos: /sales-orders sempre mostrava estado vazio; reaproveitar SalesList com aba Pedidos selecionada em vez de duplicar lógica.

### Provas funcionais (pendentes até execução)
A nova suíte complementa, nunca substitui, o QA anterior. Alvo exclusivamente localhost, dois tenants e quatro usuários de teste existentes. Fixture SQL mínima ampliada para campos usados pelas ações reais; instalar os corpos exatos de três RPCs já versionados, com ACL service_role. Não aplicar migrations hospedadas; não alegar replay completo de migrations. A preparação de proposta enviada, sala e pedido faturado é fixture explicitamente marcada, não prova de envio/faturamento.

- Criar empresa, contato vinculado, lead, oportunidade vinculada e atividade com vínculos por formulários reais; verificar persistência independente e releitura da página.
- Salvar rascunho no editor via API real, conferir versão/número/valor/conteúdo e reabrir.
- Ler pedido pela rota real, avançar de faturado para entregue e conferir status persistido/valor inalterado.
- Usuário de outro tenant: lista segregada e POST de rascunho cross-tenant negado, sem gravação; editor estrangeiro negado; raiz pública redireciona a login.
- Sem sessão: tokens inválido/rascunho não expostos, portal inativo negado, proposta enviada registra visualização e portal ativo registra acesso. Testar conteúdo salvo.
- Editor, proposta pública e portal: desktop 1440, tablet 768, mobile 390; claro/escuro; sem overflow de documento, WCAG A/AA sem violações ou incomplete; screenshots. Tema público é override visual temporário, não prova de persistência.
- Portal sem itens/responsável; proposta pública loading e erro com atraso de requisição real, sem respostas simuladas.
- Todos os casos registrados individualmente em product-readiness/results.json, vinculados ao SHA; falha permanece hard gate, a revisão visual continua obrigatória.

### Prontidão de reutilização
A auditoria local inicial encontrou 10 arquivos rastreados que exigem exclusão/revisão (metadados supabase/.temp e dois dumps), sete fontes contendo referências de ambiente Supabase e 26 arquivos de aplicação ligados à identidade Infodive. Apenas contagens/caminhos são registrados; não imprimir valores. O script audit-reusable-base.mjs repete o inventário a cada candidato e lista nomes de variáveis, não seus valores. A presença desses arquivos não prova que contêm dados de cliente ou credenciais; não copiá-los automaticamente.

Para uma futura base genérica: (1) selecionar release certificada e autorizada; (2) exportar somente fontes necessárias, sem .git, dumps, arquivos de ambiente/CLI, segredos, evidências antigas nem dados; (3) parametrizar identidade (metadata, logos, textos comerciais, documentos, remetentes e contatos), integrações e referências de ambiente; (4) provisionar projeto/backend novos e segredos próprios, aplicar e validar cadeia completa de migrations em ambiente isolado, revisar RLS/RBAC e RPCs públicos; (5) build e QA funcionais/visuais no SHA da base genérica; (6) aprovação de release e implantação humana. **Não criar outro repositório/projeto, não exportar dados e não declarar base genérica certificada enquanto essas condições não forem demonstradas.**

### Limites
Não autoriza produção, deploy, migração hospedada, envio de e-mail, integração externa, IA com custo, assinatura real ou alterações financeiras/RBAC. Testar com dados fictícios exclusivamente. A assinatura, envio efetivo, faturamento com upload, conversão de oportunidade em venda e todas as permutações CRUD continuam escopo não comprovado por esta suíte; devem ser testados separadamente antes de alegar certificação irrestrita. O inventário de portabilidade não é análise de segredos nem substitui replay integral de migrations. Nenhuma alegação de aceite pessoal do proprietário.
