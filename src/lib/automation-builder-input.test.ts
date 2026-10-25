import assert from 'node:assert/strict';
import { test } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { conditionFieldsForTrigger, isSafeConditionField, normalizeAutomationConditions, normalizeConditionsForTrigger } from './automation-builder-input';
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


test('editor field choices match flat real event payloads per trigger', () => {
    assert.deepEqual(conditionFieldsForTrigger('deal_created').map((field) => field.value), [
        'title', 'stage', 'value',
    ]);
    assert.deepEqual(conditionFieldsForTrigger('deal_moved').map((field) => field.value), [
        'title', 'stage',
    ]);
    assert.deepEqual(conditionFieldsForTrigger('time_based'), []);
});

test('unavailable event fields fail validation instead of silently skipping future events', () => {
    for (const [trigger, field] of [
        ['deal_created', 'deal.value'],
        ['deal_moved', 'value'],
        ['deal_moved', 'deal.stage'],
        ['deal_created', 'account_id'],
    ]) {
        assert.throws(() => normalizeConditionsForTrigger([
            { field, operator: 'equals', value: 'x', logic: 'AND' },
        ], trigger), /não está disponível no evento selecionado/);
    }
    assert.throws(() => normalizeConditionsForTrigger([], 'time_based'), /gatilho/);
});

test('typed values and AND conditions evaluate against emitted event shapes', () => {
    const created = normalizeConditionsForTrigger([
        { field: 'value', operator: 'equals', value: '0', valueKind: 'number', logic: 'AND' },
        { field: 'stage', operator: 'equals', value: 'qualification', logic: 'AND' },
    ], 'deal_created');
    assert.equal(evaluateConditions(created, { title: 'Teste', stage: 'qualification', value: 0 }), true);
    assert.equal(evaluateConditions(created, { title: 'Teste', stage: 'qualification', value: 42 }), false);

    const moved = normalizeConditionsForTrigger([
        { field: 'stage', operator: 'equals', value: 'won', logic: 'AND' },
        { field: 'title', operator: 'contains', value: 'Cliente', logic: 'AND' },
    ], 'deal_moved');
    assert.equal(evaluateConditions(moved, { stage: 'won', title: 'Cliente ACME' }), true);
    assert.equal(evaluateConditions(moved, { stage: 'lost', title: 'Cliente ACME' }), false);
    assert.deepEqual(normalizeConditionsForTrigger([], 'deal_moved'), []);
});

test('actual pipeline action payloads retain the exact fields permitted by the editor', () => {
    const pipeline = readFileSync(resolve(process.cwd(), 'src/app/(dashboard)/pipeline/actions.ts'), 'utf8');
    assert.match(pipeline, /type: 'deal_created',[\s\S]*?data: \{ title: result\.title, stage: result\.stage \|\| '', value: result\.value \|\| 0 \}/);
    assert.match(pipeline, /type: 'deal_moved',[\s\S]*?data: \{ stage: newStage, title: dealTitle \|\| '' \}/);
});
