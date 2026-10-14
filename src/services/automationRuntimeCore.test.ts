import { describe, expect, it } from 'vitest';
import type { Automation } from '../types/automation';
import {
    evaluateConditions,
    planAutomation,
    validateAutomationForRuntime,
} from './automationRuntimeCore';

const baseAutomation = (): Automation => ({
    id: 'automation-1',
    name: 'Criar tarefa ao ganhar',
    description: 'Teste',
    enabled: true,
    category: 'followup',
    trigger: { type: 'deal_moved', config: { stage: 'won' } },
    conditions: [],
    actions: [{ type: 'create_task', config: { title: 'Follow-up' } }],
    createdBy: 'test',
    createdAt: '2026-10-07T00:00:00Z',
    updatedAt: '2026-10-07T00:00:00Z',
    executionCount: 0,
    successCount: 0,
    failureCount: 0,
});

describe('automation runtime core', () => {
    it('plans a supported matching automation deterministically', () => {
        const automation = baseAutomation();
        const plan = planAutomation(automation, {
            eventId: 'event-1',
            type: 'deal_moved',
            organizationId: 'org-1',
            entityId: 'deal-1',
            data: { stage: 'won', value: 150000 },
        });

        expect(plan.matched).toBe(true);
        expect(plan.reason).toBe('matched');
        expect(plan.actions).toEqual(automation.actions);
    });

    it('fails closed for unsupported actions', () => {
        const automation = baseAutomation();
        automation.actions = [{ type: 'send_email', config: { title: 'x' } }];

        expect(validateAutomationForRuntime(automation)).toContain(
            'unsupported action[0]: send_email'
        );
        expect(planAutomation(automation, {
            eventId: 'event-2',
            type: 'deal_moved',
            organizationId: 'org-1',
            entityId: 'deal-1',
            data: { stage: 'won' },
        }).matched).toBe(false);
    });

    it('fails closed for unsupported delayed actions', () => {
        const automation = baseAutomation();
        automation.actions[0].delay = 15;
        expect(validateAutomationForRuntime(automation)).toContain(
            'unsupported delayed action[0]'
        );
    });

    it('requires the configured stage for deal_moved', () => {
        const automation = baseAutomation();
        const plan = planAutomation(automation, {
            eventId: 'event-1',
            type: 'deal_moved',
            organizationId: 'org-1',
            entityId: 'deal-1',
            data: { stage: 'proposal' },
        });
        expect(plan).toEqual({
            matched: false,
            reason: 'trigger_config_mismatch',
            actions: [],
        });
    });

    it('evaluates AND and OR conditions from event data', () => {
        expect(evaluateConditions([
            { field: 'value', operator: 'greater_than', value: 10000, logic: 'AND' },
            { field: 'stage', operator: 'equals', value: 'won', logic: 'AND' },
        ], { value: 20000, stage: 'won' })).toBe(true);

        expect(evaluateConditions([
            { field: 'stage', operator: 'equals', value: 'lost', logic: 'AND' },
            { field: 'value', operator: 'greater_than', value: 10000, logic: 'OR' },
        ], { value: 20000, stage: 'won' })).toBe(true);
    });

    it('rejects missing, empty and nonfinite numeric condition operands', () => {
        for (const actual of [undefined, null, '', '  ', NaN, Infinity, 'not-a-number']) {
            expect(evaluateConditions([{ field: 'value', operator: 'greater_than', value: -1, logic: 'AND' }], { value: actual })).toBe(false);
            expect(evaluateConditions([{ field: 'value', operator: 'less_than', value: 1, logic: 'AND' }], { value: actual })).toBe(false);
        }
        expect(evaluateConditions([{ field: 'value', operator: 'greater_than', value: '', logic: 'AND' }], { value: 5 })).toBe(false);
        expect(evaluateConditions([{ field: 'value', operator: 'greater_than', value: 0, logic: 'AND' }], { value: '2' })).toBe(true);
    });

    it('rejects empty substring conditions instead of matching everything', () => {
        for (const operator of ['contains', 'not_contains'] as const) {
            expect(evaluateConditions([{ field: 'title', operator, value: '', logic: 'AND' }], { title: 'deal' })).toBe(false);
            expect(evaluateConditions([{ field: 'title', operator, value: 'x', logic: 'AND' }], {})).toBe(false);
        }
        expect(evaluateConditions([{ field: 'title', operator: 'contains', value: 'deal', logic: 'AND' }], { title: 'new deal' })).toBe(true);
    });

    it('rejects missing fields for negative comparisons without blocking explicit empty checks', () => {
        for (const operator of ['equals', 'not_equals'] as const) {
            expect(evaluateConditions([{ field: 'missing', operator, value: 'x', logic: 'AND' }], {})).toBe(false);
            expect(evaluateConditions([{ field: 'missing', operator, value: undefined, logic: 'AND' }], {})).toBe(false);
        }
        expect(evaluateConditions([{ field: 'missing', operator: 'is_empty', value: null, logic: 'AND' }], {})).toBe(true);
        expect(evaluateConditions([{ field: 'nested.value', operator: 'equals', value: null, logic: 'AND' }], { nested: { value: null } })).toBe(true);
        expect(evaluateConditions([{ field: 'status', operator: 'not_equals', value: 'closed', logic: 'AND' }], { status: 'open' })).toBe(true);
    });

    it('rejects invalid rule paths, unsupported operators, and invalid delay values', () => {
        for (const field of ['__proto__.flag', 'constructor', 'nested..field', '']) {
            expect(evaluateConditions([{ field, operator: 'not_equals', value: 'x', logic: 'AND' }], { status: 'open' })).toBe(false);
        }
        const automation = baseAutomation();
        automation.conditions = [{ field: '__proto__.flag', operator: 'not_equals', value: 'x', logic: 'AND' }];
        expect(validateAutomationForRuntime(automation)).toContain('invalid conditions');
        automation.conditions = [];
        automation.actions[0].delay = Number.NaN;
        expect(validateAutomationForRuntime(automation)).toContain('invalid action delay[0]');
        automation.actions[0].delay = -1;
        expect(validateAutomationForRuntime(automation)).toContain('invalid action delay[0]');
    });

    it('never plans disabled automations', () => {
        const automation = baseAutomation();
        automation.enabled = false;
        expect(planAutomation(automation, {
            eventId: 'event-2',
            type: 'deal_moved',
            organizationId: 'org-1',
            entityId: 'deal-1',
            data: { stage: 'won' },
        }).reason).toBe('automation_disabled');
    });
});
