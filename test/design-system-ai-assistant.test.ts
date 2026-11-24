import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (p: string) => readFileSync(resolve(process.cwd(), p), 'utf8');

describe('Actual CRM Watson AI drawer consumes semantic design primitives', () => {
  it('is mounted through the real dashboard header and retains the existing chat action', () => {
    const header = read('src/components/layout/Header.tsx');
    const drawer = read('src/components/ai/AiAssistant.tsx');
    expect(header).toContain('<AiAssistant isOpen={isAiOpen}');
    expect(drawer).toContain('runCRMConsultantChat');
    expect(drawer).toContain('handleSend');
  });
  it('has semantic status/contrast, identifiable dialog and accessible icon-only controls', () => {
    const s = read('src/components/ai/AiAssistant.tsx');
    expect(s).toContain('role="dialog" aria-label="Watson AI" aria-modal="true"');
    expect(s).toContain('aria-label="Fechar Watson AI"');
    expect(s).toContain('aria-label="Enviar mensagem ao Watson AI"');
    expect(s).toContain('aria-label="Mensagem para Watson AI"');
    expect(s).toContain('bg-success-subtle text-success-readable');
    expect(s).toContain('shadow-overlay-ui');
    expect(s).not.toMatch(/\b(?:bg|text|border|ring|from|via|to)-(?:blue|red|green|yellow|amber|emerald|rose|teal|cyan|sky|violet|purple|pink|indigo|orange|lime|slate|gray|zinc|neutral|stone)-\d{2,3}(?:\/\d{1,3})?\b/);
    expect(s).not.toMatch(/\btext-(?:xs|sm|base|lg|xl|[2-9]xl)\b/);
  });
  it('traps Tab, closes with Escape and returns focus to the opener', () => {
    const assistant = read('src/components/ai/AiAssistant.tsx');
    expect(assistant).toContain('const dialogRef = useRef<HTMLDivElement>(null)');
    expect(assistant).toContain('const inputRef = useRef<HTMLInputElement>(null)');
    expect(assistant).toContain("if (event.key === 'Escape')");
    expect(assistant).toContain("if (event.key !== 'Tab') return;");
    expect(assistant).toContain('previouslyFocused?.focus();');
    expect(assistant).toContain('inputRef.current?.focus();');
    expect(assistant).toContain('ref={dialogRef} tabIndex={-1}');
  });

  it('audits actual drawer before marking UX gate passed', () => {
    const qa = read('test/e2e/run-authenticated-smoke.mjs');
    expect(qa).toContain('CRM_B4_ASSISTANT_DRAWER_DIAGNOSTIC=');
    expect(qa).toContain('const assistantAxe = await runAxe(page, source)');
    expect(qa).toContain('state: \'ai-drawer\'');
  });
});
