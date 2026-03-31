import React from 'react';
import { Shield, Briefcase, User, Headphones } from 'lucide-react';

interface RoleSelectProps {
    value: string;
    onChange: (role: string) => void;
}

export const RoleSelect: React.FC<RoleSelectProps> = ({ value, onChange }) => {
    const roles = [
        {
            id: 'admin',
            label: 'Administrador',
            description: 'Acesso total a todas as configurações e dados.',
            icon: Shield,
            color: 'text-teal-400',
            bg: 'bg-teal-500/10',
            border: 'border-teal-500/20',
            activeBorder: 'border-teal-500',
            ring: 'ring-teal-500'
        },
        {
            id: 'manager',
            label: 'Gerente',
            description: 'Visão geral da equipe e relatórios completos.',
            icon: Briefcase,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10',
            border: 'border-blue-500/20',
            activeBorder: 'border-blue-500',
            ring: 'ring-blue-500'
        },
        {
            id: 'sales',
            label: 'Vendedor',
            description: 'Acesso focado em seus próprios leads e deals.',
            icon: User,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10',
            border: 'border-emerald-500/20',
            activeBorder: 'border-emerald-500',
            ring: 'ring-emerald-500'
        },
        {
            id: 'support',
            label: 'Suporte',
            description: 'Acesso para visualização de clientes e contratos.',
            icon: Headphones,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/20',
            activeBorder: 'border-orange-500',
            ring: 'ring-orange-500'
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {roles.map((role) => {
                const isSelected = value === role.id;
                return (
                    <button
                        key={role.id}
                        type="button"
                        onClick={() => onChange(role.id)}
                        className={`
                            relative p-4 rounded-xl border text-left transition-all duration-200 group
                            ${isSelected
                                ? `${role.activeBorder} ${role.bg} ring-1 ${role.ring}`
                                : 'border-border bg-card hover:border-foreground/20 hover:bg-muted/50'
                            }
                        `}
                    >
                        <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-lg ${isSelected ? 'bg-black/20 dark:bg-black/20' : 'bg-muted/50 group-hover:bg-muted'} transition-colors`}>
                                <role.icon className={`h-5 w-5 ${isSelected ? role.color : 'text-muted-foreground group-hover:text-foreground'}`} />
                            </div>
                            <div>
                                <div className={`font-bold text-sm ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                                    {role.label}
                                </div>
                                <div className={`text-xs mt-1 leading-relaxed ${isSelected ? 'text-foreground/80' : 'text-muted-foreground/80'}`}>
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
