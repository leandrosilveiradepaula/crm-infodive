import test from 'node:test';
import assert from 'node:assert/strict';
import { countViolations, compareCounts } from '../scripts/check-design-token-policy.mjs';

test('detects local palette, gradients, typography, radius and shadows', () => {
  const counts = countViolations('bg-gradient-to-r from-blue-50 to-white text-emerald-600 text-[9px] rounded-xl shadow-lg');
  assert.equal(counts['literal-palette'], 2);
  assert.equal(counts['gradient-local'], 1);
  assert.equal(counts['font-size-local'], 1);
  assert.equal(counts['radius-local'], 1);
  assert.equal(counts['shadow-local'], 1);
});

test('semantic tokens do not increase styling debt', () => {
  const counts = countViolations('ds-panel-financial ds-type-label bg-surface-raised text-success-readable shadow-control-ui rounded-[var(--radius-panel)]');
  assert.ok(Object.values(counts).every(n => n === 0));
});

test('allows debt reduction and blocks increases', () => {
  assert.equal(compareCounts('text-blue-500 text-blue-600', 'text-blue-600').length, 0);
  assert.equal(compareCounts('text-blue-500', 'text-blue-600 text-green-500').length, 1);
});
