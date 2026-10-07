import type { Action, Automation, Condition, TriggerType } from '@/types/automation';

export type AutomationRuntimeEvent = {
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
        return (value as Record<string, unknown>)[part];
    }, data);
}

function compare(condition: Condition, actual: unknown): boolean {
    switch (condition.operator) {
        case 'equals':
            return actual === condition.value;
        case 'not_equals':
            return actual !== condition.value;
        case 'contains':
            return typeof actual === 'string'
                ? actual.includes(String(condition.value ?? ''))
                : Array.isArray(actual) && actual.includes(condition.value);
        case 'not_contains':
            return typeof actual === 'string'
                ? !actual.includes(String(condition.value ?? ''))
                : Array.isArray(actual) && !actual.includes(condition.value);
        case 'greater_than':
            return Number(actual) > Number(condition.value);
        case 'less_than':
            return Number(actual) < Number(condition.value);
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
    if (!conditions.length) return true;

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

    if (!SUPPORTED_RUNTIME_TRIGGERS.has(automation.trigger.type)) {
        blockers.push(`unsupported trigger: ${automation.trigger.type}`);
    }

    if (!automation.actions.length) {
        blockers.push('automation has no actions');
    }

    automation.actions.forEach((action, index) => {
        if (!SUPPORTED_RUNTIME_ACTIONS.has(action.type)) {
            blockers.push(`unsupported action[${index}]: ${action.type}`);
        }
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
