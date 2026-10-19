import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { test } from 'vitest';

const modalSource = readFileSync(resolve(process.cwd(), 'src/components/automations/NewAutomationModal.tsx'), 'utf8');

test('condition editor initializes existing conditions and serializes them before save', () => {
    assert.match(modalSource, /draftsFromConditions\(initialData\?\.conditions\)/);
    assert.match(modalSource, /normalizeConditionsForTrigger\(conditions, formData\.trigger\?\.type\)/);
    assert.match(modalSource, /conditions: serializedConditions/);
    assert.match(modalSource, /Adicionar condição/);
    assert.match(modalSource, /Remover condição/);
});

test('modal keeps condition data through steps and refuses invalid conditions before onSave', () => {
    assert.match(modalSource, /setStep\(2\)/);
    assert.match(modalSource, /setConditionError/);
    assert.match(modalSource, /if \(submitInFlight\.current\) return/);
    assert.match(modalSource, /await onSave\(/);
    assert.match(modalSource, /setSaveError\(error instanceof Error/);
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


test('condition field selector is sourced from the active event contract', () => {
    assert.match(modalSource, /conditionFieldsForTrigger\(formData\.trigger\?\.type\)/);
    assert.match(modalSource, /supportedConditionFields\.map/);
    assert.match(modalSource, /Selecione um campo/);
    assert.doesNotMatch(modalSource, /placeholder="ex\.: deal\.value"/);
});

test('edit and duplicate preserve the existing condition payload path', () => {
    const page = readFileSync(resolve(process.cwd(), 'src/app/(dashboard)/automations/client-page.tsx'), 'utf8');
    assert.match(page, /conditions: automation\.conditions/);
    assert.match(page, /initialData=\{initialModalData\}/);
    assert.match(modalSource, /draftsFromConditions\(initialData\?\.conditions\)/);
    assert.match(modalSource, /conditions: serializedConditions/);
});
