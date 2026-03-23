import { type Deal } from '@/types/deal';
import { formatCurrency } from '@/utils/format';

interface ProposalContentPageProps {
    deal: Deal;
    aiSummary: string;
}

export function ProposalContentPage({ deal, aiSummary }: ProposalContentPageProps) {
    return (
        <div className="w-[210mm] h-[297mm] bg-card text-foreground p-16 flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="flex justify-between items-center border-b border-border pb-4 mb-8">
                <div className="text-sm text-muted-foreground">Ref: {deal.id.substring(0, 8).toUpperCase()}</div>
                <div className="text-sm font-bold text-foreground">{new Date().toLocaleDateString('pt-BR')}</div>
            </div>

            {/* AI Executive Summary */}
            <div className="mb-12">
                <h3 className="text-xl font-bold mb-4 text-blue-900 border-l-4 border-primary pl-3">Resumo Executivo</h3>
                <div className="text-base leading-relaxed text-slate-700 whitespace-pre-wrap">
                    {aiSummary || "Gerando análise estratégica..."}
                </div>
            </div>

            {/* Scope / Items */}
            <div className="mb-8 flex-1">
                <h3 className="text-xl font-bold mb-6 text-blue-900 border-l-4 border-primary pl-3">Investimento e Escopo</h3>
                <table className="w-full text-left collapse">
                    <thead>
                        <tr className="bg-slate-100 text-slate-600 text-sm uppercase tracking-wider">
                            <th className="p-3 border-b border-border">Item / Serviço</th>
                            <th className="p-3 border-b border-border text-right">Qtd</th>
                            <th className="p-3 border-b border-border text-right">Valor Unit.</th>
                            <th className="p-3 border-b border-border text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-sm">
                        {deal.deal_products?.map((item: any, i) => (
                            <tr key={i} className="border-b border-border">
                                <td className="p-3 font-medium text-foreground">{item.name}</td>
                                <td className="p-3 text-right text-slate-600">{item.quantity}</td>
                                <td className="p-3 text-right text-slate-600">{formatCurrency(item.price)}</td>
                                <td className="p-3 text-right font-bold text-foreground">{formatCurrency(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr className="bg-muted/50">
                            <td colSpan={3} className="p-3 text-right font-bold text-slate-700 uppercase">Total Geral</td>
                            <td className="p-3 text-right font-bold text-emerald-600 text-lg">{formatCurrency(deal.value)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8 border-t border-border flex justify-between items-end">
                <div className="text-xs text-muted-foreground">
                    <p>{deal.company}</p>
                    <p>Proposta comercial válida por 15 dias.</p>
                </div>
                <div className="text-right">
                    <div className="h-8 w-32 bg-slate-200 mb-2"></div>
                    <div className="text-xs font-bold uppercase text-muted-foreground">Assinatura Responsável</div>
                </div>
            </div>
        </div>
    );
}
