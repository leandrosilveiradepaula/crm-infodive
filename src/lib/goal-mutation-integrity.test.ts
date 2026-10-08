import { describe, expect, it } from 'vitest';
import {
    sanitizeGoalWrite, sanitizeScenarioWrite, validateGoalDistribution,
} from './goal-mutation-integrity';

describe('goals action payload policy', () => {
    it('keeps only editable goal columns, not identity and roles', () => {
        const result = sanitizeGoalWrite({
            id: 'someone-else', user_id: 'someone-else', organization_id: 'other',
            role: 'admin', status: 'active', monthly_goal: 1000, yearly_goal: 12000,
        });
        expect(result).toEqual({ monthly_goal: 1000, yearly_goal: 12000 });
    });
    it('rejects negative, nonfinite and malformed nested financial values', () => {
        expect(() => sanitizeGoalWrite({ monthly_goal: Number.NaN })).toThrow();
        expect(() => sanitizeGoalWrite({ yearly_goal: Number.POSITIVE_INFINITY })).toThrow();
        expect(() => sanitizeGoalWrite({ monthly_goal: -1 })).toThrow();
        expect(() => sanitizeGoalWrite({ role: 'admin' })).toThrow();
        expect(() => sanitizeGoalWrite({ quarterly_goals: { q1: 1, q2: -1, q3: 1, q4: 1 } })).toThrow();
        expect(() => sanitizeGoalWrite({ commission_rules: { hardware: { base: 1, new: 1 } } })).toThrow();
        expect(sanitizeGoalWrite({ quarterly_goals: { q1: 1, q2: 2, q3: 3, q4: 4 } })).toEqual({
            quarterly_goals: { q1: 1, q2: 2, q3: 3, q4: 4 },
        });
    });
    it('strips forged scenario owners and validates financial fields', () => {
        const result = sanitizeScenarioWrite({
            id: 'forged', user_id: 'other', organization_id: 'other',
            name: 'Plan A', revenue_goal: 1500, headcount: 2,
        });
        expect(result).toEqual({ name: 'Plan A', revenue_goal: 1500, headcount: 2 });
        expect(() => sanitizeScenarioWrite({ name: ' ' })).toThrow();
        expect(() => sanitizeScenarioWrite({ name: 'A', headcount: -1 })).toThrow();
        expect(() => sanitizeScenarioWrite({ name: 'A', headcount: 0.5 })).toThrow();
        expect(() => sanitizeScenarioWrite({ name: 'A', fixed_costs: [{ id: 'x', name: 'x', value: -10 }] })).toThrow();
    });
});

describe('goal distribution preflight', () => {
    const quarters = { q1: 25, q2: 25, q3: 25, q4: 25 };
    const users = ['user-a', 'user-b'];
    it('permits explicit equal distribution and valid custom distribution', () => {
        const equal = validateGoalDistribution(1000, quarters, users);
        expect(equal.weights.get('user-a')).toBe(0.5);
        const custom = validateGoalDistribution(1000, quarters, users, [
            { user_id: 'user-a', weight: 75 },
            { user_id: 'user-b', weight: 25 },
        ]);
        expect(custom.weights.get('user-a')).toBe(0.75);
        expect(custom.weights.get('user-b')).toBe(0.25);
    });
    it('rejects malformed quarter values and unknown, repeated or nonfinite weights', () => {
        expect(() => validateGoalDistribution(0, quarters, users)).toThrow();
        expect(() => validateGoalDistribution(NaN, quarters, users)).toThrow();
        expect(() => validateGoalDistribution(100, { ...quarters, q4: 30 }, users)).toThrow();
        expect(() => validateGoalDistribution(100, quarters, ['user-a', 'user-a'])).toThrow();
        expect(() => validateGoalDistribution(100, quarters, users, [
            { user_id: 'user-a', weight: 70 }, { user_id: 'user-b', weight: 20 },
        ])).toThrow();
        expect(() => validateGoalDistribution(100, quarters, users, [
            { user_id: 'user-a', weight: 100 }, { user_id: 'user-a', weight: 0 },
        ])).toThrow();
        expect(() => validateGoalDistribution(100, quarters, users, [
            { user_id: 'user-a', weight: 100 }, { user_id: 'outsider', weight: 0 },
        ])).toThrow();
        expect(() => validateGoalDistribution(100, quarters, users, [
            { user_id: 'user-a', weight: Number.POSITIVE_INFINITY },
            { user_id: 'user-b', weight: 0 },
        ])).toThrow();
    });
});
