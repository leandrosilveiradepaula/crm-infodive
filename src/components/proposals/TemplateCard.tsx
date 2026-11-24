import type { LucideIcon } from 'lucide-react';

interface TemplateCardProps {
    icon: LucideIcon;
    title: string;
    description: string;
    isSelected: boolean;
    onSelect: () => void;
}

export const TemplateCard = ({
    icon: Icon,
    title,
    description,
    isSelected,
    onSelect,
}: TemplateCardProps) => {
    return (
        <button
            onClick={onSelect}
            className={`
                relative p-8 rounded-[var(--radius-panel)] text-left transition-all duration-300 w-full group overflow-hidden
                ${isSelected
                    ? 'bg-primary/10 border-2 border-primary shadow-card-ui shadow-primary/10 scale-[1.02]'
                    : 'bg-muted/30 border-2 border-border/50 hover:border-primary/50 hover:bg-muted/50'
                }
            `}
        >
            {/* Background Accent */}
            <div className={`absolute top-0 right-0 p-16 rounded-full blur-3xl transition-opacity duration-500 -translate-x-1/2 -translate-y-1/2
                ${isSelected ? 'bg-primary/10 opacity-100' : 'bg-primary/5 opacity-0 group-hover:opacity-100'}
            `} />

            {/* Icon */}
            <div className={`
                inline-flex p-3 rounded-[var(--radius-panel)] mb-6 transition-all duration-300
                ${isSelected ? 'bg-primary text-white shadow-card-ui shadow-primary/30' : 'bg-muted text-muted-foreground group-hover:text-primary group-hover:bg-primary/10'}
            `}>
                <Icon className="h-6 w-6" />
            </div>

            {/* Title */}
            <h3 className={`
                text-section-title font-black mb-3 transition-colors tracking-tight
                ${isSelected ? 'text-primary' : 'text-foreground'}
            `}>
                {title}
            </h3>

            {/* Description */}
            <p className="text-body-ui text-muted-foreground leading-relaxed font-medium">
                {description}
            </p>

            {/* Select Button */}
            <div className="mt-8">
                <span className={`
                    inline-flex items-center gap-2 text-metadata-ui font-black px-4 py-1.5 rounded-full transition-all duration-300 uppercase tracking-widest
                    ${isSelected
                        ? 'bg-primary text-white shadow-inner'
                        : 'bg-muted text-muted-foreground group-hover:bg-primary group-hover:text-white'
                    }
                `}>
                    {isSelected ? '✓ SELECIONADO' : 'SELECIONAR MODELO'}
                </span>
            </div>

            {/* Glow effect when selected */}
            {isSelected && (
                <div className="absolute inset-0 rounded-[var(--radius-panel)] bg-gradient-to-br from-primary/5 to-info/5 pointer-events-none" />
            )}
        </button>
    );
};
