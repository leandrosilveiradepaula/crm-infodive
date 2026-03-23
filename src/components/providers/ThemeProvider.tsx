'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { updateUserTheme } from '@/app/actions/theme-actions';

type Theme = 'light' | 'dark';

interface ThemeContextType {
    theme: Theme;
    toggleTheme: () => void;
    setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({
    children,
    initialTheme = 'light'
}: {
    children: React.ReactNode;
    initialTheme?: Theme;
}) {
    // Initialize with server-provided theme to avoid hydration mismatch
    const [theme, setThemeState] = useState<Theme>(initialTheme);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // Apply initial theme class
        document.documentElement.classList.toggle('dark', initialTheme === 'dark');
    }, [initialTheme]);

    const setTheme = async (newTheme: Theme) => {
        // Optimistic update
        setThemeState(newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');

        try {
            // Persist to DB
            await updateUserTheme(newTheme);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
            // Revert on failure? Probably not critical enough to revert UI for theme
        }
    };

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
    };

    // Prevent hydration mismatch by rendering children only after mount, 
    // OR just rely on initialTheme being correct from server (better)
    // Actually, if we use initialTheme from server, we don't need to wait for mount to render children,
    // but we might need to wait for mount to render theme-dependent UI if it differs from server.
    // However, since we pass initialTheme from server, it should match.

    return (
        <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
            {children}
        </ThemeContext.Provider>
    );
}

export function useTheme() {
    const context = useContext(ThemeContext);
    if (context === undefined) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}
