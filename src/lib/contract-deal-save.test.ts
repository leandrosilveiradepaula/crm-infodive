import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { normalizeContractDraftInput } from './contract-draft-input';

describe('deal contract draft safety', () => {
    it('normalizes title and company without rewriting authored contract text', () => {
        const actual=normalizeContractDraftInput({title:' Contrato A ',company:' Cliente B ',text:'  Parágrafo aprovado  '});
        expect(actual).toEqual({title:'Contrato A',company:'Cliente B',content_json:{text:'  Parágrafo aprovado  '}});
    });
    it('rejects empty, malformed and oversized fields before attempting a write', () => {
        const valid={title:'Contrato',company:'Cliente',text:'Conteúdo aprovado'};
        for (const invalid of [
            {...valid,title:' '},{...valid,title:'X'.repeat(501)},
            {...valid,company:''},{...valid,company:'X'.repeat(501)},
            {...valid,text:' '},{...valid,text:'X'.repeat(100001)},
            {...valid,title:null},{...valid,company:3},{...valid,text:{}},
        ]) expect(() => normalizeContractDraftInput(invalid)).toThrow();
    });
    it('locks in-flight submissions and surfaces failures inside the editor', () => {
        const builder=readFileSync('src/components/contracts/ContractBuilder.tsx','utf8');
        expect(builder).toContain('inFlight.current');
        expect(builder).toContain('disabled={saving}');
        expect(builder).toContain('role="alert"');
        expect(builder).toContain('normalizeContractDraftInput({ title, company, text: content })');
        expect(builder).toContain("if (!confirmed) setSaveError(");
    });
    it('never claims electronic signature or submits simulated signature evidence', () => {
        const view=readFileSync('src/components/pipeline/ViewDealModal.tsx','utf8');
        expect(view).not.toContain("'Contrato assinado e salvo com sucesso.'");
        expect(view).toContain("status: 'draft'");
        expect(view).not.toContain('signature_image: signature || contract.signature_image');
        expect(view).toContain('if (!result.success)');
        expect(view).toContain('return false;');
        expect(view).toContain('router.refresh()');
    });
    it('supports explicit company input for legacy opportunities without company names', () => {
        const builder=readFileSync('src/components/contracts/ContractBuilder.tsx','utf8');
        expect(builder).toContain('setCompany(e.target.value)');
        expect(builder).toContain('Empresa contratante');
        expect(builder).toContain('aria-label="Conteúdo do rascunho"');
        expect(builder).toContain('aria-label="Título do rascunho"');
    });
});
