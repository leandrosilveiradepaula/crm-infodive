import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('CRM centrally themed shell and commercial workspace', () => {
  it('centralizes global navigation geometry, view controls and progress gradients', () => {
    const css = source('src/design-system/tokens.css');
    for (const token of ['nav-rail-width', 'nav-expanded-width', 'nav-target-size', 'header-height', 'filter-gap', 'gradient-progress-primary', 'gradient-progress-success']) {
      expect(css).toContain('--ds-' + token);
    }
    expect(css).toContain('.ds-progress-primary');
    expect(css).toContain('.ds-progress-success');
  });

  it('uses contextual accessible navigation without restoring the developer catalog to primary routes', () => {
    const sidebar = source('src/components/layout/Sidebar.tsx');
    const header = source('src/components/layout/Header.tsx');
    expect(sidebar).toContain('aria-label="Áreas principais"');
    expect(sidebar).toContain('Navegação de ${activeArea.label}');
    expect(sidebar).not.toContain("href: '/design-preview'");
    expect(sidebar).toContain('w-[var(--ds-nav-rail-width)]');
    expect(sidebar).toContain('w-[var(--ds-nav-expanded-width)]');
    expect(header).toContain('min-h-[var(--ds-header-height)]');
    expect(header).toContain('aria-label="Alternar tema"');
  });

  it('provides a real Pipeline board/list toggle, compact summary and token-owned typography', () => {
    const pipeline = source('src/app/(dashboard)/pipeline/client-page.tsx');
    const toggle = source('src/components/ui/ViewToggle.tsx');
    expect(pipeline).toContain("useState<ViewMode>('cards')");
    expect(pipeline).toContain('data-qa-region="pipeline-summary"');
    expect(pipeline).toContain('aria-label="Lista de oportunidades"');
    expect(pipeline).not.toContain('<StatsGrid items={stats} />');
    expect(pipeline).toContain('ds-type-label');
    expect(toggle).toContain('aria-pressed={view ===');
    expect(toggle).toContain('shadow-control-ui');
  });

  it('does not reinstate per-card gradient choices in the sales Kanban', () => {
    const card = source('src/components/pipeline/DealCard.tsx');
    expect(card).toContain('ds-progress-success');
    expect(card).toContain('ds-progress-primary');
    expect(card).not.toContain('bg-gradient-to-');
    expect(card).toContain('Arrastar oportunidade');
  });

  it('preserves modal close accessibility and honest QA inspection regions', () => {
    const modal = source('src/components/pipeline/ViewDealModal.tsx');
    expect(modal).toContain('aria-label="Fechar detalhes da oportunidade"');
    for (const region of ['deal-doctor', 'deal-risk', 'deal-actions']) expect(modal).toContain('data-qa-region="' + region + '"');
    expect(modal).toContain('ds-panel-financial');
    expect(modal).toContain('ds-panel-highlight');
  });
});
