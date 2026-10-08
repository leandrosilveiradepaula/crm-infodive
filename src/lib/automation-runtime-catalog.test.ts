import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('automation runtime catalog', () => {
    it('does not offer triggers that the runtime core rejects', () => {
        const modal = readFileSync('src/components/automations/NewAutomationModal.tsx', 'utf8');
        const options = readFileSync('src/data/automations/automationOptions.tsx', 'utf8');
        for (const unsupported of [
            'proposal_sent',
            'deal_stagnant',
            'activity_created',
            'time_based',
            'field_updated',
            'proposal_not_viewed',
        ]) {
            expect(modal).not.toContain(`id: '${unsupported}'`);
            expect(options).not.toContain(`id: '${unsupported}'`);
        }
        expect(options).toContain("id: 'deal_created'");
        expect(options).toContain("id: 'deal_moved'");
    });

    it('does not offer actions without a runtime adapter', () => {
        const modal = readFileSync('src/components/automations/NewAutomationModal.tsx', 'utf8');
        const options = readFileSync('src/data/automations/automationOptions.tsx', 'utf8');
        for (const unsupported of [
            'send_email',
            'send_notification',
            'move_deal',
            'update_field',
            'assign_to',
        ]) {
            expect(modal).not.toContain(`id: '${unsupported}'`);
            expect(options).not.toContain(`id: '${unsupported}'`);
        }
        expect(modal).toContain("id: 'create_task'");
        expect(options).toContain("id: 'create_task'");
    });
});
