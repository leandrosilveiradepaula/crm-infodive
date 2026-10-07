import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('dashboard error and loading states', () => {
  it('does not render raw server error messages to authenticated users', () => {
    const source = readFileSync('src/app/(dashboard)/error.tsx', 'utf8');
    expect(source).not.toContain('{error.message');
    expect(source).toContain('Referência do erro: {error.digest}');
  });

  it('uses semantic foreground color in critical loading fallbacks', () => {
    for (const path of [
      'src/app/(dashboard)/dashboard/page.tsx',
      'src/app/(dashboard)/pipeline/page.tsx',
    ]) {
      const source = readFileSync(path, 'utf8');
      expect(source).toContain('text-foreground');
      expect(source).not.toContain('text-white p-8');
    }
  });

  it('keeps icon-only activity controls accessible', () => {
    const source = readFileSync('src/app/(dashboard)/activities/client-page.tsx', 'utf8');
    expect(source).toContain('aria-label="Exibir atividades em lista"');
    expect(source).toContain('aria-label="Exibir atividades no calendário"');
    expect(source).toContain("aria-pressed={viewMode === 'list'}");
    expect(source).toContain('aria-label={\`Editar atividade \${activity.title}\`}');
    expect(source).toContain('aria-label={\`Excluir atividade \${activity.title}\`}');
  });

  it('labels icon-only automation controls and avoids theme-hardcoded headings', () => {
    const source = readFileSync('src/app/(dashboard)/automations/client-page.tsx', 'utf8');
    expect(source).toContain('aria-label="Remover filtro de automações"');
    expect(source).toContain('aria-label={\`Abrir ações da automação \${automation.name}\`}');
    expect(source).toContain('aria-label="Fechar biblioteca de receitas"');
    expect(source).toContain('text-foreground tracking-tighter">Biblioteca de Receitas');
  });

});
