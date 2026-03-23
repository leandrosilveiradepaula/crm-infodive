'use client';
import { useRouter } from 'next/navigation';
import { ArrowUpRight } from 'lucide-react';
import { formatCompact } from '../../utils/analytics';
import type { Deal } from '../../hooks/useDeals';

interface RecentDealsWidgetProps {
    deals: Deal[];
}

export const RecentDealsWidget = ({ deals }: RecentDealsWidgetProps) => {
    const router = useRouter();

    return (
        <div className="glass-card rounded-2xl p-6 flex flex-col h-full border border-white/5">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <h2 className="text-lg font-bold text-foreground">Oportunidades Recentes</h2>
                <button
                    onClick={() => router.push('/pipeline')}
                    className="text-sm font-semibold text-primary hover:text-primary/80"
                >
                    Ver Todas
                </button>
            </div>

            <div className="flex-1 space-y-4">
                {deals.slice(0, 4).map((deal, i) => {
                    const statusColor =
                        deal.stage === 'won' ? 'text-success bg-success/10' :
                            deal.stage === 'lost' ? 'text-destructive bg-destructive/10' :
                                'text-primary bg-primary/10';

                    return (
                        <div
                            key={deal.id}
                            className="group p-3 rounded-xl transition-all border border-transparent hover:bg-card/5 cursor-pointer active:scale-[0.98]"
                            onClick={() => router.push(`/pipeline?view=deal&id=${deal.id}`)}
                        >
                            <div className="flex justify-between items-start">
                                <div className="flex items-start">
                                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold ${i % 2 === 0 ? 'bg-primary/20 text-primary' : 'bg-info/20 text-info'}`}>
                                        {deal.company?.charAt(0) || '?'}
                                    </div>
                                    <div className="ml-3">
                                        <p className="font-bold text-foreground text-sm tracking-tight">{deal.company}</p>
                                        <p className="text-xs text-muted-foreground mt-0.5 font-medium">{deal.title}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-foreground text-sm tracking-tight">{formatCompact(deal.value)}</p>
                                    <span className={`inline-block mt-1 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest ${statusColor}`}>
                                        {deal.stage}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            <button
                onClick={() => router.push('/pipeline')}
                className="w-full mt-6 py-3 rounded-xl border border-dashed border-border text-muted-foreground font-bold text-xs uppercase tracking-widest hover:bg-muted/50 hover:text-foreground transition-all flex items-center justify-center gap-2 group shrink-0"
            >
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                Ver Pipeline Completo
            </button>
        </div>
    );
};
