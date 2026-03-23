
import React from 'react';
import { Deal } from '@/types/deal';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    History, ArrowRight, CheckCircle2, AlertCircle,
    FileText, User, Tag, Calendar, DollarSign
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface HistoryTabProps {
    deal: Deal;
}

export const HistoryTab = ({ deal }: HistoryTabProps) => {
    // Generate some mock history based on deal state if real activities are missing
    const historyItems = [
        {
            id: 1,
            type: 'stage_change',
            title: 'Mudança de Estágio',
            description: `Moveu para ${deal.stage}`,
            user: 'Leandro',
            date: new Date().toISOString(),
            icon: <ArrowRight className="w-4 h-4 text-white" />,
            color: 'bg-blue-500'
        },
        {
            id: 2,
            type: 'update',
            title: 'Valor Atualizado',
            description: `Alterou valor para ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}`,
            user: 'Sistema',
            date: new Date(Date.now() - 86400000).toISOString(),
            icon: <DollarSign className="w-4 h-4 text-white" />,
            color: 'bg-emerald-500'
        },
        {
            id: 3,
            type: 'creation',
            title: 'Oportunidade Criada',
            description: 'Iniciou o ciclo de vendas',
            user: deal.owner || 'Leandro',
            date: deal.created_at || new Date(Date.now() - 172800000).toISOString(),
            icon: <History className="w-4 h-4 text-white" />,
            color: 'bg-purple-500'
        }
    ];

    return (
        <div className="h-full flex flex-col p-6 overflow-hidden">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-white">Histórico de Auditoria</h3>
                <p className="text-sm text-muted-foreground">Rastreamento completo de alterações</p>
            </div>

            <ScrollArea className="flex-1 pr-4">
                <div className="relative pl-4 border-l border-border space-y-8">
                    {historyItems.map((item, index) => (
                        <div key={item.id} className="relative">
                            <div className={`absolute -left-[21px] top-1 p-1 rounded-full border-4 border-background ${item.color}`}>
                                {item.icon}
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-sm font-bold text-foreground">{item.title}</h4>
                                    <span className="text-[10px] text-muted-foreground font-mono">
                                        {formatDistanceToNow(new Date(item.date), { addSuffix: true, locale: ptBR })}
                                    </span>
                                </div>
                                <p className="text-xs text-muted-foreground">{item.description}</p>
                                <div className="flex items-center gap-2 mt-2">
                                    <span className="text-[10px] bg-muted/50 border border-border px-2 py-0.5 rounded text-muted-foreground flex items-center gap-1">
                                        <User className="w-3 h-3" />
                                        {item.user}
                                    </span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </ScrollArea>
        </div>
    );
};
