import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('global search wiring', () => {
  it('replaces the inert header input with an explicit search action', () => {
    const header = readFileSync('src/components/layout/Header.tsx', 'utf8');
    expect(header).toContain('onSearchClick');
    expect(header).toContain('Abrir busca global');
    expect(header).not.toContain('<Input');
  });

  it('mounts the real command bar and supports Ctrl/Cmd+K', () => {
    const shell = readFileSync('src/components/layout/DashboardShell.tsx', 'utf8');
    expect(shell).toContain('<CommandBar');
    expect(shell).toContain('setIsCommandOpen(true)');
    expect(shell).toContain("event.key.toLowerCase() === 'k'");
    expect(shell).toContain('event.ctrlKey || event.metaKey');
  });
});
