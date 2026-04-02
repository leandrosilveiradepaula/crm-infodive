export interface Profile {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    email?: string;
    phone?: string;
    role?: string;
    roles?: string[];
    organization_id?: string;
    monthly_goal?: number;
    yearly_goal?: number;
    quarterly_goals?: {
        q1: number;
        q2: number;
        q3: number;
        q4: number;
    };
    commission_rules?: {
        hardware: { new: number; base: number };
        software: { new: number; base: number };
        services: { new: number; base: number };
    };
    created_at?: string;
    updated_at?: string;
}
