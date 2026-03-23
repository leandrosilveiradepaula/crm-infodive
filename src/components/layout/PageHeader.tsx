import React from 'react';

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: React.ReactNode;
}

export function PageHeader({ title, description, children }: PageHeaderProps) {
    return (
        <div className="sticky top-0 z-20 bg-background/80 backdrop-blur-md -mx-4 px-4 lg:-mx-6 lg:px-6 mb-10 gap-4 flex flex-col md:flex-row md:items-center md:justify-between pt-4 pb-4 border-b border-transparent transition-all">
            <div className="space-y-1.5">
                <h1 className="text-3xl font-black text-foreground tracking-tighter">{title}</h1>
                {description && (
                    <p className="text-sm font-medium text-muted-foreground leading-relaxed">
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
