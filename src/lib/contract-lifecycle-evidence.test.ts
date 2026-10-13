import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { validatePersistedDraftText } from './contract-content';

describe('contract lifecycle boundaries', () => {
    it('requires bounded plain-text draft content', () => {
        expect(() => validatePersistedDraftText({text:'Termos aprovados'})).not.toThrow();
        for (const payload of [null, [], {text:''}, {text:'   '}, {html:'<p>bad</p>'}, {text:'A',html:'bad'}, {text:'X'.repeat(100001)}]) {
            expect(() => validatePersistedDraftText(payload)).toThrow();
        }
    });
    it('allows only draft writes and checks row status during update and delete', () => {
        const s=readFileSync('src/services/ContractService.ts','utf8');
        expect(s).toContain("contract.status !== 'draft'");
        expect(s).toContain("if (data.status !== 'draft')");
        expect(s).toContain(".update(fields).eq('id', id).eq('organization_id', organizationId).eq('status', 'draft')");
        expect(s).toContain(".delete().eq('id', id).eq('organization_id', organizationId).eq('status', 'draft')");
    });
    it('does not claim that statuses or financial sums prove successful delivery or signature', () => {
        const ui=readFileSync('src/app/(dashboard)/contracts/client-page.tsx','utf8');
        expect(ui).toContain('Marcados como assinados');
        expect(ui).toContain('Status legado, sem confirmação de envio');
        expect(ui).toContain('Sem evidência verificada de assinatura');
        expect(ui).not.toContain('Gerencie, envie e assine contratos digitalmente.');
    });
    it('does not invent preapproved contractual clauses in the editor', () => {
        const editor=readFileSync('src/components/contracts/ContractBuilder.tsx','utf8');
        expect(editor).toContain("persistedContractText(contract?.content_json) ?? ''");
        expect(editor).not.toContain('Este contrato entra em vigor na data de sua assinatura');
        expect(editor).toContain('Rascunho de contrato');
    });
});
