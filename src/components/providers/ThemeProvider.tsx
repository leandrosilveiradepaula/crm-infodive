'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { updateUserTheme } from '@/app/actions/theme-actions';
import { toast } from 'sonner';

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
    const preferredTheme = useRef<Theme>(initialTheme);
    const requestSequence = useRef(0);

    useEffect(() => {
        // Initialize the document once for this provider instance. A Next.js
        // Server Action may revalidate the root layout after a save; an old
        // server prop must not silently override the user's latest client
        // choice while persistence is being reconciled.
        document.documentElement.classList.toggle('dark', preferredTheme.current === 'dark');
    }, []);

    const setTheme = async (newTheme: Theme) => {
        const previous = preferredTheme.current;
        const sequence = ++requestSequence.current;
        preferredTheme.current = newTheme;
        setThemeState(newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');

        try {
            await updateUserTheme(newTheme);
        } catch (error) {
            console.error('Failed to save theme preference:', error);
            // Only the most recent change is allowed to roll back UI state.
            // Older failed requests may not undo a newer user choice.
            if (sequence !== requestSequence.current) return;
            preferredTheme.current = previous;
            setThemeState(previous);
            document.documentElement.classList.toggle('dark', previous === 'dark');
            toast.error('Não foi possível salvar o tema. A aparência anterior foi restaurada.');
        }
    };

    const toggleTheme = () => {
        const newTheme = preferredTheme.current === 'light' ? 'dark' : 'light';
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
