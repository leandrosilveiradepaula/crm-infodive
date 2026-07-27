'use client';

import { useEffect } from 'react';
import { useLayoutStore } from '@/store/layout';

export function PageHeaderActions({ children }: { children: React.ReactNode }) {
    const setHeaderActions = useLayoutStore(state => state.setHeaderActions);
    
    useEffect(() => {
        setHeaderActions(children);
        return () => setHeaderActions(null);
    }, [children, setHeaderActions]);

    return null;
}
