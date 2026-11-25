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
        // Visual state is the authoritative previous state for a user's
        // immediate click: a revalidated SSR value can be older than the
        // rendered document even when the provider stays mounted.
        const previous: Theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        const sequence = ++requestSequence.current;
        preferredTheme.current = newTheme;
        setThemeState(newTheme);
        document.documentElement.classList.toggle('dark', newTheme === 'dark');
        document.documentElement.dataset.themeSaveState = 'saving';

        try {
            await updateUserTheme(newTheme);
            if (sequence === requestSequence.current) {
                document.documentElement.dataset.themeSaveState = 'saved';
            }
        } catch (error) {
            console.error('Failed to save theme preference:', error);
            // Only the latest change can roll back UI state. A stale failure
            // must never undo the latest successful user choice.
            if (sequence !== requestSequence.current) return;
            preferredTheme.current = previous;
            setThemeState(previous);
            document.documentElement.classList.toggle('dark', previous === 'dark');
            document.documentElement.dataset.themeSaveState = 'failed';
            toast.error('Não foi possível salvar o tema. A aparência anterior foi restaurada.');
        }
    };

    const toggleTheme = () => {
        // Toggle what the user actually sees, not a possibly stale server prop.
        const renderedTheme: Theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
        void setTheme(renderedTheme === 'dark' ? 'light' : 'dark');
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
