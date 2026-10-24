import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { persistedContractText } from './contract-content';

describe('contract draft editor integration', () => {
    const page = readFileSync('src/app/(dashboard)/contracts/client-page.tsx','utf8');
    const editor = readFileSync('src/components/contracts/ContractDraftEditor.tsx','utf8');
    const actions = readFileSync('src/app/(dashboard)/contracts/actions.ts','utf8');

    it('exposes editing only for drafts and refreshes after confirmed save', () => {
        expect(page).toContain("contract.status === 'draft'");
        expect(page).toContain('onClick={() => handleEditDraft(contract)}');
        expect(page).toContain('onSaved={handleDraftSaved}');
        expect(page).toContain('router.refresh()');
        expect(page).toContain('Rascunho salvo.');
    });
    it('uses only persisted text and never invents document clauses', () => {
        expect(editor).toContain('persistedContractText(contract.content_json)');
        expect(persistedContractText({text:'Cláusula salva'})).toBe('Cláusula salva');
        expect(persistedContractText(null)).toBeNull();
        expect(editor).not.toContain('CONTRATADA: INFODIVE');
        expect(editor).not.toContain("status: 'signed'");
    });
    it('makes failures visible, prevents double submit and requires a revision', () => {
        expect(editor).toContain('inFlight.current');
        expect(editor).toContain('disabled={saving}');
        expect(editor).toContain('role="alert"');
        expect(editor).toContain('contract.updatedAt');
        expect(editor).toContain('saveContractDraft(contract.id, title, text, contract.updatedAt)');
    });
    it('persists only allowed draft fields under existing RBAC and deal scope', () => {
        const start=actions.indexOf('export async function saveContractDraft(');
        const end=actions.indexOf('export async function ',start+1);
        const body=actions.slice(start,end);
        expect(body).toContain("requirePermission('deals:edit')");
        expect(body).toContain('getAiDealScope(userId, organizationId)');
        expect(body).toContain("status: 'draft'");
        expect(body).toContain('expectedUpdatedAt');
        expect(body).toContain("revalidatePath('/contracts')");
        expect(body).not.toContain('signature_image');
    });
});
