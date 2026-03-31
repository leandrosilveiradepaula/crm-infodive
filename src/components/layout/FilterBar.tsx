'use client';

import React from 'react';

interface FilterBarProps {
    children: React.ReactNode;
}

export function FilterBar({ children }: FilterBarProps) {
    return (
        <div className="flex flex-col md:flex-row gap-4 items-center bg-card/50 backdrop-blur-sm p-2.5 px-4 rounded-2xl border border-border shadow-sm animate-in fade-in duration-500">
            {children}
        </div>
    );
}
