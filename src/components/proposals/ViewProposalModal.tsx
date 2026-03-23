import React, { useRef, useState, useEffect } from 'react';

import { Download, Send, Trash2, Calendar, User, ShieldCheck, ExternalLink, FileText, TrendingUp, Loader2, History } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

import { ProposalCoverPage } from './ProposalCoverPage';
import { ProposalOverviewPage } from './ProposalOverviewPage';
import { ProposalHardwarePage } from './ProposalHardwarePage';
import { ProposalSoftwarePage } from './ProposalSoftwarePage';
import { ProposalInvestmentPage } from './ProposalInvestmentPage';
import { ProposalDifferentialsPage } from './ProposalDifferentialsPage';
import { ProposalConfidentialityPage } from './ProposalConfidentialityPage';
import { ProposalProductsTable } from './ProposalProductsTable';
import { ProposalVersionHistory } from './ProposalVersionHistory';

import { useProposalPdf } from '@/hooks/useProposalPdf';
import { useProposalPpt } from '@/hooks/useProposalPpt';
import { formatCurrency } from '@/utils/analytics';
import { PROPOSAL_STATUS } from '@/lib/constants';
import { getOrganizationTheme } from '@/app/actions/theme-actions';
import type { Proposal } from '@/types/proposal';
import type { Deal } from '@/types/deal';

interface ViewProposalModalProps {
    proposal: Proposal;
    isOpen: boolean;
    onClose: () => void;
    onDelete: (id: string) => void;
    onUpdateStatus: (id: string, updates: Partial<Proposal> & Record<string, unknown>) => void;
    distributors?: Array<{ id: string; name: string;[key: string]: unknown }>;
}

