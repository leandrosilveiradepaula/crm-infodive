export interface QuarterlyGoals {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
}

export interface CommissionRate {
    base: number;
    new: number;
}

export interface CommissionRules {
    hardware: CommissionRate;
    software: CommissionRate;
    services: CommissionRate;
}

export interface Campaign {
    id: string;
    organization_id: string;
    name: string;
    description?: string;
    start_date?: string | null;
    end_date?: string | null;
    active: boolean;
    commission_percent: number;
    commission_absolute: number;
    created_at: string;
    updated_at: string;
}

export interface Scenario {
    id: string;
    organization_id: string;
    user_id: string;
    name: string;
    fixed_costs: { id: string; name: string; value: number }[];
    variable_costs: { id: string; name: string; value: number }[];
    desired_margin: number;
    headcount: number;
    staff?: { role: string; salary: number; count: number; rampUp?: number }[];
    quarterly_percentages: { q1: number; q2: number; q3: number; q4: number };
    payroll_tax?: number;
    revenue_goal?: number;
    input_goal_value?: number;
    goal_mode?: 'revenue' | 'profit_absolute' | 'profit_percent';
    seller_weights?: { user_id: string; weight: number }[];
    created_at: string;
}

export interface UserGoalData {
    user_id: string;
    name?: string;
    role?: string;
    avatar?: string;
    monthly_goal: number;
    yearly_goal: number;
    quarterly_goals: QuarterlyGoals;
    commission_rules: CommissionRules;
}
