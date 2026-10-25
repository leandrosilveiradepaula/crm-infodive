import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('contracts touch, keyboard and creation feedback', () => {
    const page=readFileSync('src/app/(dashboard)/contracts/client-page.tsx','utf8');

    it('keeps actions visible without hover and visible with keyboard focus', () => {
        expect(page).toContain('opacity-100 md:opacity-70 md:group-hover:opacity-100 md:group-focus-within:opacity-100');
        expect(page).toContain('focus-visible:ring-2');
        expect(page).not.toContain('opacity-0 group-hover:opacity-100');
    });
    it('makes contract title and controls real accessible buttons', () => {
        expect(page).toContain('aria-label={`Visualizar contrato: ${contract.title}`}');
        expect(page).toContain('aria-label={`Editar rascunho: ${contract.title}`}');
        expect(page).toContain('type="button" className="text-left text-sm');
    });
    it('does not duplicate submissions before React finishes its state update', () => {
        expect(page).toContain('creatingLock.current = true');
        expect(page).toContain('if (creatingLock.current) return');
        expect(page).toContain('creatingLock.current = false');
        expect(page).toContain('aria-busy={isCreating}');
    });
    it('distinguishes true empty contracts from empty filter results', () => {
        expect(page).toContain("'Nenhum contrato cadastrado'");
        expect(page).toContain("'Nenhum resultado para os filtros'");
        expect(page).toContain("contracts.length === 0 && creationOptions === null && !isCreating");
    });
    it('preserves seller scope and draft-only edit affordances', () => {
        expect(page).toContain('getContractCreationDeals()');
        expect(page).toContain("contract.status === 'draft'");
        expect(page).toContain("if (!res.success) throw");
    });
});
