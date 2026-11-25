'use client';

import type { ReactNode } from 'react';

interface AccessibleChartProps {
    label: string;
    entries: string[];
    children: ReactNode;
    onSelect?: (index: number) => void;
}

/**
 * Recharts paints some axis labels as SVG text, whose background cannot reliably
 * be computed by axe. The callers keep the data trace and disable SVG tick text;
 * a native disclosure provides equivalent HTML data to EVERY user.
 *
 * Do not hide an interactive Recharts tree using aria-hidden: its SVG contains
 * focusable descendants and triggers aria-hidden-focus.
 */
export function AccessibleChart({ label, entries, children, onSelect }: AccessibleChartProps) {
    return (
        <div className="h-full w-full">
            <div className="h-full w-full">{children}</div>
            <details className="relative z-10 mt-2 rounded-[var(--radius-control)] border border-border bg-card px-2 py-1 text-metadata-ui text-foreground">
                <summary className="focus-ring cursor-pointer font-semibold">
                    Ver dados: {label}
                </summary>
                <ul className="mt-2 max-h-48 space-y-1 overflow-auto">
                    {entries.length === 0 && <li>Sem dados disponíveis.</li>}
                    {entries.map((entry, index) => (
                        <li key={index}>
                            {onSelect ? (
                                <button
                                    type="button"
                                    className="focus-ring w-full rounded-[var(--radius-control)] bg-muted px-2 py-1 text-left text-foreground hover:bg-surface-subtle"
                                    onClick={() => onSelect(index)}
                                >
                                    {entry}
                                </button>
                            ) : <span>{entry}</span>}
                        </li>
                    ))}
                </ul>
            </details>
        </div>
    );
}
