import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sidebar = readFileSync(resolve(process.cwd(), 'src/components/layout/Sidebar.tsx'), 'utf8');
const header = readFileSync(resolve(process.cwd(), 'src/components/layout/Header.tsx'), 'utf8');

describe('dashboard navigation information architecture', () => {
    it('uses an icon rail and a contextual area navigation instead of a flat module list', () => {
        expect(sidebar).toContain('aria-label="Áreas principais"');
        expect(sidebar).toContain('Navegação de ${activeArea.label}');
        for (const area of ['Comercial', 'Relacionamento', 'Receita', 'Operação', 'Análises', 'Administração']) expect(sidebar).toContain(`label: '${area}'`);
    });

    it('keeps existing product routes reachable while excluding the internal design catalog', () => {
        for (const route of ['/pipeline', '/leads', '/customers', '/contacts', '/activities', '/contracts', '/sales', '/inbox', '/automations', '/reports', '/settings', '/integrations']) expect(sidebar).toContain(`href: '${route}'`);
        expect(sidebar).not.toContain("href: '/design-preview'");
    });

    it('keeps the global header as compact utility chrome with named icon controls', () => {
        expect(header).toContain('aria-label="Alternar tema"');
        expect(header).not.toContain('👋');
    });
});
