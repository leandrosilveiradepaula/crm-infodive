import type { Action, Automation, Condition, TriggerType } from '../types/automation';

export type AutomationRuntimeEvent = {
    eventId: string;
    type: 'deal_created' | 'deal_moved';
    organizationId: string;
    entityId: string;
    data: Record<string, unknown>;
};

export type AutomationPlan = {
    matched: boolean;
    reason: string;
    actions: Action[];
};

export const SUPPORTED_RUNTIME_TRIGGERS: ReadonlySet<TriggerType> = new Set([
    'deal_created',
    'deal_moved',
]);

export const SUPPORTED_RUNTIME_ACTIONS: ReadonlySet<Action['type']> = new Set([
    'create_task',
]);

function readField(data: Record<string, unknown>, field: string): unknown {
    return field.split('.').reduce<unknown>((value, part) => {
        if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
        if (!Object.prototype.hasOwnProperty.call(value, part)) return undefined;
        return (value as Record<string, unknown>)[part];
    }, data);
}

function finiteNumber(value: unknown): number | null {
    if (typeof value === 'number') return Number.isFinite(value) ? value : null;
    if (typeof value !== 'string' || !value.trim()) return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
}

const validOperators = new Set(['equals','not_equals','contains','not_contains','greater_than','less_than','is_empty','is_not_empty']);
function validField(field: unknown): field is string {
    return typeof field === 'string' && /^[a-zA-Z_][a-zA-Z0-9_]*(\\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(field)
        && !field.split('.').some(part => ['__proto__', 'prototype', 'constructor'].includes(part));
}
function compare(condition: Condition, actual: unknown): boolean {
    if (actual === undefined && condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty') return false;
    if (condition.value === undefined && condition.operator !== 'is_empty' && condition.operator !== 'is_not_empty') return false;
    switch (condition.operator) {
        case 'equals':
            return actual === condition.value;
        case 'not_equals':
            return actual !== condition.value;
        case 'contains':
        case 'not_contains': {
            if (typeof condition.value !== 'string' || !condition.value.trim()) return false;
            if (typeof actual !== 'string' && !Array.isArray(actual)) return false;
            const contained = typeof actual === 'string'
                ? actual.includes(condition.value)
                : actual.includes(condition.value);
            return condition.operator === 'contains' ? contained : !contained;
        }
        case 'greater_than':
        case 'less_than': {
            const left = finiteNumber(actual);
            const right = finiteNumber(condition.value);
            if (left === null || right === null) return false;
            return condition.operator === 'greater_than' ? left > right : left < right;
        }
        case 'is_empty':
            return actual === null || actual === undefined || actual === '' ||
                (Array.isArray(actual) && actual.length === 0);
        case 'is_not_empty':
            return !(actual === null || actual === undefined || actual === '' ||
                (Array.isArray(actual) && actual.length === 0));
        default:
            return false;
    }
}

export function evaluateConditions(
    conditions: Condition[],
    data: Record<string, unknown>
): boolean {
    if (!Array.isArray(conditions)) return false;
    if (!conditions.length) return true;
    if (conditions.some(condition => !condition || !validField(condition.field) || !validOperators.has(condition.operator) || !['AND', 'OR'].includes(condition.logic))) return false;

    let result = compare(conditions[0], readField(data, conditions[0].field));
    for (let index = 1; index < conditions.length; index += 1) {
        const condition = conditions[index];
        const current = compare(condition, readField(data, condition.field));
        result = condition.logic === 'OR' ? result || current : result && current;
    }
    return result;
}

export function validateAutomationForRuntime(automation: Automation): string[] {
    const blockers: string[] = [];

    if (!automation.trigger || !SUPPORTED_RUNTIME_TRIGGERS.has(automation.trigger.type)) {
        blockers.push('missing or unsupported trigger');
        return blockers;
    }
    if (!Array.isArray(automation.conditions) || automation.conditions.some(condition => !condition || !validField(condition.field) || !validOperators.has(condition.operator) || !['AND', 'OR'].includes(condition.logic))) blockers.push('invalid conditions');
    if (!Array.isArray(automation.actions)) {
        blockers.push('invalid actions');
        return blockers;
    }
    if (!automation.actions.length) {
        blockers.push('automation has no actions');
    }

    automation.actions.forEach((action, index) => {
        if (!action || !SUPPORTED_RUNTIME_ACTIONS.has(action.type)) {
            blockers.push(`unsupported action[${index}]`);
            return;
        }
        if (!action.config || typeof action.config !== 'object' || Array.isArray(action.config)) blockers.push(`invalid action config[${index}]`);
        if (action.delay !== undefined && (typeof action.delay !== 'number' || !Number.isFinite(action.delay) || action.delay < 0)) blockers.push(`invalid action delay[${index}]`);
        if ((action.delay || 0) > 0) {
            blockers.push(`unsupported delayed action[${index}]`);
        }
    });

    return blockers;
}

export function planAutomation(
    automation: Automation,
    event: AutomationRuntimeEvent
): AutomationPlan {
    if (!automation.enabled) {
        return { matched: false, reason: 'automation_disabled', actions: [] };
    }

    const blockers = validateAutomationForRuntime(automation);
    if (blockers.length) {
        return {
            matched: false,
            reason: `unsupported_definition: ${blockers.join('; ')}`,
            actions: [],
        };
    }

    if (automation.trigger.type !== event.type) {
        return { matched: false, reason: 'trigger_type_mismatch', actions: [] };
    }

    if (event.type === 'deal_moved') {
        const requiredStage = automation.trigger.config.stage;
        if (requiredStage && event.data.stage !== requiredStage) {
            return { matched: false, reason: 'trigger_config_mismatch', actions: [] };
        }
    }

    if (!evaluateConditions(automation.conditions || [], event.data)) {
        return { matched: false, reason: 'conditions_not_met', actions: [] };
    }

    return {
        matched: true,
        reason: 'matched',
        actions: automation.actions,
    };
}