export const ViewProposalModal: React.FC<ViewProposalModalProps> = ({
    proposal,
    isOpen,
    onClose,
    onDelete,
    onUpdateStatus,
    distributors = []
}) => {
    const handleDelete = async () => {
        await onDelete(proposal.id);
    };

    const handleSend = async () => {
        try {
            // Generate public token if not exists
            const publicToken = proposal.public_token || crypto.randomUUID().replace(/-/g, '').substring(0, 16);

            const updates = {
                status: PROPOSAL_STATUS.SENT,
                sentAt: new Date().toISOString(),
                public_token: publicToken,
                allow_signature: true
            };

            await onUpdateStatus(proposal.id, updates);

            toast.success(`Proposta ${proposal.number} liberada com sucesso!`);
        } catch (error) {
            console.error('❌ Erro ao enviar proposta:', error);
            toast.error('Erro ao enviar proposta');
        }
    };

    const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

    // Refs for PDF capture
    const coverRef = useRef<HTMLDivElement>(null);
    const overviewRef = useRef<HTMLDivElement>(null);
    const hardwareRef = useRef<HTMLDivElement>(null);
    const softwareRef = useRef<HTMLDivElement>(null);
    const investmentRef = useRef<HTMLDivElement>(null);
    const differentialsRef = useRef<HTMLDivElement>(null);
    const confidentialityRef = useRef<HTMLDivElement>(null);

    const [orgTheme, setOrgTheme] = useState<{ theme_primary: string | null; theme_accent: string | null }>({
        theme_primary: null,
        theme_accent: null
    });

    useEffect(() => {
        const fetchOrgTheme = async () => {
            const theme = await getOrganizationTheme();
            setOrgTheme(theme);
        };
        fetchOrgTheme();
    }, []);

    const { generatingPdf, handleDownload } = useProposalPdf();
    const { generatingPpt, handleDownloadPpt } = useProposalPpt();

    const onDownloadClick = () => {
        handleDownload(proposal, {
            coverRef,
            overviewRef,
            hardwareRef,
            softwareRef,
            investmentRef,
            differentialsRef,
            confidentialityRef
        });
    };

    const onDownloadPptClick = () => {
        handleDownloadPpt(proposal, {
            coverRef,
            overviewRef,
            hardwareRef,
            softwareRef,
            investmentRef,
            differentialsRef,
            confidentialityRef
        });
    };

    const handleCopyLink = () => {
        const link = `${window.location.origin}/proposals/public/${proposal.public_token}`;
        navigator.clipboard.writeText(link);
        toast.success('Link copiado para área de transferência!', {
            description: 'Compartilhe este link com o cliente para visualização e assinatura da proposta.',
            duration: 5000
        });
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case PROPOSAL_STATUS.SIGNED: return { label: 'Assinada', color: 'bg-success/10 text-success border-success/20', icon: ShieldCheck };
            case PROPOSAL_STATUS.SENT: return { label: 'Enviada', color: 'bg-primary/10 text-primary border-primary/20', icon: Send };
            case PROPOSAL_STATUS.VIEWED: return { label: 'Visualizada', color: 'bg-stage-proposal/10 text-stage-proposal border-stage-proposal/20', icon: User };
            case PROPOSAL_STATUS.DRAFT: return { label: 'Rascunho', color: 'bg-muted/50 text-muted-foreground border-border', icon: FileText };
            default: return { label: status, color: 'bg-muted/50 text-muted-foreground border-border', icon: FileText };
        }
    };

    const statusInfo = getStatusInfo(proposal.status);
    const StatusIcon = statusInfo.icon;
    const aiSummary = proposal.content?.aiSummary;
    const config = proposal.content?.config || {};

    // Pseudo-deal construction for components
    // We need to fetch/construct a 'deal' object structure if possible, or pass partial data
    // The components expect a 'Deal' object. We can construct a subset.
    const propRecord = proposal as unknown as Record<string, unknown>;
    const pseudoDeal = {
        id: proposal.deal_id || proposal.id,
        title: (propRecord.dealTitle as string) || proposal.title,
        company: proposal.company_name || (propRecord.company as string) || (propRecord.customer_name as string) || 'Cliente',
        value: proposal.total,
        stage: 'proposal',
        deal_products: (propRecord.products_json as Array<Record<string, unknown>>) || proposal.products || proposal.content?.products || []
    } as unknown as Deal;

    const productsList = pseudoDeal.deal_products;
    const expirationDate = proposal.validUntil || (proposal.createdAt ? new Date(new Date(proposal.createdAt).getTime() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString() : 'N/A');

    if (!isOpen) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl w-[95vw] h-[85vh] max-h-[92vh] flex flex-col p-0 gap-0 overflow-hidden shadow-2xl">
                {/* Header */}
                <div className="p-6 md:p-8 border-b border-border flex justify-between items-center relative overflow-hidden bg-gradient-to-r from-primary/5 to-transparent flex-shrink-0">
                    <div className="flex items-center gap-6 relative z-10 w-full">
                        <div className="h-12 w-12 rounded-xl bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                            <FileText className="h-6 w-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 flex-wrap">
                                <DialogTitle className="text-2xl font-black text-foreground uppercase tracking-tight leading-none truncate">
                                    {proposal.title}
                                </DialogTitle>
                                <span className={`flex items-center gap-2 px-2.5 py-0.5 rounded-full text-[8px] font-black uppercase border tracking-widest ${statusInfo.color}`}>
                                    <StatusIcon className="h-2.5 w-2.5" /> {statusInfo.label}
                                </span>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                                <span className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md border border-border/50">
                                    <User className="h-3 w-3 text-primary" />
                                    <span className="truncate max-w-[200px]">{pseudoDeal.company}</span>
                                </span>
                                <span className="flex items-center gap-1.5 bg-background/50 px-2 py-1 rounded-md border border-border/50">
                                    <Calendar className="h-3 w-3 text-success" />
                                    Expira: {expirationDate}
                                </span>
                                <span className="hidden md:inline-block opacity-40">|</span>
                                <span className="hidden md:inline-block opacity-60">Asset #{proposal.number}</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-muted/30">
                    <Tabs defaultValue="resume" className="w-full h-full flex flex-col">
                        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border px-6 md:px-8 py-2">
                            <TabsList className="bg-muted w-full md:w-auto overflow-x-auto justify-start flex-nowrap hide-scrollbar">
                                <TabsTrigger value="resume" className="min-w-[100px] gap-2"><FileText className="w-3.5 h-3.5" />Resumo</TabsTrigger>
                                <TabsTrigger value="products" className="min-w-[100px] gap-2"><ShieldCheck className="w-3.5 h-3.5" />Produtos</TabsTrigger>
                                <TabsTrigger value="financial" className="min-w-[100px] gap-2"><TrendingUp className="w-3.5 h-3.5" />Financeiro</TabsTrigger>
                                <TabsTrigger value="actions" className="min-w-[100px] gap-2"><Send className="w-3.5 h-3.5" />Ações</TabsTrigger>
                                <TabsTrigger value="history" className="min-w-[100px] gap-2"><History className="w-3.5 h-3.5" />Histórico</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="p-6 md:p-8 flex-1">
                            {/* TAB: RESUMO */}
                            <TabsContent value="resume" className="mt-0 h-full">
                                <div className="space-y-6 max-w-4xl mx-auto">
                                    {aiSummary ? (
                                        <div className="bg-gradient-to-br from-stage-proposal/5 to-primary/5 p-8 rounded-3xl border border-stage-proposal/10 shadow-sm relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-stage-proposal/10 rounded-full blur-3xl -mr-10 -mt-10" />
                                            <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -ml-10 -mb-10" />
                                            <div className="relative">
                                                <div className="flex items-center gap-3 mb-4">
                                                    <div className="h-8 w-8 rounded-lg bg-stage-proposal text-white flex items-center justify-center shadow-lg shadow-stage-proposal/20">
                                                        <TrendingUp className="h-4 w-4" />
                                                    </div>
                                                    <h4 className="text-sm font-black uppercase tracking-widest text-stage-proposal">Resumo Executivo IA</h4>
                                                </div>
                                                <p className="text-sm text-foreground leading-relaxed whitespace-pre-line relative z-10">{aiSummary}</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center p-12 bg-card rounded-3xl border border-border text-center">
                                            <div className="h-12 w-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mb-4">
                                                <FileText className="h-6 w-6" />
                                            </div>
                                            <h3 className="text-lg font-bold text-foreground">Proposta Gerada</h3>
                                            <p className="text-muted-foreground mt-2 max-w-sm">Esta proposta não possui um resumo automático gerado pela IA, mas todos os detalhes estão nas abas seguintes.</p>
                                        </div>
                                    )}

                                    {/* Preview simplificado */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-4">
                                        {['Capa', 'Confidencialidade', 'Premissas'].map((label, i) => (
                                            <div key={i} className="aspect-[1/1.414] bg-card border border-border border-dashed rounded-xl shadow-sm flex items-center justify-center relative overflow-hidden group hover:border-primary transition-colors cursor-default">
                                                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <FileText className="h-8 w-8 text-muted-foreground/30 group-hover:text-primary/50 transition-colors" />
                                                <div className="absolute bottom-3 left-0 w-full text-center">
                                                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground group-hover:text-primary transition-colors">{label}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB: PRODUTOS */}
                            <TabsContent value="products" className="mt-0">
                                <div className="bg-white rounded-3xl border border-border shadow-sm p-6 overflow-hidden min-h-[500px]">
                                    <ProposalProductsTable productsList={productsList || []} />
                                </div>
                            </TabsContent>

                            {/* TAB: FINANCEIRO */}
                            <TabsContent value="financial" className="mt-0">
                                <div className="max-w-xl mx-auto space-y-6">
                                    <div className="bg-gradient-to-br from-primary to-stage-proposal p-8 rounded-3xl text-white shadow-xl relative overflow-hidden">
                                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
                                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-black/10 rounded-full blur-2xl" />

                                        <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-6 flex items-center gap-2">
                                            <ShieldCheck className="w-3.5 h-3.5" />
                                            Resumo Financeiro
                                        </p>

                                        <div className="space-y-4 relative z-10">
                                            <div className="flex justify-between items-center pb-4 border-b border-white/20">
                                                <span className="text-sm font-bold uppercase tracking-wide opacity-90">Subtotal Produtos</span>
                                                <span className="text-xl font-bold">{formatCurrency(proposal.subtotal)}</span>
                                            </div>
                                            <div className="pt-2">
                                                <p className="text-[10px] font-black uppercase tracking-widest opacity-80 mb-2">Total Oportunidade</p>
                                                <div className="flex justify-between items-baseline">
                                                    <span className="text-4xl font-black tracking-tight">{formatCurrency(proposal.total)}</span>
                                                    <span className="text-sm font-bold opacity-80 uppercase tracking-widest">BRL</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Breakdown por Distribuidor (Placeholder para futura expansão) */}
                                    <div className="bg-white p-6 rounded-3xl border border-border shadow-sm">
                                        <h3 className="text-sm font-bold text-foreground uppercase tracking-widest mb-4">Quebra por Faturamento</h3>
                                        <div className="space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2 h-2 rounded-full bg-primary" />
                                                    <span className="text-sm font-medium">Faturamento Direto</span>
                                                </div>
                                                <span className="text-sm font-bold text-foreground">100%</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB: AÇÕES */}
                            <TabsContent value="actions" className="mt-0">
                                <div className="max-w-2xl mx-auto space-y-6">
                                    {/* Link de Apresentação */}
                                    <div className="bg-white p-6 rounded-3xl border border-border shadow-sm">
                                        <div className="flex items-start gap-4 mb-4">
                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                                                <ExternalLink className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Apresentação Pública</h3>
                                                <p className="text-sm text-muted-foreground mt-1">Gerencie o acesso do cliente à proposta digital.</p>
                                            </div>
                                        </div>

                                        {proposal.public_token ? (
                                            <div className="bg-muted inline-flex items-center h-10 px-3 rounded-lg w-full mb-4 focus-within:ring-2 focus-within:ring-primary/20 border border-border">
                                                <span className="text-muted-foreground truncate flex-1 text-sm font-mono mr-3">
                                                    {window.location.origin}/proposals/public/{proposal.public_token}
                                                </span>
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    onClick={handleCopyLink}
                                                    className="shrink-0 h-7 text-xs font-bold uppercase tracking-wider text-primary hover:bg-primary/10 hover:text-primary"
                                                >
                                                    Copiar Link
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="bg-primary/10 border border-primary/20 p-4 rounded-xl mb-4 text-sm text-primary font-medium">
                                                A proposta não possui um link de apresentação pública ativo. Ela deve ser marcada como enviada para gerar o link.
                                            </div>
                                        )}

                                        <Button
                                            onClick={handleSend}
                                            className="w-full bg-primary hover:bg-primary/90 text-white font-bold tracking-wide h-12 shadow-lg shadow-primary/20"
                                            disabled={proposal.status === PROPOSAL_STATUS.SENT || proposal.status === PROPOSAL_STATUS.SIGNED}
                                        >
                                            <Send className="w-4 h-4 mr-2" />
                                            Liberar para o Cliente
                                        </Button>
                                    </div>

                                    {/* Download Actions */}
                                    <div className="bg-white p-6 rounded-3xl border border-border shadow-sm flex flex-col items-center gap-6 justify-between">
                                        <div className="flex items-center gap-4 w-full">
                                            <div className="h-10 w-10 shrink-0 rounded-xl bg-stage-proposal/10 text-stage-proposal flex items-center justify-center">
                                                <Download className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-foreground font-black uppercase tracking-widest">Documentos Estáticos</h3>
                                                <p className="text-xs text-muted-foreground uppercase font-bold">Exportar versão para apresentação ou impressão.</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex flex-col md:flex-row gap-3 w-full">
                                            <Button
                                                onClick={onDownloadClick}
                                                disabled={generatingPdf || generatingPpt}
                                                variant="outline"
                                                className="flex-1 border-primary/20 text-primary hover:bg-primary/5 font-bold tracking-wide h-12 rounded-xl"
                                            >
                                                {generatingPdf ? (
                                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando PDF...</>
                                                ) : (
                                                    <><Download className="mr-2 h-4 w-4" /> Baixar PDF</>
                                                )}
                                            </Button>

                                            <Button
                                                onClick={onDownloadPptClick}
                                                disabled={generatingPdf || generatingPpt}
                                                variant="outline"
                                                className="flex-1 border-stage-proposal/20 text-stage-proposal hover:bg-stage-proposal/5 font-bold tracking-wide h-12 rounded-xl"
                                            >
                                                {generatingPpt ? (
                                                    <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando PPT...</>
                                                ) : (
                                                    <><FileText className="mr-2 h-4 w-4" /> Baixar PPT (Híbrido)</>
                                                )}
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Status Control */}
                                    <div className="bg-white p-6 rounded-3xl border border-border shadow-sm">
                                        <div className="space-y-3">
                                            <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider px-1 flex items-center gap-2">
                                                <div className="h-1 w-1 bg-gray-400 rounded-full" />
                                                Controle de Status
                                            </label>
                                            <Select
                                                value={proposal.status}
                                                onValueChange={async (newStatus) => {
                                                    const updates: Partial<Proposal> & Record<string, unknown> = { status: newStatus as Proposal['status'] };

                                                    if (newStatus === PROPOSAL_STATUS.SIGNED) {
                                                        updates.signedAt = new Date().toISOString();
                                                    } else if (newStatus === PROPOSAL_STATUS.VIEWED) {
                                                        updates.viewedAt = new Date().toISOString();
                                                    } else if (newStatus === PROPOSAL_STATUS.SENT) {
                                                        updates.sentAt = new Date().toISOString();
                                                    }

                                                    await onUpdateStatus(proposal.id, updates);
                                                    toast.success(`Status atualizado para ${getStatusInfo(newStatus).label}`);
                                                }}
                                            >
                                                <SelectTrigger
                                                    className={`w-full h-12 rounded-xl transition-all duration-300 border shadow-sm hover:shadow-md ${proposal.status === PROPOSAL_STATUS.SIGNED ? 'bg-success/5 border-success/20 text-success font-bold' :
                                                        proposal.status === PROPOSAL_STATUS.REJECTED ? 'bg-destructive/5 border-destructive/20 text-destructive font-bold' :
                                                            proposal.status === PROPOSAL_STATUS.SENT ? 'bg-primary/5 border-primary/20 text-primary font-bold' :
                                                                'bg-card border-border text-foreground hover:bg-muted font-bold'
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`h-2.5 w-2.5 rounded-full ring-2 ring-white shadow-sm ${proposal.status === PROPOSAL_STATUS.SIGNED ? 'bg-success' :
                                                            proposal.status === PROPOSAL_STATUS.REJECTED ? 'bg-destructive' :
                                                                proposal.status === PROPOSAL_STATUS.SENT ? 'bg-primary' :
                                                                    'bg-gray-400'
                                                            }`} />
                                                        <SelectValue placeholder="Selecione o Status" />
                                                    </div>
                                                </SelectTrigger>
                                                <SelectContent className="font-bold">
                                                    <SelectItem value={PROPOSAL_STATUS.DRAFT} className="text-muted-foreground uppercase text-[10px]">Draft (Rascunho)</SelectItem>
                                                    <SelectItem value={PROPOSAL_STATUS.SENT} className="text-primary uppercase text-[10px]">Enviada</SelectItem>
                                                    <SelectItem value={PROPOSAL_STATUS.VIEWED} className="text-stage-proposal uppercase text-[10px]">Visualizada</SelectItem>
                                                    <SelectItem value={PROPOSAL_STATUS.SIGNED} className="text-success uppercase text-[10px]">Assinada (Aceite Manual)</SelectItem>
                                                    <SelectItem value={PROPOSAL_STATUS.REJECTED} className="text-destructive uppercase text-[10px]">Rejeitada</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </TabsContent>

                            {/* TAB: HISTÓRICO */}
                            <TabsContent value="history" className="mt-0">
                                <div className="max-w-4xl mx-auto">
                                    <ProposalVersionHistory dealId={proposal.deal_id || proposal.dealId} currentProposalId={proposal.id} />
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>

                {/* Hidden Render Container for PDF / PPT */}
                {
                    (generatingPdf || generatingPpt) && (
                        <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                            <div ref={coverRef}>
                                <ProposalCoverPage
                                    dealTitle={pseudoDeal.title}
                                    companyName={pseudoDeal.company}
                                    date={new Date(proposal.createdAt).toLocaleDateString('pt-BR')}
                                    clientLogo={config.clientLogo}
                                    themePrimary={orgTheme.theme_primary || undefined}
                                    themeAccent={orgTheme.theme_accent || undefined}
                                    layout={generatingPpt ? 'landscape' : 'portrait'}
                                    hideValues={generatingPpt}
                                />
                            </div>

                            <div ref={confidentialityRef}>
                                <ProposalConfidentialityPage
                                    themePrimary={orgTheme.theme_primary || undefined}
                                    themeAccent={orgTheme.theme_accent || undefined}
                                    layout={generatingPpt ? 'landscape' : 'portrait'}
                                />
                            </div>

                            <div ref={overviewRef}>
                                <ProposalOverviewPage
                                    dealTitle={pseudoDeal.title}
                                    aiSummary={aiSummary}
                                    themePrimary={orgTheme.theme_primary || undefined}
                                    themeAccent={orgTheme.theme_accent || undefined}
                                    layout={generatingPpt ? 'landscape' : 'portrait'}
                                />
                            </div>

                            <div ref={hardwareRef}>
                                <ProposalHardwarePage
                                    deal={pseudoDeal}
                                    themePrimary={orgTheme.theme_primary || undefined}
                                    themeAccent={orgTheme.theme_accent || undefined}
                                    layout={generatingPpt ? 'landscape' : 'portrait'}
                                />
                            </div>

                            <div ref={softwareRef}>
                                <ProposalSoftwarePage
                                    deal={pseudoDeal}
                                    themePrimary={orgTheme.theme_primary || undefined}
                                    themeAccent={orgTheme.theme_accent || undefined}
                                    layout={generatingPpt ? 'landscape' : 'portrait'}
                                />
                            </div>

                            <div ref={investmentRef}>
                                <ProposalInvestmentPage
                                    deal={pseudoDeal}
                                    distributors={distributors}
                                    config={config}
                                    themePrimary={orgTheme.theme_primary || undefined}
                                    themeAccent={orgTheme.theme_accent || undefined}
                                    layout={generatingPpt ? 'landscape' : 'portrait'}
                                />
                            </div>

                            <div ref={differentialsRef}>
                                <ProposalDifferentialsPage
                                    themePrimary={orgTheme.theme_primary || undefined}
                                    themeAccent={orgTheme.theme_accent || undefined}
                                    layout={generatingPpt ? 'landscape' : 'portrait'}
                                />
                            </div>
                        </div>
                    )
                }
            </DialogContent>
        </Dialog>
    );
};
