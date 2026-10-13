import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { persistedContractText } from './contract-content';

describe('truthful contract document presentation', () => {
    it('renders only non-empty persisted text, never object injection or generated clauses', () => {
        expect(persistedContractText({text:'Cláusula aprovada'})).toBe('Cláusula aprovada');
        expect(persistedContractText({text:'  '})).toBeNull();
        expect(persistedContractText({html:'<script>alert(1)</script>'})).toBeNull();
        expect(persistedContractText(null)).toBeNull();
    });
    it('does not present fake parties, signatures, timestamp, PDF or terms links', () => {
        const viewer=readFileSync('src/components/contracts/ContractViewer.tsx','utf8');
        for (const fake of ['NEXUS TECNOLOGIA LTDA','João Silva','new Date().toLocaleDateString()', 'Assinar Documento','title="Baixar"','title="Imprimir"']) {
            expect(viewer).not.toContain(fake);
        }
        expect(viewer).toContain('persistedContractText(contract.content_json)');
        expect(viewer).toContain('não foram verificadas pelo CRM');
    });
    it('keeps draft editor separate from electronic signature evidence', () => {
        const builder=readFileSync('src/components/contracts/ContractBuilder.tsx','utf8');
        expect(builder).not.toContain('Assinatura Digital Validada');
        expect(builder).not.toContain("status: 'signed'");
        expect(builder).not.toContain('SignaturePad');
        expect(builder).toContain('Salvar Rascunho');
    });
});
