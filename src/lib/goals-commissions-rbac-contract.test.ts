import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';

const canonical = readFileSync('src/app/(dashboard)/goals-commissions/actions.ts', 'utf8');
const legacy = readFileSync('src/app/(dashboard)/goals/actions.ts', 'utf8');
function action(source: string, name: string) {
    const start = source.indexOf('export async function ' + name + '(');
    expect(start).toBeGreaterThanOrEqual(0);
    const next = source.indexOf('export async function ', start + 1);
    return source.slice(start, next < 0 ? undefined : next);
}
describe('goals and commissions privileged boundary contract', () => {
    it('scopes team goals and paid commissions based on owner visibility', () => {
        for (const name of ['getUsersWithGoals', 'getCommissionDeals']) {
            const body = action(canonical, name);
            expect(body).toContain("requirePermission('deals:edit')");
            expect(body).toContain('getAiDealScope(userId, organizationId)');
            expect(body).toContain('if (!canViewAll) query = query.eq(');
            expect(body).toContain(".eq('organization_id', organizationId)");
        }
    });
    it('limits financial/team mutations to existing privileged roles', () => {
        for (const name of ['updateUserGoals','createCampaign','updateCampaign','deleteCampaign']) {
            expect(action(canonical,name)).toContain("requirePermission('deals:view_all')");
        }
        expect(action(canonical,'updateDealCommissionStatus'))
            .toContain("requirePermission('settings:manage_users')");
        expect(action(legacy,'updateUserGoals'))
            .toContain("requirePermission('deals:view_all')");
        expect(action(legacy,'applyScenarioToGoals'))
            .toContain("requirePermission('deals:view_all')");
    });
    it('does not permit profile identity or role fields in goals writes', () => {
        for (const source of [canonical,legacy]) {
            const body = action(source,'updateUserGoals');
            expect(body).toContain('sanitizeGoalWrite(data)');
            expect(body).not.toContain('.update(data)');
            expect(body).toContain(".eq('organization_id', organizationId)");
            expect(body).toContain('.maybeSingle()');
        }
    });
    it('requires own scenarios and sanitizes payloads', () => {
        const read = action(canonical,'getScenarios');
        expect(read).toContain('requestedUserId !== userId');
        expect(read).toContain(".eq('user_id', userId)");
        const save = action(canonical,'saveScenario');
        expect(save).toContain('sanitizeScenarioWrite(scenario)');
        expect(save).toContain('user_id: userId');
        const del = action(canonical,'deleteScenario');
        expect(del).toContain(".eq('user_id', userId)");
        expect(del).toContain(".select('id')");
    });
    it('keeps payment mutations tenant-bound and requiring row receipts', () => {
        const body = action(canonical,'updateDealCommissionStatus');
        expect(body).toContain('sanitizeCommissionPayment(updates)');
        expect(body).toContain(".eq('organization_id', organizationId)");
        expect(body).toContain(".eq('stage', 'won')");
        expect(body).toContain('error || !data');
    });
});
