import { useState, useEffect, useCallback } from 'react';
import { getUsers, updateUserAction } from '@/app/(dashboard)/settings/users-actions';


export interface CommissionRules {
    hardware: { new: number; base: number };
    software: { new: number; base: number };
    services: { new: number; base: number };
    campaigns?: { id: string; name: string; value: number; value_absolute?: number }[];
}

export interface QuarterlyGoals {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
}

export interface UserProfile {
    id: string;
    name: string;
    email: string;
    phone?: string; // Added phone
    role: 'admin' | 'manager' | 'sales' | 'support'; // Legacy single role
    roles: ('admin' | 'manager' | 'sales' | 'support')[]; // New multi-role
    status: 'active' | 'inactive';
    lastLogin: string;
    avatar: string;
    monthly_goal?: number;
    yearly_goal?: number;
    quarterly_goals?: QuarterlyGoals;
    commission_rate?: number;
    commission_rules?: CommissionRules;
}

export const useUsers = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchUsers = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getUsers();
            if (!result.success) throw new Error(result.error);
            setUsers(result.data as UserProfile[]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const updateUser = async (userId: string, updates: Partial<UserProfile>) => {
        try {
            console.log('Attempting to update user:', userId, updates);

            // Optimistic update
            setUsers(currentUsers => currentUsers.map(u =>
                u.id === userId ? { ...u, ...updates } : u
            ));

            const result = await updateUserAction(userId, updates);

            if (!result.success) {
                // Revert on error
                await fetchUsers();
                throw new Error(result.error);
            }

            return true;
        } catch (err: any) {
            console.error('Error updating user caught in hook:', err);
            return false;
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    return { users, loading, error, refetch: fetchUsers, updateUser };
};
