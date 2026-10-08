import { describe, expect, it } from 'vitest';
import { sanitizeAutomationWrite, assertSupportedAutomation } from './automationMutationPolicy';

describe('automation mutation policy', () => {
    const supported = {
        trigger: { type: 'deal_created' as const, config: {} },
        conditions: [],
        actions: [{ type: 'create_task' as const, config: { title: 'Follow up' } }],
    };

    it('keeps only user-writable fields, never identity, tenant, or statistics', () => {
        const data = sanitizeAutomationWrite({
            name: 'Follow-up', enabled: false, ...supported,
            id: 'forged', organization_id: 'forged', execution_count: 999,
            success_count: 999, created_at: 'forged', createdBy: 'forged',
        } as unknown as Parameters<typeof sanitizeAutomationWrite>[0]);
        expect(data.name).toBe('Follow-up');
        expect(data).not.toHaveProperty('id');
        expect(data).not.toHaveProperty('organization_id');
        expect(data).not.toHaveProperty('execution_count');
        expect(data).not.toHaveProperty('created_at');
        expect(data).not.toHaveProperty('createdBy');
    });

    it('blocks invalid writable input and unsupported runtime config', () => {
        expect(() => sanitizeAutomationWrite({ name: '   ' })).toThrow();
        expect(() => sanitizeAutomationWrite({ enabled: 'true' as unknown as boolean })).toThrow();
        expect(() => sanitizeAutomationWrite({ actions: {} as unknown as Parameters<typeof sanitizeAutomationWrite>[0]['actions'] })).toThrow();
        expect(() => assertSupportedAutomation(supported)).not.toThrow();
        expect(() => assertSupportedAutomation({ ...supported, actions: [{ type: 'send_email', config: {} }] } as Parameters<typeof assertSupportedAutomation>[0])).toThrow();
        expect(() => assertSupportedAutomation({ ...supported, trigger: { type: 'time_based', config: {} } } as Parameters<typeof assertSupportedAutomation>[0])).toThrow();
    });
});
