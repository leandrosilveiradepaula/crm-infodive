import React from 'react';
import { FileText, Zap, FileCheck, Globe } from 'lucide-react';
import { TemplateCard } from './TemplateCard';
import type { TemplateType } from '@/hooks/useProposalIntelligence';

interface ProposalTemplateSelectorProps {
    selectedTemplate: TemplateType;
    onSelectTemplate: (template: TemplateType) => void;
}

export function ProposalTemplateSelector({ selectedTemplate, onSelectTemplate }: ProposalTemplateSelectorProps) {
    const templates = [
        {
            id: 'executivo' as TemplateType,
            icon: FileText,
            title: 'EXECUTIVO MASTER',
            description: 'Design minimalista e autoritativo. Foco total em ROI e valor estratégico.',
        },
        {
            id: 'tecnico' as TemplateType,
            icon: Zap,
            title: 'MERGULHO TÉCNICO',
            description: 'Prioridade em arquitetura e especificações. Ideal para validação técnica.',
        },
        {
            id: 'detalhado' as TemplateType,
            icon: FileCheck,
            title: 'ESPECIFICAÇÃO DETALHADA',
            description: 'Template focado em detalhes customizados de produtos. Especificações técnicas completas.',
        },
        {
            id: 'rapido' as TemplateType,
            icon: Globe,
            title: 'VIA RÁPIDA',
            description: 'Agilidade máxima para fechamentos táticos e renovações simplificadas.',
        },
    ];

    return (
        <div className="space-y-10 animate-in slide-in-from-right-8 h-full flex flex-col justify-center max-w-4xl mx-auto">
            <div className="text-center space-y-2">
                <h3 className="text-3xl font-black tracking-tight">Escolha o DNA da Proposta</h3>
                <p className="text-muted-foreground">O modelo define a estrutura narrativa e o foco visual do documento.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map(t => (
                    <TemplateCard
                        key={t.id}
                        icon={t.icon}
                        title={t.title}
                        description={t.description}
                        isSelected={selectedTemplate === t.id}
                        onSelect={() => onSelectTemplate(t.id)}
                    />
                ))}
            </div>
        </div>
    );
}
