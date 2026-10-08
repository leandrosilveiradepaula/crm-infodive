import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/app/(dashboard)/goals-commissions/actions.ts', 'utf8');

function bodyOf(name: string): string {
    const start = source.indexOf('export async function ' + name + '(');
    expect(start).toBeGreaterThanOrEqual(0);
    const next = source.indexOf('export async function ', start + 1);
    return source.slice(start, next === -1 ? undefined : next);
}

describe('goals and commission server integrity contracts', () => {
    it('does not hide a failing read as an empty valid dataset', () => {
        for (const name of ['getUsersWithGoals', 'getCampaigns', 'getScenarios', 'getCommissionDeals']) {
            const body = bodyOf(name);
            expect(body).toContain("requireSessionContext()");
            expect(body).not.toContain('if (error) return []');
            expect(body).toContain('throw new Error(');
            expect(body).toContain(".eq('organization_id', organizationId)");
        }
    });

    it('whitelists campaign writes before database operations', () => {
        for (const name of ['createCampaign', 'updateCampaign']) {
            const body = bodyOf(name);
            expect(body).toContain('sanitizeCampaignWrite(');
            expect(body).toContain('organizationId');
        }
        expect(bodyOf('createCampaign')).toContain('organization_id: organizationId');
    });

    it('requires affected tenant row evidence for updates and deletes', () => {
        for (const name of ['updateCampaign', 'deleteCampaign', 'deleteScenario', 'updateDealCommissionStatus']) {
            const body = bodyOf(name);
            expect(body).toContain(".eq('organization_id', organizationId)");
            expect(body).toContain(".select('id')");
            expect(body).toContain('.maybeSingle()');
            expect(body).toContain('error || !data');
        }
    });

    it('only writes normalized commission fields to won deals', () => {
        const body = bodyOf('updateDealCommissionStatus');
        expect(body).toContain('sanitizeCommissionPayment(updates)');
        expect(body).toContain(".eq('stage', 'won')");
        expect(body).toContain('.update(fields)');
        expect(body).not.toContain('.update(updates)');
    });
});
