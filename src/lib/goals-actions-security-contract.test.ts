import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/app/(dashboard)/goals/actions.ts', 'utf8');
function action(name: string) {
    const start = source.indexOf('export async function ' + name + '(');
    expect(start).toBeGreaterThanOrEqual(0);
    const next = source.indexOf('export async function ', start + 1);
    return source.slice(start, next < 0 ? undefined : next);
}

describe('legacy goals actions fail-closed contracts', () => {
    it('delegates campaign CRUD to a single hardened canonical path', () => {
        for (const [actionName, implementation] of [
            ['getCampaigns', 'readCanonicalCampaigns()'],
            ['createCampaign', 'createCanonicalCampaign(campaign)'],
            ['updateCampaign', 'updateCanonicalCampaign(id, updates)'],
            ['deleteCampaign', 'deleteCanonicalCampaign(id)'],
        ]) {
            expect(action(actionName)).toContain(implementation);
            expect(action(actionName)).not.toContain("from('campaigns')");
        }
    });

    it('never writes identity or role fields through the legacy goal action', () => {
        const update = action('updateUserGoals');
        expect(update).toContain('sanitizeGoalWrite(data)');
        expect(update).toContain(".eq('organization_id', organizationId)");
        expect(update).toContain(".select('id')");
        expect(update).toContain('.maybeSingle()');
        expect(update).toContain('error || !changed');
        expect(update).not.toContain('.update(data)');
    });

    it('keeps personal scenarios scoped to authenticated owner', () => {
        for (const name of ['getScenarios', 'deleteScenario', 'applyScenarioToGoals']) {
            const body = action(name);
            expect(body).toContain(".eq('user_id', userId)");
            expect(body).toContain(".eq('organization_id', organizationId)");
        }
        expect(action('saveScenario')).toContain('sanitizeScenarioWrite(scenario)');
        expect(action('saveScenario')).toContain('user_id: userId');
        expect(action('deleteScenario')).toContain('error || !data');
    });

    it('preflights distribution and never claims all profiles updated when rows are missing', () => {
        const body = action('applyScenarioToGoals');
        expect(body).toContain('validateGoalDistribution(');
        expect(body).toContain('totalRowsAffected !== users.length');
        expect(body).not.toContain('Math.abs(customWeights.reduce(');
        expect(body).not.toContain('useCustomWeights');
    });
    it('does not turn a read error into a fabricated empty user list', () => {
        const body = action('getUsersWithGoals');
        expect(body).toContain('throw new Error(');
        expect(body).not.toContain('return [];');
    });
});
