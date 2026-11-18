'use client';

import React from 'react';

interface FilterBarProps {
    children: React.ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
    return (
        <section aria-label="Filtros" className="flex flex-col gap-3 rounded-[var(--radius-panel)] border border-border bg-card p-3 shadow-[var(--shadow-card)] md:flex-row md:items-center">
            {children}
        </section>
    );
}
