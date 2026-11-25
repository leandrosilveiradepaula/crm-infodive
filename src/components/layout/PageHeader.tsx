import React from 'react';
import { Typography } from '@/components/ui/typography';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div data-slot="crm-page-header" className="relative z-10 -mx-3 flex flex-col gap-[var(--ds-page-header-gap)] border-b border-border bg-background ds-page-header sm:-mx-4 md:sticky md:top-0 md:z-20 lg:-mx-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 space-y-1">
                <Typography as="h1" variant="pageTitle">{title}</Typography>
                {description && (
                    <Typography as="p" variant="body" className="max-w-3xl text-muted-foreground">
                        {description}
                    </Typography>
                )}
            </div>
            
            {/* Action Items (Buttons, Filters, Toolbars) */}
            {children && (
                <div data-slot="crm-page-actions" className="flex min-w-0 flex-wrap items-center gap-2 md:justify-end">
                    {children}
                </div>
            )}
        </div>
    );
}
