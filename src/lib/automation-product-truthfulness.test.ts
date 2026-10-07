import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('automation product truthfulness', () => {
  it('does not present local heuristics as AI generation', () => {
    const source = readFileSync('src/app/(dashboard)/automations/client-page.tsx', 'utf8');

    expect(source).not.toContain('parseAIIntent');
    expect(source).not.toContain('Gerar com IA');
    expect(source).not.toContain('a IA fará o resto');
    expect(source).not.toContain('Antigravity AI');
  });

  it('does not expose fabricated productivity metrics', () => {
    const source = readFileSync('src/app/(dashboard)/automations/client-page.tsx', 'utf8');

    expect(source).not.toContain('42h');
    expect(source).not.toContain('Tempo Economizado');
    expect(source).toContain('Automações Ativas');
    expect(source).toContain('activeAutomations');
  });
});
