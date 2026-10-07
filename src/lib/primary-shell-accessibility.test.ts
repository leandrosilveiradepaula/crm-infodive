import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('primary shell accessibility', () => {
  it('keeps icon-only header controls named and exposes search on mobile', () => {
    const header = readFileSync('src/components/layout/Header.tsx', 'utf8');
    expect(header).toContain('aria-label="Abrir menu principal"');
    expect(header).toContain('aria-label="Abrir busca global"');
    expect(header).toContain('className="md:hidden"');
    expect(header).toContain('aria-label="Abrir assistente do CRM"');
    expect(header).toContain('aria-label="Alternar tema"');
  });

  it('keeps collapsed navigation links accessible', () => {
    const sidebar = readFileSync('src/components/layout/Sidebar.tsx', 'utf8');
    expect(sidebar).toContain("aria-label={collapsed ? label : undefined}");
    expect(sidebar).toContain("aria-current={isActive ? 'page' : undefined}");
    expect(sidebar).toContain('aria-label="Fechar menu principal"');
    expect(sidebar).toContain('aria-label="Sair do sistema"');
  });

  it('keeps keyboard guidance localized', () => {
    const command = readFileSync('src/components/layout/CommandBar.tsx', 'utf8');
    expect(command).toContain('Voltar');
    expect(command).toContain('Navegar');
    expect(command).toContain('Selecionar');
    expect(command).not.toContain('> Back');
    expect(command).not.toContain('> Navigate');
    expect(command).not.toContain('> Select');
  });
});
