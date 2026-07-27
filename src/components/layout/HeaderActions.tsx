'use client';

import { ReactNode, useEffect } from 'react';
import { useLayoutStore } from '@/store/layout';

export function HeaderActions({ children }: { children: ReactNode }) {
    const setHeaderActions = useLayoutStore((s) => s.setHeaderActions);

    useEffect(() => {
        setHeaderActions(children);
        return () => setHeaderActions(null);
    }, [children, setHeaderActions]);

    return null;
}
