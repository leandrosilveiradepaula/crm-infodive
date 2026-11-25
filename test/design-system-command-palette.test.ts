import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');

describe('Live CommandBar uses centrally configurable Design System styling', () => {
  const css = read('src/components/layout/CommandPalette.css');
  const tokens = read('src/design-system/tokens.css');
  it('keeps the actual command palette connected to the shared stylesheet', () => {
    const command = read('src/components/layout/CommandBar.tsx');
    expect(command).toContain("import './CommandPalette.css'");
    expect(command).toContain('className="command-palette"');
    expect(command).toContain('className="command-item"');
  });
  it('uses light/dark semantic surfaces, selection contrast, radii and shadows', () => {
    for (const token of ['var(--popover)', 'var(--popover-foreground)', 'var(--accent)',
      'var(--accent-foreground)', 'var(--border)', 'var(--ds-shadow-overlay)',
      'var(--radius-panel)', 'var(--radius-control)', 'var(--ring)']) {
      expect(css).toContain(token);
    }
    expect(css).toContain('.command-item:focus-visible');
    expect(css).not.toMatch(/#[0-9a-fA-F]{6}\b/);
    expect(css).not.toContain('background: white;');
    expect(css).not.toContain('font-weight: 600px;');
  });
  it('is actually mounted by the Header and opens through mouse, mobile and Ctrl+K', () => {
    const header = read('src/components/layout/Header.tsx');
    const command = read('src/components/layout/CommandBar.tsx');
    const qa = read('test/e2e/run-authenticated-smoke.mjs');
    expect(header).toContain('<CommandBar open={isCommandOpen} onOpenChange={setIsCommandOpen} />');
    expect(header).toContain('aria-label="Buscar no CRM"');
    expect(header).toContain("event.key.toLowerCase() === 'k'");
    expect(command).toContain('<DialogTitle className="sr-only">Pesquisa e comandos do CRM</DialogTitle>');
    expect(command).toContain('aria-label="Pesquisar oportunidades, empresas e comandos"');
    expect(qa).toContain('CRM_B4_COMMAND_DIALOG_DIAGNOSTIC=');
    expect(qa).toContain("await page.keyboard.press('Control+k')");
  });

  it('keeps actual search, routing and opportunity actions, not a fake empty dialog', () => {
    const command = read('src/components/layout/CommandBar.tsx');
    expect(command).toContain('searchGlobal(search)');
    expect(command).toContain("router.push('/pipeline')");
    expect(command).toContain("router.push('/customers')");
    expect(command).toContain('updateDealStage(selectedDealId, stage)');
    expect(command).not.toContain('className="font-semibold text-white"');
  });

  it('uses the same labeled Radix dialog and focus-guard repair as authenticated CRM forms', () => {
    const command = read('src/components/layout/CommandBar.tsx');
    const dialog = read('src/components/ui/dialog.tsx');
    const css = read('src/components/layout/CommandPalette.css');
    expect(command).toContain('<Dialog open={open} onOpenChange={onOpenChange}>');
    expect(command).toContain('<DialogContent');
    expect(command).toContain('<DialogTitle className="sr-only">Pesquisa e comandos do CRM</DialogTitle>');
    expect(command).toContain('<DialogDescription className="sr-only">');
    expect(command).toContain('<Command');
    expect(command).not.toContain('<Command.Dialog');
    expect(dialog).toContain('reconcileFocusGuards');
    expect(css).not.toContain('command-dialog-content');
  });

  it('prevents hidden background focus and resolves selected item contrast in both themes', () => {
    const command = read('src/components/layout/CommandBar.tsx');
    const css = read('src/components/layout/CommandPalette.css');
    const qa = read('test/e2e/run-authenticated-smoke.mjs');
    expect(command).toContain('useDialogBackgroundInert(open)');
    expect(css).toContain('background: var(--accent);');
    expect(css).toContain('color: var(--accent-foreground) !important;');
    expect(css).toContain('background: var(--background);');
    expect(css).not.toContain('animation: slideDown 0.2s ease-out;');
    expect(qa).toContain('await page.waitForTimeout(450);');
    expect(qa).toContain('const commandAxe = await runAxe(page, source)');
  });

  it('centralizes overlay and command dimensions without adding a second palette', () => {
    for(const token of ['--ds-command-overlay:', '--ds-command-max-width:',
      '--ds-command-list-max-height:', '--ds-command-input-size:'])expect(tokens).toContain(token);
  });
});
