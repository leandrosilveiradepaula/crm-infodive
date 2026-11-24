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
    for (const token of ['var(--popover)', 'var(--popover-foreground)', 'var(--primary)',
      'var(--primary-foreground)', 'var(--border)', 'var(--ds-shadow-overlay)',
      'var(--radius-panel)', 'var(--radius-control)', 'var(--ring)']) {
      expect(css).toContain(token);
    }
    expect(css).toContain('.command-item:focus-visible');
    expect(css).not.toMatch(/#[0-9a-fA-F]{6}\b/);
    expect(css).not.toContain('background: white;');
    expect(css).not.toContain('font-weight: 600px;');
  });
  it('centralizes overlay and command dimensions without adding a second palette', () => {
    for(const token of ['--ds-command-overlay:', '--ds-command-max-width:',
      '--ds-command-list-max-height:', '--ds-command-input-size:'])expect(tokens).toContain(token);
  });
});
