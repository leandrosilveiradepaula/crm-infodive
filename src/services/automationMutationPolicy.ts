import type { Automation } from '@/types/automation';
import { validateAutomationForRuntime } from './automationRuntimeCore';

export type WritableAutomation = Pick<Automation, 'name' | 'description' | 'category' | 'trigger' | 'conditions' | 'actions' | 'enabled'>;

export function sanitizeAutomationWrite(input: Partial<Automation>): Partial<WritableAutomation> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid automation');
    const result: Partial<WritableAutomation> = {};
    for (const key of ['name', 'description', 'category', 'trigger', 'conditions', 'actions', 'enabled'] as const) {
        if (Object.prototype.hasOwnProperty.call(input, key)) {
            (result as Record<string, unknown>)[key] = input[key];
        }
    }
    if (result.name !== undefined && (typeof result.name !== 'string' || !result.name.trim() || result.name.length > 160)) throw new Error('Invalid automation name');
    if (result.description !== undefined && (typeof result.description !== 'string' || result.description.length > 2000)) throw new Error('Invalid automation description');
    if (result.category !== undefined && !['followup', 'alert', 'welcome', 'reminder', 'escalation', 'celebration', 'custom'].includes(result.category)) throw new Error('Invalid automation category');
    if (result.enabled !== undefined && typeof result.enabled !== 'boolean') throw new Error('Invalid automation enablement');
    if (result.trigger !== undefined && (!result.trigger || typeof result.trigger !== 'object' || Array.isArray(result.trigger))) throw new Error('Invalid automation trigger');
    if (result.conditions !== undefined && !Array.isArray(result.conditions)) throw new Error('Invalid automation conditions');
    if (result.actions !== undefined && !Array.isArray(result.actions)) throw new Error('Invalid automation actions');
    return result;
}

export function assertSupportedAutomation(input: Pick<Automation, 'trigger' | 'conditions' | 'actions'>): void {
    const blockers = validateAutomationForRuntime(input as Automation);
    if (blockers.length) throw new Error('Unsupported automation configuration');
}
