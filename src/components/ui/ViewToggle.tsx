'use client';

import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'cards' | 'list';

interface ViewToggleProps {
    view: ViewMode;
    onViewChange: (view: ViewMode) => void;
    className?: string;
    gridLabel?: string;
}

export function ViewToggle({ view, onViewChange, className, gridLabel = 'Visualização em cards' }: ViewToggleProps) {
    return (
        <div role="group" aria-label="Modo de visualização" className={cn('flex items-center rounded-[var(--radius-control)] border border-border bg-muted p-[var(--ds-toggle-container-padding)] gap-0.5', className)}>
            <button
                type="button"
                onClick={() => onViewChange('cards')}
                title={gridLabel}
                aria-label={gridLabel}
                aria-pressed={view === 'cards'}
                className={cn(
                    'focus-ring rounded-[var(--radius-control)] p-[var(--ds-toggle-icon-padding)] transition-colors',
                    view === 'cards'
                        ? 'bg-background shadow-control-ui text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                )}
            >
                <LayoutGrid className="h-4 w-4" />
            </button>
            <button
                type="button"
                onClick={() => onViewChange('list')}
                title="Visualização em lista"
                aria-label="Visualização em lista"
                aria-pressed={view === 'list'}
                className={cn(
                    'focus-ring rounded-[var(--radius-control)] p-[var(--ds-toggle-icon-padding)] transition-colors',
                    view === 'list'
                        ? 'bg-background shadow-control-ui text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                )}
            >
                <List className="h-4 w-4" />
            </button>
        </div>
    );
}
