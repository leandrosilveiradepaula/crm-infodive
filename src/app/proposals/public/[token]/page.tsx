'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { SignatureModal } from '@/components/proposals/signature/SignatureModal';
import { Button } from '@/components/ui/button';
import { FileText, CheckCircle2, Eye, Calendar, Building2, Mail, Phone, Loader2 } from 'lucide-react';
import { formatCurrency } from '@/utils/analytics';
import { toast } from 'sonner';
import type { Proposal } from '@/types/proposal';
import { ProposalCoverPage } from '@/components/proposals/ProposalCoverPage';
import { ProposalOverviewPage } from '@/components/proposals/ProposalOverviewPage';
import { ProposalHardwarePage } from '@/components/proposals/ProposalHardwarePage';
import { ProposalSoftwarePage } from '@/components/proposals/ProposalSoftwarePage';
import { ProposalInvestmentPage } from '@/components/proposals/ProposalInvestmentPage';
import { ProposalDifferentialsPage } from '@/components/proposals/ProposalDifferentialsPage';
import { ProposalConfidentialityPage } from '@/components/proposals/ProposalConfidentialityPage';

export default function PublicProposalPage() {
    const params = useParams();
    const token = params?.token as string;

    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSignatureModal, setShowSignatureModal] = useState(false);

    useEffect(() => {
        if (!token) return;

        const controller = new AbortController();
        const signal = controller.signal;

        const fetchProposal = async () => {
            try {
                const response = await fetch(`/api/proposals/public/${token}`, { signal });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.error || 'Proposta não encontrada');
                }

                const data = await response.json();
                if (!signal.aborted) {
                    setProposal(data);
                }
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                setError(err.message);
                toast.error(err.message);
            } finally {
                if (!signal.aborted) {
                    setLoading(false);
                }
            }
        };

        fetchProposal();

        return () => {
            controller.abort();
        };
    }, [token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="text-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando proposta...</p>
                </div>
            </div>
        );
    }

    if (error || !proposal) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
                <div className="text-center max-w-md">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h1 className="text-2xl font-bold mb-2">Proposta Não Encontrada</h1>
                    <p className="text-muted-foreground">
                        {error || 'Esta proposta não existe ou não está mais disponível.'}
                    </p>
                </div>
            </div>
        );
    }

    const getStatusBadge = (status: string) => {
        const configs = {
            draft: { label: 'Rascunho', color: 'bg-muted/50 text-foreground' },
            sent: { label: 'Enviada', color: 'bg-blue-100 text-blue-800' },
            viewed: { label: 'Visualizada', color: 'bg-teal-100 text-teal-800' },
            signed: { label: 'Assinada', color: 'bg-green-100 text-green-800' },
            rejected: { label: 'Rejeitada', color: 'bg-red-100 text-red-800' },
        };

        const config = configs[status as keyof typeof configs] || configs.draft;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const canSign = proposal.allow_signature && ['sent', 'viewed'].includes(proposal.status);
    const isSigned = proposal.status === 'signed';

    return (
        <>
            <div className="min-h-screen bg-gradient-to-br from-blue-50 to-blue-100 py-12 px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header Card */}
                    <div className="bg-card rounded-xl shadow-lg p-8 mb-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">{proposal.title}</h1>
                                <p className="text-muted-foreground">Proposta #{proposal.number}</p>
                            </div>
                            <div>
                                {getStatusBadge(proposal.status)}
                            </div>
                        </div>

                        {/* Metadata */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t pt-6">
                            <div className="flex items-center gap-3">
                                <Calendar className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Data de Criação</p>
                                    <p className="font-medium">{new Date(proposal.createdAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>

                            {proposal.validUntil && (
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Válida Até</p>
                                        <p className="font-medium">{new Date(proposal.validUntil).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <Eye className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-xs text-muted-foreground">Versão</p>
                                    <p className="font-medium">v{proposal.version}</p>
                                </div>
                            </div>
                        </div>

                        {/* Financial Summary */}
                        <div className="border-t mt-6 pt-6">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span className="font-medium">{formatCurrency(proposal.subtotal)}</span>
                            </div>
                            {proposal.discount > 0 && (
                                <div className="flex justify-between items-center mb-2 text-green-600">
                                    <span>Desconto ({proposal.discountPercentage}%)</span>
                                    <span>-{formatCurrency(proposal.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-xl font-bold border-t pt-4">
                                <span>Total</span>
                                <span className="text-primary">{formatCurrency(proposal.total)}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {canSign && (
                            <div className="mt-6">
                                <Button
                                    onClick={() => setShowSignatureModal(true)}
                                    className="w-full bg-green-600 hover:bg-green-700 text-white h-12 text-lg"
                                >
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    Assinar Proposta
                                </Button>
                            </div>
                        )}

                        {isSigned && (
                            <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center gap-3">
                                <CheckCircle2 className="h-6 w-6 text-green-600" />
                                <div>
                                    <p className="font-semibold text-green-900">Proposta Assinada</p>
                                    <p className="text-sm text-green-700">
                                        Esta proposta foi assinada em {proposal.signedAt && new Date(proposal.signedAt).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Preview */}
                    <div className="bg-card rounded-xl shadow-lg p-8 overflow-hidden">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-2xl font-bold">Conteúdo da Proposta</h2>
                            <Button variant="outline" size="sm" onClick={() => window.print()}>
                                <FileText className="h-4 w-4 mr-2" />
                                Imprimir / Salvar PDF
                            </Button>
                        </div>

                        {/* Render proposal content */}
                        {proposal.content ? (
                            <div className="flex flex-col items-center gap-8 bg-muted/50 p-8 rounded-xl border border-dashed border-gray-300">
                                {/* Construct Pseudo-Deal for Components */}
                                {(() => {
                                    const config = proposal.content.config || {};
                                    const p = proposal as any;
                                    const pseudoDeal: any = {
                                        id: p.dealId,
                                        title: p.dealTitle || p.title,
                                        company: p.company || p.customer_name || 'Cliente',
                                        value: p.total,
                                        stage: 'proposal',
                                        deal_products: p.products || []
                                    };

                                    return (
                                        <div className="scale-[0.6] origin-top space-y-8" style={{ width: '210mm' }}>
                                            {config.includeCover && (
                                                <div className="shadow-2xl">
                                                    <ProposalCoverPage
                                                        dealTitle={pseudoDeal.title}
                                                        companyName={pseudoDeal.company}
                                                        date={new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                                                        clientLogo={config.clientLogo}
                                                    />
                                                </div>
                                            )}

                                            {config.includeConfidentiality && (
                                                <div className="shadow-2xl">
                                                    <ProposalConfidentialityPage />
                                                </div>
                                            )}

                                            {config.includeOverview && (
                                                <div className="shadow-2xl">
                                                    <ProposalOverviewPage dealTitle={pseudoDeal.title} aiSummary={proposal.content?.aiSummary} />
                                                </div>
                                            )}

                                            {config.includeHardware && (
                                                <div className="shadow-2xl">
                                                    <ProposalHardwarePage deal={pseudoDeal} />
                                                </div>
                                            )}

                                            {config.includeSoftware && (
                                                <div className="shadow-2xl">
                                                    <ProposalSoftwarePage deal={pseudoDeal} />
                                                </div>
                                            )}

                                            {config.includeInvestment && (
                                                <div className="shadow-2xl">
                                                    <ProposalInvestmentPage deal={pseudoDeal} />
                                                </div>
                                            )}

                                            {config.includeDifferentials && (
                                                <div className="shadow-2xl">
                                                    <ProposalDifferentialsPage />
                                                </div>
                                            )}
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                Conteúdo não disponível para visualização web.
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center text-sm text-muted-foreground">
                        <p>Esta é uma visualização pública da proposta. O link é confidencial e intransferível.</p>
                    </div>
                </div>
            </div>

            {/* Signature Modal */}
            <SignatureModal
                isOpen={showSignatureModal}
                onClose={() => setShowSignatureModal(false)}
                proposalToken={token}
                proposalTitle={proposal.title}
                companyName={(proposal as any).company || (proposal as any).customer_name}
            />
        </>
    );
}
