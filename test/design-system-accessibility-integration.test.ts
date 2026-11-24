import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (file: string) => readFileSync(resolve(process.cwd(), file), 'utf8');

describe('Global visual contract in real Pipeline and reporting states', () => {
  it('keeps text-bearing panels on deterministic solid surfaces, never behind decorative gradients', () => {
    const css = read('src/design-system/tokens.css');
    for (const cls of ['.ds-panel-highlight', '.ds-panel-financial']) {
      const block = css.slice(css.indexOf(cls), css.indexOf('}', css.indexOf(cls)));
      expect(block).toContain('background-color: var(--ds-surface-');
      expect(block).toContain('background-image: none;');
    }
    expect(css).toContain('--ds-gradient-highlight:');
    expect(css).toContain('.ds-gradient-context {');
  });

  it('removes nested Pipeline modal local palettes and gradients while keeping readable statuses', () => {
    const files = [
      'src/components/pipeline/tabs/OverviewTab.tsx',
      'src/components/pipeline/ai/DealDoctorFinal.tsx',
      'src/components/pipeline/ai/RiskRadar.tsx',
    ];
    for (const file of files) {
      const src = read(file);
      expect(src).not.toMatch(/\bbg-gradient-to-[a-z-]+/);
      expect(src).not.toMatch(/\btext-(?:blue|emerald|amber|teal|rose|red)-\d{2,3}\b/);
      expect(src).not.toMatch(/\b(?:from|to)-(?:blue|teal)-\d{2,3}/);
    }
    const overview = read(files[0]);
    expect(overview).toContain('ds-panel-highlight');
    expect(overview).toContain('text-success-readable');
    const doctor = read(files[1]);
    expect(doctor).toContain('text-warning-readable');
    const radar = read(files[2]);
    expect(radar).toContain('text-destructive-readable');
  });

  it('keeps the real application background inert while the modal is mounted, with cleanup', () => {
    const shell = read('src/components/layout/DashboardShell.tsx');
    const modal = read('src/components/pipeline/ViewDealModal.tsx');
    expect(shell).toContain('data-slot="crm-dashboard-shell"');
    expect(modal).toContain("document.querySelector<HTMLElement>('[data-slot=\"crm-dashboard-shell\"]')");
    expect(modal).toContain('shell.inert = true;');
    expect(modal).toContain('shell.inert = wasInert;');
    expect(modal).toContain('}, [isOpen]);');
  });

  it('requires real dialog focus and bounded overlap diagnostics instead of hiding axe incompletes', () => {
    const runner = read('test/e2e/run-authenticated-smoke.mjs');
    const modal = read('src/components/pipeline/ViewDealModal.tsx');
    expect(runner).toContain('assertOpportunityDialogKeyboard(page, openDetails)');
    expect(runner).toContain("radixFocusGuard: element.hasAttribute('data-radix-focus-guard')");
    expect(runner).toContain('hitTest,');
    expect(runner).toContain("pseudoBefore: pseudoPresent('::before')");
    expect(runner).toContain("await page.keyboard.press('Escape')");
    expect(runner).toContain('const detailIssues = detailAxe.incompleteCount + detailAxe.violationsCount');
    for (const region of ['deal-dialog', 'deal-header', 'deal-tabs', 'deal-sidebar', 'deal-financial']) {
      expect(modal).toContain(`data-qa-region="${region}"`);
    }
  });

  it('restores focus, fixes Radix guards and keeps the full QA matrix fail-closed', () => {
    const modal = read('src/components/pipeline/ViewDealModal.tsx');
    const dialog = read('src/components/ui/dialog.tsx');
    const runner = read('test/e2e/run-authenticated-smoke.mjs');
    const overview = read('src/components/pipeline/tabs/OverviewTab.tsx');
    expect(modal).toContain('onOpenAutoFocus={() => {');
    expect(modal).toContain('onCloseAutoFocus={(event) => {');
    expect(modal).toContain('opener.focus({ preventScroll: true })');
    expect(dialog).toContain("document.querySelectorAll<HTMLElement>('[data-radix-focus-guard][aria-hidden=\"true\"]')");
    expect(dialog).toContain("guard.removeAttribute('aria-hidden')");
    expect(dialog).toContain('return () => observer.disconnect()');
    expect(runner).toContain('CRM_B4_KEYBOARD_DIAGNOSTIC=');
    expect(runner).toContain("a11yFailedRoutes.add('/pipeline?detail:keyboard')");
    expect(runner).toContain('const returnedToOpener = await opener.evaluate(');
    expect(overview).toContain('onClick: onViewCommunications');
    expect(overview).not.toContain('onClick: () => { }');
    expect(overview).not.toContain('A última comunicação foi há 3 dias.');
  });

  it('uses genuine activities and removes fabricated history, counts and health fallbacks', () => {
    const overview = read('src/components/pipeline/tabs/OverviewTab.tsx');
    const history = read('src/components/pipeline/tabs/HistoryTab.tsx');
    const timeline = read('src/components/pipeline/DealActivityTimeline.tsx');
    const radar = read('src/components/pipeline/ai/RiskRadar.tsx');
    const modal = read('src/components/pipeline/ViewDealModal.tsx');
    expect(timeline).toContain('deal.deal_activities');
    expect(timeline).toContain('Nenhuma atividade registrada');
    expect(modal).toContain('<DealActivityTimeline deal={deal} compact />');
    expect(history).toContain('<DealActivityTimeline deal={deal} />');
    expect(modal).toContain("onClick={() => setActiveTab('history')}");
    expect(overview).not.toContain('Proposta enviada para o cliente');
    expect(overview).not.toContain('Date.now() -');
    expect(overview).not.toContain('deal.health_score || 0');
    expect(overview).not.toContain('stakeholders?.length || 1');
    expect(history).not.toContain('Generate some mock history');
    expect(history).not.toContain('bg-blue-500');
    expect(radar).not.toContain('deal.health_score ?? 100');
    expect(radar).toContain('Sem avaliação de risco registrada');
    expect(radar).not.toContain('Nenhuma anomalia detectada');
  });

  it('separates the stored opportunity estimate from product pricing and forbids write-on-open', () => {
    const modal = read('src/components/pipeline/ViewDealModal.tsx');
    const products = read('src/components/pipeline/DealProductsTab.tsx');
    const refresh = modal.split('const handleProductsUpdate = async () => {')[1]
      ?.split('// Modal content is portalled')[0] || '';
    expect(refresh).toContain('getDealDetails(deal.id)');
    expect(refresh).toContain('value: freshDeal.value');
    expect(refresh).not.toContain('await updateDeal(');
    expect(modal).toContain('const pricingMismatch =');
    expect(modal).toContain('data-qa-region="deal-pricing-discrepancy"');
    expect(modal).toContain('formatCurrency(pricedProductTotal)');
    expect(modal).toContain('formatCurrency(estimatedValue)');
    expect(modal).toContain('Revisar itens');
    expect(products).toContain('await updateDeal(deal.id, { value: newTotalValue });');
  });

  it('uses central layout tokens for responsive opportunity detail and retains every action', () => {
    const modal = read('src/components/pipeline/ViewDealModal.tsx');
    const css = read('src/design-system/tokens.css');
    expect(modal).toContain('className="ds-deal-body"');
    expect(modal).toContain('className="ds-deal-tablist grid');
    expect(modal).toContain('ds-deal-inspector');
    expect(modal).toContain('Alterar etapa da oportunidade');
    expect(modal).toContain("onValueChange={handleStageChange}");
    expect(modal).toContain('onClick={handleDuplicate}');
    expect(modal).toContain('onClick={() => isEditing ? handleSave() : setIsEditing(true)}');
    expect(modal).toContain('onClick={() => setShowContractBuilder(true)}');
    expect(modal).toContain('onClick={() => setActiveTab(\'history\')}');
    for (const name of ['--ds-deal-dialog-width:', '--ds-deal-inspector-width:', '--ds-deal-content-padding:', '--ds-deal-tabs-columns:']) {
      expect(css).toContain(name);
    }
    expect(css).toContain('@media (max-width: 640px)');
  });

  it('keeps header/actions visible and AI primary action contrast semantic in both themes', () => {
    const css = read('src/design-system/tokens.css');
    const modal = read('src/components/pipeline/ViewDealModal.tsx');
    const doctor = read('src/components/pipeline/ai/DealDoctorFinal.tsx');
    const runner = read('test/e2e/run-authenticated-smoke.mjs');
    expect(css).toContain('flex: 0 0 auto;');
    expect(modal).toContain('text-label-ui font-medium normal-case tracking-normal');
    expect(modal).toContain('Valor calculado dos itens');
    expect(modal).not.toContain('O valor estimado difere da soma dos itens precificados.');
    expect(doctor).toContain('bg-primary text-primary-foreground');
    expect(doctor).not.toContain('bg-primary text-white');
    expect(runner).toContain('Opportunity header content is clipped or obscured.');
  });

  it('ensures all inactive opportunity tab labels have fully readable semantic foreground text', () => {
    const modal = read('src/components/pipeline/ViewDealModal.tsx');
    const tabs = read('src/components/ui/tabs.tsx');
    expect(modal).toContain('text-foreground data-[state=active]:text-primary-foreground"');
    expect(tabs).toContain('data-[state=active]:bg-primary data-[state=active]:text-primary-foreground');
    expect(modal).toContain('data-qa-region="deal-tabs"');
  });

  it('keeps all eight existing opportunity sections accessible with compact navigation', () => {
    const modal = read('src/components/pipeline/ViewDealModal.tsx');
    const css = read('src/design-system/tokens.css');
    const nav = modal.split('data-qa-region="deal-tabs"')[1]?.split('flex-1 overflow-hidden relative')[0] || '';
    for (const primary of ['overview', 'products', 'proposals']) {
      expect(nav).toContain(`{ id: '${primary}',`);
    }
    for (const extra of ['partners', 'stakeholders', 'documents', 'omnichannel', 'history']) {
      expect(modal).toContain(`{ value: '${extra}',`);
      expect(modal).toContain(`value="${extra}"`);
    }
    expect(modal).toContain('aria-label="Outras seções da oportunidade"');
    expect(modal).toContain('onValueChange={setActiveTab}');
    expect(css).toContain('--ds-deal-tabs-columns: 3;');
    expect(css).toContain('--ds-deal-more-width:');
    expect(css).toContain('.ds-deal-overview-section {');
    expect(css).toContain('.ds-deal-overview-grid {');
  });

  it('uses recorded sales facts without fabricated contact roles or AI-generated recommendations', () => {
    const overview = read('src/components/pipeline/tabs/OverviewTab.tsx');
    expect(overview).toContain('data-qa-region="deal-overview"');
    expect(overview).toContain('recorded(deal.lead_source)');
    expect(overview).toContain('recorded(ownerName)');
    expect(overview).toContain('recorded(deal.contact_name)');
    expect(overview).toContain('recorded(deal.next_step)');
    expect(overview).toContain('products.slice(0, 4)');
    expect(overview).toContain('Saúde registrada');
    expect(overview).toContain('className="ds-deal-primary-facts"');
    expect(overview).toContain('formatCurrency(deal.value)');
    expect(overview).toContain('recordedProbability');
    expect(overview).toContain('expectedClose');
    const contactSection = overview.split('aria-labelledby="deal-linked-contact"')[1]?.split('</section>')[0] || '';
    expect(contactSection).not.toContain('<dl className="space-y-3">');
    expect(contactSection).not.toContain('<dt');
    expect(contactSection).not.toContain('<dd');
    expect(overview).toContain('Sem avaliação');
    expect(overview).not.toContain('Tomador de Decisão');
    expect(overview).not.toContain('Decisor não definido');
    expect(overview).not.toContain('Mock Next Best Action');
    expect(overview).not.toContain('A última comunicação foi há 3 dias.');
  });

  it('does not present fabricated trends and renders honest empty reports on authorized fixtures', () => {
    const report = read('src/app/(dashboard)/reports/client-page.tsx');
    const charts = read('src/components/charts/ReportsCharts.tsx');
    for (const fake of ['description: "+12.5%"', 'description: "+2.1%"', 'description: "+3 dias"']) {
      expect(report).not.toContain(fake);
    }
    expect(report).toContain('aria-label="Buscar nos relatórios"');
    expect(report).toContain('bg-surface-raised');
    expect(report).toContain('md:flex-[1_1_18rem]');
    expect(report).not.toContain('gradient: "from-');
    expect(charts).toContain('function EmptyChartState');
    expect(charts).toContain('Sem dados para os filtros selecionados.');
    const stats = read('src/components/layout/StatsGrid.tsx');
    expect(stats).toContain('gradient?: string;');
  });
});
