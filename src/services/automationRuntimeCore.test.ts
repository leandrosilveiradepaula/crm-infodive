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

    it('never plans disabled automations', () => {
        const automation = baseAutomation();
        automation.enabled = false;
        expect(planAutomation(automation, {
            type: 'deal_moved',
            organizationId: 'org-1',
            entityId: 'deal-1',
            data: { stage: 'won' },
        }).reason).toBe('automation_disabled');
    });
});
