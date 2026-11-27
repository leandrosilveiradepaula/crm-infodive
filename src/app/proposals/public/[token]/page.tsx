'use client';

import { useEffect, useState, type ReactNode } from 'react';
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
import { ProposalCustomNotesPage } from '@/components/proposals/ProposalCustomNotesPage';

export default function PublicProposalPage() {
    const params = useParams();
    const token = params?.token as string;

    const [proposal, setProposal] = useState<Proposal | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showSignatureModal, setShowSignatureModal] = useState(false);

    useEffect(() => {
        if (!token) return;

        setLoading(true);
        setError(null);
        setProposal(null);
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
            <div className="min-h-screen flex items-center justify-center bg-surface-highlight">
                <div role="status" className="text-center p-4">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground">Carregando proposta...</p>
                </div>
            </div>
        );
    }

    if (error || !proposal) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface-highlight">
                <div role="alert" className="text-center max-w-md p-4">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <h1 className="text-page-title font-bold mb-2">Proposta Não Encontrada</h1>
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
            sent: { label: 'Enviada', color: 'bg-surface-highlight text-primary' },
            viewed: { label: 'Visualizada', color: 'bg-info-subtle text-foreground' },
            signed: { label: 'Assinada', color: 'bg-success-subtle text-success-readable' },
            rejected: { label: 'Rejeitada', color: 'bg-destructive-subtle text-destructive-readable' },
        };

        const config = configs[status as keyof typeof configs] || configs.draft;

        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-body-ui font-medium ${config.color}`}>
                {config.label}
            </span>
        );
    };

    const canSign = proposal.allow_signature && ['sent', 'viewed'].includes(proposal.status);
    const isSigned = proposal.status === 'signed';

    return (
        <>
            <main data-slot="public-proposal" className="min-h-screen bg-background py-6 sm:py-12 px-3 sm:px-4">
                <div className="max-w-4xl mx-auto">
                    {/* Header Card */}
                    <div className="bg-card rounded-[var(--radius-panel)] shadow-card-ui p-4 sm:p-8 mb-6">
                        <div className="flex flex-wrap gap-3 items-start justify-between mb-6">
                            <div>
                                <h1 className="text-metric-ui font-bold text-foreground mb-2">{proposal.title}</h1>
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
                                    <p className="text-metadata-ui text-muted-foreground">Data de Criação</p>
                                    <p className="font-medium">{new Date(proposal.createdAt).toLocaleDateString('pt-BR')}</p>
                                </div>
                            </div>

                            {proposal.validUntil && (
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-metadata-ui text-muted-foreground">Válida Até</p>
                                        <p className="font-medium">{new Date(proposal.validUntil).toLocaleDateString('pt-BR')}</p>
                                    </div>
                                </div>
                            )}

                            <div className="flex items-center gap-3">
                                <Eye className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-metadata-ui text-muted-foreground">Versão</p>
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
                                <div className="flex justify-between items-center mb-2 text-success-readable">
                                    <span>Desconto ({proposal.discountPercentage}%)</span>
                                    <span>-{formatCurrency(proposal.discount)}</span>
                                </div>
                            )}
                            <div className="flex justify-between items-center text-section-title font-bold border-t pt-4">
                                <span>Total</span>
                                <span className="text-primary">{formatCurrency(proposal.total)}</span>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        {canSign && (
                            <div className="mt-6">
                                <Button
                                    onClick={() => setShowSignatureModal(true)}
                                    className="w-full h-[var(--ds-control-height-large)]"
                                >
                                    <CheckCircle2 className="h-5 w-5 mr-2" />
                                    Assinar Proposta
                                </Button>
                            </div>
                        )}

                        {isSigned && (
                            <div className="mt-6 bg-success-subtle border border-success rounded-[var(--radius-control)] p-4 flex items-center gap-3">
                                <CheckCircle2 className="h-6 w-6 text-success-readable" />
                                <div>
                                    <p className="font-semibold text-success-readable">Proposta Assinada</p>
                                    <p className="text-body-ui text-success-readable">
                                        Esta proposta foi assinada em {proposal.signedAt && new Date(proposal.signedAt).toLocaleString('pt-BR')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Content Preview */}
                    <div className="bg-card rounded-[var(--radius-panel)] shadow-card-ui p-4 sm:p-8 min-w-0">
                        <div className="flex flex-wrap gap-3 justify-between items-center mb-6">
                            <h2 className="text-page-title font-bold">Conteúdo da Proposta</h2>
                            <Button variant="outline" size="sm" onClick={() => window.print()}>
                                <FileText className="h-4 w-4 mr-2" />
                                Imprimir / Salvar PDF
                            </Button>
                        </div>

                        {/* Render proposal content */}
                        {proposal.content ? (
                            <div role="region" aria-label="Documento público" tabIndex={0} className="overflow-x-auto bg-surface-subtle p-3 sm:p-6 rounded-[var(--radius-panel)] border border-border focus-ring">
                                {/* Construct Pseudo-Deal for Components */}
                                {(() => {
                                    const config = proposal.content.config || {};
                                    const active = Array.isArray(proposal.content.activeSections) ? proposal.content.activeSections : null;
                                    const legacy = ['cover','confidentiality','overview','hardware','software','investment','differentials'].filter(section => config['include' + section[0].toUpperCase() + section.slice(1)]);
                                    const sectionOrder = [...new Set<string>(active || legacy)];
                                    const p = proposal as any;
                                    const pseudoDeal: any = {
                                        id: p.dealId,
                                        title: p.dealTitle || p.title,
                                        company: p.company || p.customer_name || 'Cliente',
                                        value: p.total,
                                        stage: 'proposal',
                                        deal_products: p.products_json || p.products || []
                                    };

                                    // Render the stored section selection in its stored order.
                                    // Keep legacy boolean configuration compatible.
                                    const pages: Record<string, ReactNode> = {
                                        cover: <ProposalCoverPage dealTitle={pseudoDeal.title} companyName={pseudoDeal.company}
                                            mainTitle={proposal.content.editableTexts?.proposalTitle}
                                            date={new Date(proposal.createdAt).toLocaleDateString('pt-BR')} clientLogo={config.clientLogo} />,
                                        confidentiality: <ProposalConfidentialityPage />,
                                        overview: <ProposalOverviewPage dealTitle={pseudoDeal.title} aiSummary={proposal.content.aiSummary} objectives={proposal.content.objectives} />,
                                        hardware: <ProposalHardwarePage deal={pseudoDeal} simplifiedProductNames={proposal.content.simplifiedProductNames} />,
                                        software: <ProposalSoftwarePage deal={pseudoDeal} simplifiedProductNames={proposal.content.simplifiedProductNames} />,
                                        custom_notes: <ProposalCustomNotesPage title={proposal.content.editableTexts?.customNotesTitle || 'Notas Adicionais'}
                                            content={proposal.content.editableTexts?.customNotesContent || ''} />,
                                        investment: <ProposalInvestmentPage deal={pseudoDeal} simplifiedProductNames={proposal.content.simplifiedProductNames} />,
                                        differentials: <ProposalDifferentialsPage />,
                                    };
                                    const visibleSections = sectionOrder.filter(section => Object.hasOwn(pages, section));
                                    return visibleSections.length ? (
                                        <div className="space-y-8" style={{ width: '210mm', zoom: 'var(--ds-public-document-preview-scale)' }}>
                                            {visibleSections.map(section => <div key={section} className="shadow-card-ui" data-document-section={section}>{pages[section]}</div>)}
                                        </div>
                                    ) : <p className="text-muted-foreground p-4">Nenhuma seção disponível para visualização.</p>;
                                })()}
                            </div>
                        ) : (
                            <div className="text-center py-12 text-muted-foreground">
                                Conteúdo não disponível para visualização web.
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="mt-8 text-center text-body-ui text-muted-foreground">
                        <p>Esta é uma visualização pública da proposta. O link é confidencial e intransferível.</p>
                    </div>
                </div>
            </main>

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
