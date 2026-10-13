import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

describe('contract creation and read integrity', () => {
    const actions = readFileSync('src/app/(dashboard)/contracts/actions.ts', 'utf8');
    const client = readFileSync('src/app/(dashboard)/contracts/client-page.tsx', 'utf8');
    const service = readFileSync('src/services/ContractService.ts', 'utf8');

    it('does not show a fake empty state when a tenant-scoped contract read fails', () => {
        expect(actions).toContain("throw new Error('Não foi possível carregar os contratos.");
        expect(actions).not.toMatch(/contracts fetch failed'\);\s*return \[\]/);
    });
    it('derives seller deal choices from authenticated server-side identity', () => {
        expect(actions).toContain("requirePermission('deals:edit')");
        expect(actions).toContain('getOwnedContractDealOptions(organizationId, userId)');
        expect(actions).toContain('requiresDeal: true');
        expect(service).toContain(".eq('owner_id', ownerId)");
    });
    it('collects the mandatory seller deal reference rather than posting unlinked contracts', () => {
        expect(client).toContain('getContractCreationDeals()');
        expect(client).toContain("dealId: selected?.id");
        expect(client).toContain('Selecione uma oportunidade para este contrato.');
        expect(client).toContain('Não existem oportunidades autorizadas para vincular ao contrato.');
    });
    it('surfaces save failures and synchronizes server-refreshed contracts', () => {
        expect(client).toContain('role="alert"');
        expect(client).toContain('const contracts = initialContracts;');
        expect(client).toContain("if (!res.success) throw");
    });
    it('does not expose unverified signature creation', () => {
        expect(client).not.toContain('handleSignContract');
        expect(client).not.toContain('SignatureModal');
        expect(client).not.toContain('title="Assinar"');
        expect(client).toContain('Assinado (não verificado)');
    });
    it('does not expose a fake downloadable PDF action', () => {
        expect(client).toContain('PDF indisponível: documento ainda não gerado');
        expect(client).toContain("actionLabel: 'Novo Contrato'");
        expect(client).toContain('contracts.length === 0 && creationOptions === null && !isCreating');
    });
});
