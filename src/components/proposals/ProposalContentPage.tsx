import { type Deal } from '@/types/deal';
import { formatCurrency } from '@/utils/format';
import { proposalDocumentPrimitives as paper } from '@/design-system/proposal-document-colors';

interface ProposalContentPageProps {
    deal: Deal;
    aiSummary: string;
}

export function ProposalContentPage({ deal, aiSummary }: ProposalContentPageProps) {
    return (
        <div className="w-[210mm] h-[297mm] p-16 flex flex-col relative overflow-hidden" style={{ backgroundColor: paper.paperWhite, color: paper.slate900 }}>
            {/* Header */}
            <div className="flex justify-between items-center border-b pb-4 mb-8" style={{ borderColor: paper.slate200 }}>
                <div className="text-body-ui" style={{ color: paper.slate600 }}>Ref: {deal.id.substring(0, 8).toUpperCase()}</div>
                <div className="text-body-ui font-bold">{new Date().toLocaleDateString('pt-BR')}</div>
            </div>

            {/* AI Executive Summary */}
            <div className="mb-12">
                <h3 className="text-section-title font-bold mb-4 border-l-4 pl-3" style={{ color: paper.blue900, borderColor: paper.blue900 }}>Resumo Executivo</h3>
                <div className="text-body-ui leading-relaxed whitespace-pre-wrap" style={{ color: paper.slate700 }}>
                    {aiSummary || "Gerando análise estratégica..."}
                </div>
            </div>

            {/* Scope / Items */}
            <div className="mb-8 flex-1">
                <h3 className="text-section-title font-bold mb-6 border-l-4 pl-3" style={{ color: paper.blue900, borderColor: paper.blue900 }}>Investimento e Escopo</h3>
                <table className="w-full text-left collapse">
                    <thead>
                        <tr className="text-table-ui uppercase tracking-wider" style={{ backgroundColor: paper.slate100, color: paper.slate600 }}>
                            <th className="p-3 border-b" style={{ borderColor: paper.slate200 }}>Item / Serviço</th>
                            <th className="p-3 border-b text-right" style={{ borderColor: paper.slate200 }}>Qtd</th>
                            <th className="p-3 border-b text-right" style={{ borderColor: paper.slate200 }}>Valor Unit.</th>
                            <th className="p-3 border-b text-right" style={{ borderColor: paper.slate200 }}>Total</th>
                        </tr>
                    </thead>
                    <tbody className="text-table-ui">
                        {deal.deal_products?.map((item: any, i) => (
                            <tr key={i} className="border-b" style={{ borderColor: paper.slate200 }}>
                                <td className="p-3 font-medium">{item.name}</td>
                                <td className="p-3 text-right" style={{ color: paper.slate600 }}>{item.quantity}</td>
                                <td className="p-3 text-right" style={{ color: paper.slate600 }}>{formatCurrency(item.price)}</td>
                                <td className="p-3 text-right font-bold">{formatCurrency(item.price * item.quantity)}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot>
                        <tr style={{ backgroundColor: paper.slate50 }}>
                            <td colSpan={3} className="p-3 text-right font-bold uppercase" style={{ color: paper.slate700 }}>Total Geral</td>
                            <td className="p-3 text-right font-bold text-section-title" style={{ color: paper.emerald600 }}>{formatCurrency(deal.value)}</td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Footer */}
            <div className="mt-auto pt-8 border-t flex justify-between items-end" style={{ borderColor: paper.slate200 }}>
                <div className="text-metadata-ui" style={{ color: paper.slate600 }}>
                    <p>{deal.company}</p>
                    <p>Proposta comercial válida por 15 dias.</p>
                </div>
                <div className="text-right">
                    <div className="h-8 w-32 mb-2" style={{ backgroundColor: paper.slate200 }}></div>
                    <div className="text-metadata-ui font-bold uppercase" style={{ color: paper.slate600 }}>Assinatura Responsável</div>
                </div>
            </div>
        </div>
    );
}
