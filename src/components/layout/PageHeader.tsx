import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="sticky top-0 z-20 -mx-3 mb-5 flex flex-col gap-3 border-b border-border bg-background/90 px-3 py-4 backdrop-blur-xl sm:-mx-4 sm:px-4 lg:-mx-6 lg:mb-6 lg:px-6 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0 space-y-1">
                <h1 className="text-xl font-semibold tracking-tight text-foreground sm:text-2xl">{title}</h1>
                {description && (
                    <p className="max-w-3xl text-sm leading-5 text-muted-foreground">
                        {description}
                    </p>
                )}
            </div>
            
            {/* Action Items (Buttons, Filters, Toolbars) */}
            <div className="flex flex-wrap items-center gap-2">
                {children}
            </div>
        </div>
    );
}
