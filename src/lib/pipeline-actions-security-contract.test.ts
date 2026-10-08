import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('pipeline server action security contract', () => {
    it('requires the dedicated change-owner permission when owner_id is present', () => {
        const source = readFileSync('src/app/(dashboard)/pipeline/actions.ts', 'utf8');
        const updateDealStart = source.indexOf('export async function updateDeal(');
        const nextAction = source.indexOf('export async function duplicateDealEntry', updateDealStart);
        const updateDealSource = source.slice(updateDealStart, nextAction);

        expect(updateDealStart).toBeGreaterThanOrEqual(0);
        expect(updateDealSource).toContain("Object.prototype.hasOwnProperty.call(updates, 'owner_id')");
        expect(updateDealSource).toContain("changesOwner ? 'deals:change_owner' : 'deals:edit'");
        expect(updateDealSource).toContain('DealService.updateDeal(userId, dealId, organizationId, updates)');
    });
});
