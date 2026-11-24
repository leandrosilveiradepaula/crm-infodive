import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8');
const lead = 'src/components/leads/LeadFormModal.tsx';
const contact = 'src/components/contacts/ContactFormModal.tsx';
const customer = 'src/components/customers/CustomerFormModal.tsx';
const idMarker = (prop: string, key: string) =>
  prop + '={' + String.fromCharCode(96) + '${formId}-' + key + String.fromCharCode(96) + '}';

describe('Authenticated CRM create dialogs have real accessible semantics', () => {
  it.each([lead, contact, customer])('%s shares semantic geometry, readable actions and inert background', path => {
    const s = read(path);
    expect(s).toContain('useDialogBackgroundInert');
    expect(s).toContain('const formId = useId();');
    expect(s).toContain('max-h-[var(--ds-form-dialog-max-height)]');
    expect(s).toContain('<Button type="submit" disabled={loading} size="lg"');
    expect(s).not.toContain('bg-gradient-to-br from-primary/10');
    expect(s).not.toContain('text-white font-black rounded-[var(--radius-panel)]');
  });

  it('binds every native Lead input and select to its visible label', () => {
    const s = read(lead);
    for (const key of ['company', 'contact', 'email', 'phone', 'interest']) {
      expect(s).toContain(idMarker('htmlFor', key));
      expect(s).toContain(idMarker('id', key));
    }
  });

  it('binds all Contact fields and the company selector', () => {
    const s = read(contact);
    for (const key of ['account', 'name', 'role', 'email', 'linkedin', 'mobile', 'landline']) {
      expect(s).toContain(idMarker('htmlFor', key));
      expect(s).toContain(idMarker('id', key));
    }
    expect(s).toContain('aria-label="Empresa"');
  });

  it('names Customer fields, the three selectors and add/remove tag actions', () => {
    const s = read(customer);
    for (const key of ['name', 'cnpj', 'ie', 'segment', 'type', 'status',
      'payment', 'tags', 'zip', 'street', 'number', 'neighborhood', 'city', 'state']) {
      expect(s).toContain(idMarker('htmlFor', key));
      expect(s).toContain(idMarker('id', key));
    }
    expect(s).toContain('<DialogDescription className="sr-only">');
    expect(s).toContain('aria-label="Adicionar tag"');
    expect(s).toContain('aria-label={');
    expect(s).toContain('Remover tag');
  });

  it('restores the previous inert state after closing any modal', () => {
    const hook = read('src/components/ui/useDialogBackgroundInert.ts');
    expect(hook).toContain("if (!open) return;");
    expect(hook).toContain('shell.inert = true;');
    expect(hook).toContain('shell.inert = previouslyInert;');
  });

  it('renders readable plain-language descriptions and stacks the contact modal header on mobile', () => {
    const leadSource = read(lead);
    const contactSource = read(contact);
    for (const source of [leadSource, contactSource]) {
      expect(source).toContain('className="ds-type-body text-muted-foreground mt-2 leading-relaxed"');
      expect(source).not.toContain('text-metadata-ui font-black uppercase tracking-[0.2em] mt-2');
    }
    expect(contactSource).toContain('flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between');
    expect(contactSource).toContain('w-full shrink-0 sm:w-auto');
  });

  it('login uses solid footer without overlapping decorative blur effects', () => {
    const s = read('src/app/login/page.tsx');
    expect(s).not.toContain('blur-[120px]');
    expect(s).toContain('relative z-10 mt-12 bg-background');
    const qa = read('test/e2e/run-authenticated-smoke.mjs');
    expect(qa).toContain('await page.waitForTimeout(450)');
    expect(qa).toContain('const modalAudit = await runAxe(page, source)');
  });

  it('centralizes real form geometry rather than creating route-local values', () => {
    const css = read('src/design-system/tokens.css');
    expect(css).toContain('--ds-form-dialog-max-height: 90dvh;');
    expect(css).toContain('--ds-form-dialog-gutter: 1.5rem;');
  });
});
