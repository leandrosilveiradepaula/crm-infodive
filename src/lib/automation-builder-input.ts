import type { Condition, ConditionOperator, LogicOperator, TriggerType } from '@/types/automation';

export const CONDITION_OPERATORS: readonly ConditionOperator[] = [
    'equals',
    'not_equals',
    'contains',
    'not_contains',
    'greater_than',
    'less_than',
    'is_empty',
    'is_not_empty',
];

export const VALUELESS_CONDITION_OPERATORS = new Set<ConditionOperator>([
    'is_empty',
    'is_not_empty',
]);

const NUMERIC_CONDITION_OPERATORS = new Set<ConditionOperator>([
    'greater_than',
    'less_than',
]);

const STRING_CONDITION_OPERATORS = new Set<ConditionOperator>([
    'contains',
    'not_contains',
]);

export interface ConditionDraft {
    field: unknown;
    operator: unknown;
    value?: unknown;
    logic: unknown;
    /** Used for equals/not_equals so textual '0' stays distinct from numeric 0. */
    valueKind?: 'text' | 'number';
}

export function isSafeConditionField(field: unknown): field is string {
    if (typeof field !== 'string') return false;

    const normalized = field.trim();
    return /^[a-zA-Z_][a-zA-Z0-9_]*(\.[a-zA-Z_][a-zA-Z0-9_]*)*$/.test(normalized)
        && !normalized.split('.').some((part) => ['__proto__', 'prototype', 'constructor'].includes(part));
}

function isLogicOperator(logic: unknown): logic is LogicOperator {
    return logic === 'AND' || logic === 'OR';
}

function isConditionOperator(operator: unknown): operator is ConditionOperator {
    return typeof operator === 'string' && CONDITION_OPERATORS.includes(operator as ConditionOperator);
}

function normalizeComparableValue(
    operator: ConditionOperator, value: unknown, valueKind?: 'text' | 'number'
): unknown {
    if (NUMERIC_CONDITION_OPERATORS.has(operator) ||
        ((operator === 'equals' || operator === 'not_equals') && valueKind === 'number')) {
        if (typeof value === 'number' && Number.isFinite(value)) return value;
        if (typeof value !== 'string' || !value.trim()) return undefined;

        // Allow a single Brazilian decimal comma without accepting thousands formatting.
        const normalized = Number(value.trim().replace(',', '.'));
        return Number.isFinite(normalized) ? normalized : undefined;
    }

    if (STRING_CONDITION_OPERATORS.has(operator)) {
        return typeof value === 'string' && value.trim() ? value : undefined;
    }

    if (value === undefined || value === '') return undefined;
    return value;
}

/**
 * Converts untrusted editor input into the existing Condition contract.
 * Empty condition lists are intentionally valid: the runtime treats them as
 * an unconditional match for a supported trigger.
 */
export function normalizeAutomationConditions(input: unknown): Condition[] {
    if (!Array.isArray(input)) throw new Error('Condições inválidas.');

    return input.map((draft, index) => {
        if (!draft || typeof draft !== 'object' || Array.isArray(draft)) {
            throw new Error(`Condição ${index + 1} inválida.`);
        }

        const { field, operator, value, logic, valueKind } = draft as ConditionDraft;
        if (!isSafeConditionField(field)) {
            throw new Error(`Selecione um campo seguro na condição ${index + 1}.`);
        }
        if (!isConditionOperator(operator)) {
            throw new Error(`Selecione um operador suportado na condição ${index + 1}.`);
        }
        if (!isLogicOperator(logic)) {
            throw new Error(`Selecione AND ou OR na condição ${index + 1}.`);
        }
        if (valueKind !== undefined && valueKind !== 'number' && valueKind !== 'text') {
            throw new Error(`Selecione um tipo de valor válido na condição ${index + 1}.`);
        }

        const normalizedField = field.trim();
        if (VALUELESS_CONDITION_OPERATORS.has(operator)) {
            return { field: normalizedField, operator, logic } as Condition;
        }

        const normalizedValue = normalizeComparableValue(operator, value, valueKind);
        if (normalizedValue === undefined) {
            throw new Error(`Informe um valor compatível na condição ${index + 1}.`);
        }

        return {
            field: normalizedField,
            operator,
            value: normalizedValue,
            logic,
        };
    });
}

type RuntimeConditionTrigger = Extract<TriggerType, 'deal_created' | 'deal_moved'>;
export type RuntimeConditionField = { value: string; label: string };

/**
 * The actual events in pipeline/actions.ts supply flat fields (not
 * "deal.value"). Stage movement does not supply monetary value.
 */
const EVENT_CONDITION_FIELDS: Readonly<Record<RuntimeConditionTrigger, readonly RuntimeConditionField[]>> = {
    deal_created: [
        { value: 'title', label: 'Título da oportunidade' },
        { value: 'stage', label: 'Etapa da oportunidade' },
        { value: 'value', label: 'Valor da oportunidade' },
    ],
    deal_moved: [
        { value: 'title', label: 'Título da oportunidade' },
        { value: 'stage', label: 'Etapa de destino' },
    ],
};

export function conditionFieldsForTrigger(trigger: unknown): readonly RuntimeConditionField[] {
    if (trigger === 'deal_created') return EVENT_CONDITION_FIELDS.deal_created;
    if (trigger === 'deal_moved') return EVENT_CONDITION_FIELDS.deal_moved;
    return [];
}

/**
 * Reject conditions referring to absent event fields before persisting.
 * This only constrains the editor, never widens the runtime or database.
 */
export function normalizeConditionsForTrigger(drafts: unknown, trigger: unknown): Condition[] {
    const fields = conditionFieldsForTrigger(trigger);
    if (!fields.length) throw new Error('Selecione um gatilho de automação suportado.');
    const conditions = normalizeAutomationConditions(drafts);
    conditions.forEach((condition, index) => {
        if (!fields.some((field) => field.value === condition.field)) {
            throw new Error('O campo "' + condition.field +
                '" não está disponível no evento selecionado (condição ' + (index + 1) + ').');
        }
    });
    return conditions;
}
