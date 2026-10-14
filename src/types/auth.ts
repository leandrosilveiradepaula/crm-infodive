import { Profile } from './profile';

export type { Profile };

export type Role = 'admin' | 'manager' | 'vendedor' | 'support';

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
    | 'clients:create'
    | 'clients:edit'
    | 'clients:delete'
    | 'clients:import'
    | 'settings:manage_users'
    | 'settings:view_audit'
    | 'settings:configure_pipeline'
    | 'integrations:manage';

export interface AuthContextType {
    user: { id: string; email?: string } | null;
    profile: Profile | null;
    loading: boolean;
    isAdmin: boolean;
    isManager: boolean;
    signOut: () => Promise<void>;
}
