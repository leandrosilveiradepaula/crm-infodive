'use client';

import React, { createContext, useEffect, useState, useMemo, useCallback } from 'react';
import { Profile, AuthContextType } from '@/types/auth';
import { usePathname, useRouter } from 'next/navigation';
import { isPublicRoute } from '@/lib/public-routes';

export const AuthContext = createContext<AuthContextType>({
    user: null,
    profile: null,
    loading: true,
    isAdmin: false,
    isManager: false,
    signOut: async () => { },
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    const fetchSession = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                if (data.isLoggedIn && data.userId) {
                    setUser({ id: data.userId });
                    setProfile(data.profile || null);
                } else {
                    setUser(null);
                    setProfile(null);
                }
            } else {
                setUser(null);
                setProfile(null);
            }
        } catch (error) {
            console.error('Error fetching session:', error);
            setUser(null);
            setProfile(null);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (isPublicRoute(pathname)) {
            setUser(null);
            setProfile(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        fetchSession();
    }, [fetchSession, pathname]);

    const signOut = useCallback(async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        setProfile(null);
        setUser(null);
        router.push('/login');
    }, [router]);

    const value = useMemo<AuthContextType>(() => ({
        user,
        profile,
        loading,
        isAdmin: profile?.role === 'admin',
        isManager: ['admin', 'manager'].includes(profile?.role || ''),
        signOut
    }), [user, profile, loading, signOut]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
