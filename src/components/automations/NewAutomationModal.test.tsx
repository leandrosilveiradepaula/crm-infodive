import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'vitest';

const modalSource = readFileSync(resolve(process.cwd(), 'src/components/automations/NewAutomationModal.tsx'), 'utf8');

test('condition editor initializes existing conditions and serializes them before save', () => {
    assert.match(modalSource, /draftsFromConditions\(initialData\?\.conditions\)/);
    assert.match(modalSource, /normalizeAutomationConditions\(conditions\)/);
    assert.match(modalSource, /conditions: serializedConditions/);
    assert.match(modalSource, /Adicionar condição/);
    assert.match(modalSource, /Remover condição/);
});

test('modal keeps condition data through steps and refuses invalid conditions before onSave', () => {
    assert.match(modalSource, /setStep\(2\)/);
    assert.match(modalSource, /setConditionError/);
    assert.match(modalSource, /if \(submitInFlight\.current\) return/);
    assert.match(modalSource, /await onSave\(/);
    assert.match(modalSource, /The parent reports persistence failures; retain every local field for retry/);
});

test('modal exposes only runtime-confirmed condition operators and valueless semantics', () => {
    assert.match(modalSource, /CONDITION_OPERATORS\.map/);
    assert.match(modalSource, /VALUELESS_CONDITION_OPERATORS\.has/);
    assert.match(modalSource, /E \(AND\)/);
    assert.match(modalSource, /OU \(OR\)/);
});

test('supported deal-moved stage filter and typed equality are available to the editor', () => {
    assert.match(modalSource, /Estágio de destino/);
    assert.match(modalSource, /Tipo de valor da condição/);
    assert.match(modalSource, /valueKind/);
    assert.match(modalSource, /inputMode=/);
});

test('save errors are visible without discarding draft inputs', () => {
    assert.match(modalSource, /setSaveError/);
    assert.match(modalSource, /saveError &&/);
    assert.match(modalSource, /role="alert"/);
    assert.match(modalSource, /setFormData/);
});
