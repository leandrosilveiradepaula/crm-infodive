'use client';

import type { ReactNode } from 'react';

interface AccessibleChartProps {
    label: string;
    entries: string[];
    children: ReactNode;
    onSelect?: (index: number) => void;
}

/** Keep visual Recharts SVG with an accessible textual equivalent and keyboard actions. */
export function AccessibleChart({ label, entries, children, onSelect }: AccessibleChartProps) {
    return (
        <div className="h-full w-full">
            <div aria-hidden="true" className="h-full w-full">{children}</div>
            <div role="group" aria-label={label} className={onSelect ? 'sr-only focus-within:not-sr-only' : 'sr-only'}>
                <p className="font-semibold">{label}</p>
                <ul>
                    {entries.length === 0 && <li>Sem dados disponíveis.</li>}
                    {entries.map((entry, index) => (
                        <li key={index}>
                            {onSelect ? (
                                <button type="button" className="focus-ring rounded-md bg-card px-2 py-1 text-left text-foreground" onClick={() => onSelect(index)}>
                                    {entry}
                                </button>
                            ) : entry}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}
