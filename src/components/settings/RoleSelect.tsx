import React from 'react';
import { Shield, Briefcase, User, Headphones } from 'lucide-react';

interface RoleSelectProps {
    value: string[];
    onChange: (roles: string[]) => void;
}

export const RoleSelect: React.FC<RoleSelectProps> = ({ value, onChange }) => {
    const roles = [
        {
            id: 'admin',
            label: 'Administrador',
            description: 'Acesso total a todas as configurações e dados.',
            icon: Shield,
            color: 'text-info',
            bg: 'bg-info/10',
            border: 'border-info/20',
            activeBorder: 'border-info',
            ring: 'ring-info'
        },
        {
            id: 'manager',
            label: 'Gerente',
            description: 'Visão geral da equipe e relatórios completos.',
            icon: Briefcase,
            color: 'text-primary',
            bg: 'bg-primary/10',
            border: 'border-primary/20',
            activeBorder: 'border-primary',
            ring: 'ring-primary'
        },
        {
            id: 'sales',
            label: 'Vendedor',
            description: 'Acesso focado em seus próprios leads e deals.',
            icon: User,
            color: 'text-success-readable',
            bg: 'bg-success/10',
            border: 'border-success/20',
            activeBorder: 'border-success',
            ring: 'ring-success'
        },
        {
            id: 'support',
            label: 'Suporte',
            description: 'Acesso para visualização de clientes e contratos.',
            icon: Headphones,
            color: 'text-warning-readable',
            bg: 'bg-warning/10',
            border: 'border-warning/20',
            activeBorder: 'border-warning',
            ring: 'ring-warning'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.map((role) => {
                const isSelected = value.includes(role.id);
                return (
                    <button
                        key={role.id}
                        type="button"
                        onClick={() => {
                            if (isSelected) {
                                onChange(value.filter(v => v !== role.id));
                            } else {
                                onChange([...value, role.id]);
                            }
                        }}
                        className={`
                            relative p-4 rounded-[var(--radius-panel)] border text-left transition-all duration-200 group
                            ${isSelected
                                ? `${role.activeBorder} ${role.bg} ring-1 ${role.ring}`
                                : 'border-border bg-card hover:border-foreground/20 hover:bg-muted/50'
                            }
                        `}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-[var(--radius-control)] ${isSelected ? 'bg-black/20 dark:bg-black/20' : 'bg-muted/50 group-hover:bg-muted'} transition-colors`}>
                                <role.icon className={`h-5 w-5 ${isSelected ? role.color : 'text-muted-foreground group-hover:text-foreground'}`} />
                            </div>
                            <div>
                                <div className={`font-bold text-body-ui ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {role.label}
                                </div>
                                <div className={`text-metadata-ui mt-1 leading-relaxed ${isSelected ? 'text-foreground/80' : 'text-muted-foreground/80'}`}>
                                    {role.description}
                                </div>
                            </div>
                        </div>

                        {isSelected && (
                            <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${role.color.replace('text-', 'bg-')}`} />
                        )}
                    </button>
                );
            })}
        </div>
    );
};
