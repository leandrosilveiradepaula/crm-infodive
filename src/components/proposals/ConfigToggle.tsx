import React from 'react';

interface ConfigToggleProps {
    label: string;
    description: string;
    icon: React.ElementType;
    checked: boolean;
    onChange: (checked: boolean) => void;
    color: string;
}

export function ConfigToggle({ label, description, icon: Icon, checked, onChange }: ConfigToggleProps) {
    return (
        <label className={`
            flex items-center justify-between gap-3 p-5 rounded-[var(--radius-panel)] border cursor-pointer transition-all duration-300 group focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background
            ${checked
                ? 'bg-primary/5 border-primary/50 shadow-control-ui'
                : 'bg-card border-border/50 hover:border-primary/30 hover:bg-muted/50'}
        `}>
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-[var(--radius-control)] transition-colors duration-300 ${checked ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground group-hover:bg-primary/10'}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className={`font-bold text-label-ui transition-colors ${checked ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                    <p className="text-metadata-ui text-muted-foreground font-medium">{description}</p>
                </div>
            </div>
            <div aria-hidden="true" className={`
                w-10 h-6 shrink-0 rounded-full p-1 transition-colors duration-300
                ${checked ? 'bg-primary' : 'bg-muted'}
            `}>
                <div className={`
                    bg-white w-4 h-4 rounded-full transition-transform duration-300
                    ${checked ? 'translate-x-4' : 'translate-x-0'}
                `} />
            </div>
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="sr-only"
            />
        </label>
    );
}
