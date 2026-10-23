import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import { analyzeDeal } from './gemini';
import type { Deal } from '@/types/deal';

const deal = { id: '9f4f40eb-5102-4afc-8f3e-d4656a8fae9b' } as Deal;
const valid = {
    status: 'at_risk', healthScore: 42, trend: 'declining',
    riskFactors: ['Sem avanço'], insights: ['Atividades ausentes'],
    recommendations: ['Revisar pipeline'], nextSteps: ['Contatar decisor'],
} as const;
const fetchMock = vi.fn();

describe('AI deal diagnosis product truthfulness', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });
    afterEach(() => vi.unstubAllGlobals());

    it('sends only the ID required by the authoritative tenant-scoped endpoint', async () => {
        fetchMock.mockResolvedValue({ ok: true, json: async () => valid });
        await expect(analyzeDeal(deal)).resolves.toEqual(valid);
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url, request] = fetchMock.mock.calls[0];
        expect(url).toBe('/api/gemini/analyze-deal');
        expect(request.method).toBe('POST');
        expect(request.headers).toEqual({ 'Content-Type': 'application/json' });
        expect(JSON.parse(request.body)).toEqual({ deal: { id: deal.id } });
    });

    it('does not fabricate scores when the server refuses the request', async () => {
        fetchMock.mockResolvedValue({
            ok: false, status: 400, json: async () => ({ error: 'private server error' }),
        });
        await expect(analyzeDeal(deal)).rejects.toThrow('Não foi possível concluir o diagnóstico.');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('does not create offline scores when network access fails', async () => {
        fetchMock.mockRejectedValue(new Error('private network error'));
        await expect(analyzeDeal(deal)).rejects.toThrow('Não foi possível concluir o diagnóstico.');
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('rejects malformed JSON and invalid or fabricated diagnoses', async () => {
        const examples = [
            { ok: true, json: async () => { throw new SyntaxError('broken json'); } },
            { ok: true, json: async () => ({ ...valid, healthScore: 0 }) },
            { ok: true, json: async () => ({ ...valid, healthScore: 101 }) },
            { ok: true, json: async () => ({ ...valid, status: 'guaranteed' }) },
            { ok: true, json: async () => ({ message: 'no diagnosis' }) },
        ];
        for (const result of examples) {
            fetchMock.mockReset().mockResolvedValue(result);
            await expect(analyzeDeal(deal)).rejects.toThrow('análise inválida');
        }
    });

    it('keeps display and customer state updates behind confirmed analysis', () => {
        const doctor = readFileSync('src/components/pipeline/ai/DealDoctorFinal.tsx', 'utf8');
        const modal = readFileSync('src/components/pipeline/ViewDealModal.tsx', 'utf8');
        const client = readFileSync('src/lib/gemini.ts', 'utf8');
        expect(doctor).toContain('if (!analysis && !loading && !error)');
        expect(doctor).toContain('onAnalysisComplete?.(result)');
        expect(doctor).toContain('setAnalysis(null);');
        expect(doctor).not.toContain("console.log('[DealDoctorFinal]");
        expect(modal).not.toContain("console.log('[ViewDealModal-Sidebar]");
        expect(client).not.toContain('const healthScore = status ===');
        expect(client).toContain('parseDealDiagnosis(result)');
    });
});
