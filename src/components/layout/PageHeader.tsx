import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="sticky top-0 z-20 bg-background -mx-2 px-2 lg:-mx-4 lg:px-4 mb-6 gap-4 flex flex-col md:flex-row md:items-center md:justify-between pt-3 pb-3 border-b border-border transition-all">
            <div className="space-y-1">
                <h1 className="text-2xl font-black text-foreground tracking-tighter">{title}</h1>
                {description && (
                    <p className="text-[13px] font-medium text-muted-foreground leading-tight">
                        {description}
                    </p>
                )}
            </div>
            
            {/* Action Items (Buttons, Filters, Toolbars) */}
            <div className="flex flex-wrap items-center gap-3">
                {children}
            </div>
        </div>
    );
}
