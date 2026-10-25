import type { Scenario, UserGoalData } from '@/types/goal';

const numeric = (value: unknown): value is number =>
    typeof value === 'number' && Number.isFinite(value) && value >= 0;

function requireGoalAmount(value: unknown): number {
    if (!numeric(value)) throw new Error('Invalid goal amount');
    return value;
}

export function sanitizeGoalWrite(input: unknown): Partial<UserGoalData> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid goal update');
    const obj = input as Record<string, unknown>;
    const fields: Record<string, unknown> = {};
    for (const key of ['monthly_goal', 'yearly_goal']) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
            fields[key] = requireGoalAmount(obj[key]);
        }
    }
    if (Object.prototype.hasOwnProperty.call(obj, 'quarterly_goals')) {
        const v = obj.quarterly_goals;
        if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Invalid quarterly goals');
        const q = v as Record<string, unknown>;
        fields.quarterly_goals = {
            q1: requireGoalAmount(q.q1), q2: requireGoalAmount(q.q2),
            q3: requireGoalAmount(q.q3), q4: requireGoalAmount(q.q4),
        };
    }
    if (Object.prototype.hasOwnProperty.call(obj, 'commission_rules')) {
        const v = obj.commission_rules;
        if (!v || typeof v !== 'object' || Array.isArray(v)) throw new Error('Invalid commission rules');
        const rules = v as Record<string, unknown>;
        const cleaned: Record<string, { base: number; new: number }> = {};
        for (const type of ['hardware', 'software', 'services']) {
            const rate = rules[type];
            if (!rate || typeof rate !== 'object' || Array.isArray(rate)) throw new Error('Invalid commission rate');
            const r = rate as Record<string, unknown>;
            cleaned[type] = { base: requireGoalAmount(r.base), new: requireGoalAmount(r.new) };
        }
        fields.commission_rules = cleaned;
    }
    if (!Object.keys(fields).length) throw new Error('Empty goal update');
    return fields as Partial<UserGoalData>;
}

const writableScenarioFields = [
    'name', 'fixed_costs', 'variable_costs', 'desired_margin', 'headcount',
    'staff', 'quarterly_percentages', 'payroll_tax', 'revenue_goal',
    'input_goal_value', 'goal_mode', 'seller_weights',
] as const;

export function sanitizeScenarioWrite(input: unknown): Partial<Scenario> {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Invalid scenario');
    const obj = input as Record<string, unknown>;
    const fields: Record<string, unknown> = {};
    for (const key of writableScenarioFields) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) fields[key] = obj[key];
    }
    if (typeof fields.name !== 'string' || !fields.name.trim() || fields.name.length > 160) {
        throw new Error('Invalid scenario name');
    }
    for (const key of ['desired_margin', 'headcount', 'payroll_tax', 'revenue_goal', 'input_goal_value']) {
        if (key in fields && !numeric(fields[key])) throw new Error('Invalid scenario amount');
    }
    if ('headcount' in fields && !Number.isInteger(fields.headcount as number)) throw new Error('Invalid headcount');
    if ('goal_mode' in fields && !['revenue', 'profit_absolute', 'profit_percent'].includes(fields.goal_mode as string)) {
        throw new Error('Invalid goal mode');
    }
    for (const key of ['fixed_costs', 'variable_costs']) {
        if (key in fields) {
            const items = fields[key];
            if (!Array.isArray(items) || items.some(item =>
                !item || typeof item.id !== 'string' || typeof item.name !== 'string' || !numeric(item.value)
            )) throw new Error('Invalid cost items');
        }
    }
    return fields as Partial<Scenario>;
}

export interface GoalDistribution {
    weights: Map<string, number>;
    quarters: { q1: number; q2: number; q3: number; q4: number };
    totalGoal: number;
}

export function validateGoalDistribution(
    totalGoal: unknown,
    quarters: unknown,
    userIds: string[],
    customWeights?: { user_id: string; weight: number }[],
): GoalDistribution {
    if (!numeric(totalGoal) || totalGoal <= 0) throw new Error('Invalid scenario revenue');
    if (!quarters || typeof quarters !== 'object' || Array.isArray(quarters)) throw new Error('Invalid quarter allocation');
    const q = quarters as Record<string, unknown>;
    const values = ['q1', 'q2', 'q3', 'q4'].map(key => q[key]);
    if (values.some(value => !numeric(value))) throw new Error('Invalid quarter percentages');
    if (Math.abs((values as number[]).reduce((sum, value) => sum + value, 0) - 100) > 0.01) {
        throw new Error('Invalid quarter total');
    }
    if (!userIds.length || new Set(userIds).size !== userIds.length) throw new Error('Invalid target profiles');
    const weights = new Map<string, number>();
    if (customWeights === undefined || customWeights.length === 0) {
        for (const id of userIds) weights.set(id, 1 / userIds.length);
    } else {
        if (!Array.isArray(customWeights) || customWeights.length !== userIds.length) {
            throw new Error('Invalid distribution members');
        }
        for (const item of customWeights) {
            if (!item || !userIds.includes(item.user_id) || weights.has(item.user_id) ||
                !numeric(item.weight) || item.weight > 100) {
                throw new Error('Invalid distribution weight');
            }
            weights.set(item.user_id, item.weight / 100);
        }
        const sum = [...weights.values()].reduce((acc, weight) => acc + weight, 0);
        if (Math.abs(sum - 1) > 0.0001) throw new Error('Invalid distribution total');
    }
    return {
        weights,
        quarters: { q1: values[0] as number, q2: values[1] as number, q3: values[2] as number, q4: values[3] as number },
        totalGoal,
    };
}
