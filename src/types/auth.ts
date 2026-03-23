export type Role = 'admin' | 'manager' | 'vendedor' | 'support';

export interface Profile {
    id: string;
    full_name: string;
    avatar_url?: string;
    email?: string;
    role: Role;
    monthly_goal?: number;
    yearly_goal?: number;
    quarterly_goals?: { q1: number; q2: number; q3: number; q4: number };
    commission_rules?: any;
    status?: 'active' | 'inactive';
}

export type Permission =
    | 'leads:view_all'
    | 'leads:create'
    | 'leads:edit'
    | 'leads:delete'
    | 'deals:view_all'
    | 'deals:create'
    | 'deals:edit'
    | 'deals:delete'
    | 'deals:change_owner'
    | 'products:create'
    | 'products:edit'
    | 'products:delete'
    | 'clients:view_all'
    | 'settings:manage_users'
    | 'settings:configure_pipeline';

export interface AuthContextType {
    user: { id: string; email?: string } | null;
    profile: Profile | null;
    loading: boolean;
    isAdmin: boolean;
    isManager: boolean;
    signOut: () => Promise<void>;
}
