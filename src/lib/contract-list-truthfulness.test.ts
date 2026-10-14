import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('contracts list truthful feedback and statuses', () => {
    const page = readFileSync('src/app/(dashboard)/contracts/client-page.tsx','utf8');

    it('confirms persisted create success visibly and never after an unsuccessful server response', () => {
        const begin = page.indexOf('const res = await createContract(');
        const success = page.indexOf("setSaveFeedback('Rascunho criado e salvo.", begin);
        const check = page.indexOf("if (!res.success) throw", begin);
        expect(begin).toBeGreaterThanOrEqual(0);
        expect(check).toBeGreaterThan(begin);
        expect(success).toBeGreaterThan(check);
        expect(page).toContain('router.refresh()');
        expect(page).toContain('role="status"');
    });
    it('clears stale form values after cancel and confirmed creation', () => {
        expect(page).toContain('const resetCreationForm = () =>');
        expect(page).toContain("setChosenDeal('')");
        expect(page).toContain("setDraftCompany('')");
        expect(page).toContain("setDraftTitle('')");
        expect(page).toContain('onClick={resetCreationForm}');
        expect(page).toContain('resetCreationForm();');
    });
    it('never presents legacy signed statuses as green verified successes', () => {
        expect(page).toContain("case 'signed': return 'Assinado (não verificado)'");
        expect(page).toContain("case 'signed': return 'bg-amber-500/10");
        expect(page).toContain("icon: AlertTriangle");
        expect(page).not.toContain("case 'signed': return 'bg-success");
        expect(page).not.toContain("contract.status === 'signed' && <CheckCircle2");
    });
    it('distinguishes contract types and invalid dates without inventing dates', () => {
        expect(page).toContain("case 'service': return 'Prestação de serviços'");
        expect(page).toContain("case 'nda': return 'Confidencialidade'");
        expect(page).toContain("case 'sales': return 'Vendas'");
        expect(page).toContain("'Data não disponível'");
        expect(page).toContain("timeZone: 'UTC'");
        expect(page).toContain('formatCreatedDate(contract.createdAt)');
    });
    it('does not imply full row clickability without an actual click handler', () => {
        expect(page).not.toContain('cursor-pointer border-l-2');
        expect(page).toContain('onClick={() => handleViewContract(contract)}');
        expect(page).toContain('aria-label={`Editar rascunho: ${contract.title}`}');
    });
});
