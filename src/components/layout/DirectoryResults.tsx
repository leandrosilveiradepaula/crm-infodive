'use client';

import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface DirectoryResultsProps {
    shown: number;
    total: number;
    hasFilters: boolean;
    onReset: () => void;
    resetLabel: string;
}

/** Same search-result feedback and recovery action on every directory. */
export function DirectoryResults({ shown, total, hasFilters, onReset, resetLabel }: DirectoryResultsProps) {
    return (
        <div data-qa-region="directory-results" className="flex min-w-0 flex-wrap items-center justify-between gap-2">
            <p role="status" className="text-body-ui text-muted-foreground">
                {shown} de {total} registros
            </p>
            {hasFilters && (
                <Button type="button" variant="outline" size="sm" aria-label={resetLabel} onClick={onReset}>
                    <X aria-hidden="true" />
                    Limpar filtros
                </Button>
            )}
        </div>
    );
}
