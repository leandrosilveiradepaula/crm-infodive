import { useState } from 'react';

export function useTheme() {
    const [theme, setTheme] = useState<'light' | 'dark'>('light');

    return {
        theme,
        toggleTheme: () => {
            setTheme((current) => {
                const next = current === 'light' ? 'dark' : 'light';
                document.documentElement.classList.toggle('dark', next === 'dark');
                return next;
            });
        },
        setTheme,
    };
}
