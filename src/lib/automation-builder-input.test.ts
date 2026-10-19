import assert from 'node:assert/strict';
import { test } from 'vitest';
import { isSafeConditionField, normalizeAutomationConditions } from './automation-builder-input';
import { evaluateConditions } from '../services/automationRuntimeCore';

test('normalizes supported condition operators and preserves explicit zero', () => {
    assert.deepEqual(normalizeAutomationConditions([
        { field: 'deal.value', operator: 'greater_than', value: '0', logic: 'AND' },
        { field: 'stage', operator: 'equals', value: 'proposal', logic: 'OR' },
    ]), [
        { field: 'deal.value', operator: 'greater_than', value: 0, logic: 'AND' },
        { field: 'stage', operator: 'equals', value: 'proposal', logic: 'OR' },
    ]);
});

test('accepts empty condition lists and strips values from valueless operators', () => {
    assert.deepEqual(normalizeAutomationConditions([]), []);
    assert.deepEqual(normalizeAutomationConditions([
        { field: 'customer.email', operator: 'is_empty', value: 'ignored', logic: 'AND' },
        { field: 'customer.phone', operator: 'is_not_empty', logic: 'OR' },
    ]), [
        { field: 'customer.email', operator: 'is_empty', logic: 'AND' },
        { field: 'customer.phone', operator: 'is_not_empty', logic: 'OR' },
    ]);
});

test('rejects unsafe paths, unsupported operators, invalid logic, and missing required values', () => {
    assert.equal(isSafeConditionField('deal.value'), true);
    assert.equal(isSafeConditionField('__proto__.polluted'), false);
    assert.equal(isSafeConditionField('deal[0]'), false);

    assert.throws(() => normalizeAutomationConditions([
        { field: 'constructor.value', operator: 'equals', value: 'x', logic: 'AND' },
    ]));
    assert.throws(() => normalizeAutomationConditions([
        { field: 'stage', operator: 'matches', value: 'x', logic: 'AND' },
    ]));
    assert.throws(() => normalizeAutomationConditions([
        { field: 'stage', operator: 'equals', value: 'x', logic: 'XOR' },
    ]));
    assert.throws(() => normalizeAutomationConditions([
        { field: 'deal.value', operator: 'less_than', value: '', logic: 'AND' },
    ]));
    assert.throws(() => normalizeAutomationConditions([
        { field: 'stage', operator: 'contains', value: '   ', logic: 'AND' },
    ]));
});

test('numeric and textual equality remain distinct through actual runtime evaluation', () => {
    const numeric = normalizeAutomationConditions([
        { field: 'deal.value', operator: 'equals', value: '0', logic: 'AND', valueKind: 'number' },
    ]);
    const textual = normalizeAutomationConditions([
        { field: 'deal.value', operator: 'equals', value: '0', logic: 'AND', valueKind: 'text' },
    ]);
    assert.equal(numeric[0].value, 0);
    assert.equal(textual[0].value, '0');
    assert.equal(evaluateConditions(numeric, { deal: { value: 0 } }), true);
    assert.equal(evaluateConditions(textual, { deal: { value: 0 } }), false);
    assert.equal(evaluateConditions(textual, { deal: { value: '0' } }), true);
});

test('rejects malformed numeric inputs and invalid value type hints', () => {
    for (const value of ['', 'not a number', 'Infinity']) {
        assert.throws(() => normalizeAutomationConditions([
            { field: 'deal.value', operator: 'equals', value, valueKind: 'number', logic: 'AND' },
        ]));
    }
    assert.throws(() => normalizeAutomationConditions([
        { field: 'deal.value', operator: 'equals', value: '1', valueKind: 'float', logic: 'AND' },
    ]));
});
