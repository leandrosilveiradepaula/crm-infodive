import React from 'react';

interface ConfigToggleProps {
    label: string;
    description: string;
    icon: React.ElementType;
    checked: boolean;
    onChange: (checked: boolean) => void;
    color: string;
}

export function ConfigToggle({ label, description, icon: Icon, checked, onChange, color }: ConfigToggleProps) {
    return (
        <label className={`
            flex items-center justify-between p-5 rounded-2xl border cursor-pointer transition-all duration-300 group
            ${checked
                ? 'bg-primary/5 border-primary/50 shadow-sm'
                : 'bg-card border-border/50 hover:border-blue-500/30 hover:bg-muted/50'}
        `}>
            <div className="flex items-center gap-4">
                <div className={`p-2.5 rounded-xl transition-colors duration-300 ${checked ? 'bg-primary/10 ' + color : 'bg-muted text-muted-foreground group-hover:bg-blue-500/10'}`}>
                    <Icon className="h-5 w-5" />
                </div>
                <div>
                    <p className={`font-bold text-sm transition-colors ${checked ? 'text-primary' : 'text-foreground'}`}>{label}</p>
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-tight">{description}</p>
                </div>
            </div>
            <div className={`
                w-10 h-6 rounded-full p-1 transition-colors duration-300
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
                className="hidden"
            />
        </label>
    );
}
