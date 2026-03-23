'use client';

import { LayoutGrid, List } from 'lucide-react';
import { cn } from '@/lib/utils';

export type ViewMode = 'cards' | 'list';

interface ViewToggleProps {
    view: ViewMode;
    onViewChange: (view: ViewMode) => void;
    className?: string;
}

export function ViewToggle({ view, onViewChange, className }: ViewToggleProps) {
    return (
        <div className={cn('flex items-center bg-muted/50 border border-border rounded-xl p-1 gap-0.5', className)}>
            <button
                onClick={() => onViewChange('cards')}
                title="Visualização em cards"
                className={cn(
                    'p-1.5 rounded-lg transition-all duration-200',
                    view === 'cards'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                )}
            >
                <LayoutGrid className="h-4 w-4" />
            </button>
            <button
                onClick={() => onViewChange('list')}
                title="Visualização em lista"
                className={cn(
                    'p-1.5 rounded-lg transition-all duration-200',
                    view === 'list'
                        ? 'bg-background shadow-sm text-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                )}
            >
                <List className="h-4 w-4" />
            </button>
        </div>
    );
}
