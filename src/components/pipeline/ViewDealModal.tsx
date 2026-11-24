
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    X, Save, Edit, History, Package, MessageSquare, Clock, Paperclip,
    TrendingUp, DollarSign, User, Users, Calendar, Activity as ActivityIcon,
    Plus, Trash2, FileText, CheckCircle2, AlertTriangle, MoreHorizontal, AlertCircle,
    Bot, ShieldCheck, Mail, Building2, Phone, Edit2, Scroll, FileSpreadsheet,
    Briefcase, Zap, CreditCard, CheckSquare, Globe, Copy, ArrowRight, ExternalLink,
    LayoutDashboard, File as FileIcon, FolderOpen
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';

import type { Deal } from '@/types/deal';
import {
    updateDeal, updateDealStage, getDealDetails, getOrCreateRoom, fetchProposals,
    updateProposal,
    deleteProposal,
    getAccounts,
    getAccountContacts
} from '@/app/(dashboard)/pipeline/actions';
import { ProductDetailsTable } from './ProductDetailsTable';
import { DealProductsTab } from './DealProductsTab';
import { PartnersTab } from './tabs/PartnersTab';
import { StakeholdersTab } from './tabs/StakeholdersTab';
import { OverviewTab } from './tabs/OverviewTab';
import { HistoryTab } from './tabs/HistoryTab';
import { FilesTab } from './tabs/FilesTab';
import { DealDoctorFinal } from './ai/DealDoctorFinal';
import { RiskRadar } from './ai/RiskRadar';
import { DealSuggestedActions } from './ai/DealSuggestedActions';
import { AIEmailDrafter } from './ai/AIEmailDrafter';
import { ContractBuilder } from '../contracts/ContractBuilder';
import { LostDealModal } from './LostDealModal';
import { WonDealWizard } from './WonDealWizard';
import { TechnicalHandoverModal } from '../handover/TechnicalHandoverModal';
// ProposalGeneratorWizard replaced by full-screen editor route
import { ProposalsTab } from '../proposals/ProposalsTab';
import { ViewProposalModal } from '../proposals/ViewProposalModal';
import type { Proposal } from '@/types/proposal';
import { SmartTimeline } from '../omnichannel/SmartTimeline';
import { formatCurrency } from '@/utils/format';
import { calculateDealValue } from '@/utils/dealCalculations';
import { DealActivityTimeline } from './DealActivityTimeline';
import { useDeals } from '@/hooks/useDeals';

import { Account } from '@/types/account';
import { Contact } from '@/types/contact';

// All sections remain mounted under the same existing Radix Tabs instance.
// The overflow selector reduces tab density without removing a destination.
const secondaryTabs = [
    { value: 'partners', label: 'Parceiros' },
    { value: 'stakeholders', label: 'Clientes' },
    { value: 'documents', label: 'Documentos' },
    { value: 'omnichannel', label: 'Comunicações' },
    { value: 'history', label: 'Histórico' },
] as const;

interface ViewDealModalProps {
    deal: Deal;
    isOpen: boolean;
    onClose: () => void;
    distributors?: Account[];
    allAccounts?: Account[];
    initialTab?: string;
}

export function ViewDealModal({ deal: initialDeal, isOpen, onClose, distributors = [], allAccounts = [], initialTab = 'overview' }: ViewDealModalProps) {
    const router = useRouter();
    const returnFocusRef = React.useRef<HTMLElement | null>(null);
    const { duplicateDeal } = useDeals();
    const [deal, setDeal] = useState<Deal>(initialDeal);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isProductsLoading, setIsProductsLoading] = useState(false);
    const [accounts, setAccounts] = useState<{ id: string, name: string }[]>([]);
    const [allContacts, setAllContacts] = useState<Contact[]>([]);
    const [contactsLoaded, setContactsLoaded] = useState(false);

    // AI & Modules State
    const [showDealDoctor, setShowDealDoctor] = useState(false);
    const [showEmailDrafter, setShowEmailDrafter] = useState(false);
    const [showContractBuilder, setShowContractBuilder] = useState(false);
    // Workflow States
    const [showLostModal, setShowLostModal] = useState(false);
    const [showWonWizard, setShowWonWizard] = useState(false);
    const [showHandoverModal, setShowHandoverModal] = useState(false);
    // Navigation to full-screen editor replaces the modal wizard
    const [focusedProposal, setFocusedProposal] = useState<Proposal | null>(null);
    const [showViewProposalModal, setShowViewProposalModal] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: initialDeal.title,
        value: initialDeal.value,
        company: initialDeal.company,
        account_id: initialDeal.account_id,
        client_contact_id: initialDeal.client_contact_id,
        contact_name: initialDeal.contact_name,
        contact_email: initialDeal.contact_email,
        contact_phone: initialDeal.contact_phone,
        expected_close_date: initialDeal.expected_close_date?.split('T')[0] || '',
        probability: initialDeal.probability || 20,
        billing_type: initialDeal.billing_type || 'direct'
    });

    // State for forcing refresh of proposals list
    const [proposalsRefreshKey, setProposalsRefreshKey] = useState(0);
    const [prevDealId, setPrevDealId] = useState(initialDeal.id);

    useEffect(() => {
        // Robust Sync: If the parent props change (e.g. after revalidatePath), 
        // we must update our local state.
        const hasIdChanged = prevDealId !== initialDeal.id;

        if (hasIdChanged) {
            setDeal(initialDeal);
            setPrevDealId(initialDeal.id);
        } else if (!isEditing) {
            // Sync from server when NOT editing.
            setDeal(prev => {
                // Avoid unnecessary updates if products are the same
                if (JSON.stringify(prev.deal_products) === JSON.stringify(initialDeal.deal_products) &&
                    prev.value === initialDeal.value &&
                    prev.title === initialDeal.title) {
                    return prev;
                }
                return {
                    ...prev,
                    ...initialDeal,
                    deal_products: initialDeal.deal_products || [],
                    owner_profile: initialDeal.owner_profile || prev.owner_profile
                };
            });
        } else {
            // While editing: only sync deal_products from server if none locally (safeguard)
            if (!deal.deal_products || deal.deal_products.length === 0) {
                setDeal(prev => ({
                    ...prev,
                    deal_products: initialDeal.deal_products,
                    owner_profile: initialDeal.owner_profile || prev.owner_profile
                }));
            }
        }

        // Only sync formData if NOT editing or if switched to a completely different deal
        if (hasIdChanged || !isEditing) {
            setFormData({
                title: initialDeal.title,
                value: initialDeal.value,
                company: initialDeal.company,
                account_id: initialDeal.account_id,
                client_contact_id: initialDeal.client_contact_id,
                contact_name: initialDeal.contact_name,
                contact_email: initialDeal.contact_email,
                contact_phone: initialDeal.contact_phone,
                expected_close_date: initialDeal.expected_close_date?.split('T')[0] || '',
                probability: initialDeal.probability || 20,
                billing_type: initialDeal.billing_type || 'direct'
            });
        }

        // Never auto-refresh products during edit — would overwrite user's in-progress changes
        if (!isEditing && isOpen && (hasIdChanged || !deal.deal_products || deal.deal_products.length === 0)) {
            handleProductsUpdate();
        }

        // Fetch accounts for selection
        if (isOpen && accounts.length === 0) {
            getAccounts().then(data => setAccounts(data));
        }
        // Pre-load contacts when modal opens so Stakeholders tab is instant
        if (isOpen && !contactsLoaded) {
            getAccountContacts().then(data => {
                setAllContacts(data);
                setContactsLoaded(true);
            });
        }
    }, [initialDeal, isOpen, isEditing]);

    // Keep formData in sync with critical deal updates from children
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            value: deal.value,
            account_id: deal.account_id,
            client_contact_id: deal.client_contact_id,
            custom_fields: deal.custom_fields
        }));
    }, [deal.value, deal.account_id, deal.client_contact_id, deal.custom_fields]);

    const handleAccountChange = (accountId: string) => {
        const selectedAccount = accounts.find(a => a.id === accountId);
        setFormData(prev => ({
            ...prev,
            account_id: accountId === 'none' ? undefined : accountId,
            company: selectedAccount ? selectedAccount.name : (accountId === 'none' ? 'Cliente' : prev.company)
        }));

        // Also update local deal state so tabs (like Stakeholders) react instantly
        setDeal(prev => ({
            ...prev,
            account_id: accountId === 'none' ? undefined : accountId,
            company: selectedAccount ? selectedAccount.name : (accountId === 'none' ? 'Cliente' : (prev.company || ''))
        }));
    };

    const handleSave = async () => {
        if (!formData.expected_close_date) {
            toast.error('A Data de Previsão de Fechamento é obrigatória!');
            return;
        }

        try {
            setIsLoading(true);

            // Clean payload: Only send fields that actually belong to the 'deals' table
            const updatePayload = {
                title: formData.title,
                account_id: formData.account_id,
                expected_close_date: formData.expected_close_date || undefined,
                probability: formData.probability,
                billing_type: formData.billing_type
            };

            // Capture commission_deduction from local deal state if modified
            if (deal.commission_deduction !== undefined && deal.commission_deduction !== null) {
                (updatePayload as Partial<Deal>).commission_deduction = deal.commission_deduction;
            }

            await updateDeal(deal.id, updatePayload);

            // Optimistic update of local deal state to match formData
            setDeal(prev => ({
                ...prev,
                ...updatePayload,
                // Ensure we handle optional fields correctly
                company: (accounts.length > 0 && formData.account_id)
                    ? (accounts.find(a => a.id === formData.account_id)?.name || prev.company)
                    : prev.company
            }) as Deal);

            toast.success('Oportunidade atualizada com sucesso!');
            setIsEditing(false);
        } catch (error) {
            toast.error('Erro ao atualizar oportunidade');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDuplicate = async () => {
        try {
            setIsLoading(true);
            toast.loading('Duplicando oportunidade...', { id: 'duplicating' });
            const newDeal = await duplicateDeal(deal.id);
            if (newDeal) {
                toast.success('Oportunidade duplicada com sucesso!', { id: 'duplicating' });
                onClose(); // Close current modal to let the user see the new deal in the pipeline
            } else {
                toast.error('Ocorreu um erro ao duplicar a oportunidade', { id: 'duplicating' });
            }
        } catch (error) {
            toast.error('Ocorreu um erro ao duplicar a oportunidade', { id: 'duplicating' });
        } finally {
            setIsLoading(false);
        }
    };

    const handleStageChange = async (newStage: string) => {
        // Intercept triggers
        if (newStage === 'lost') {
            setShowLostModal(true);
            return;
        }

        if (newStage === 'won') {
            setShowWonWizard(true);
            return;
        }

        const probabilityMap: Record<string, number> = {
            'qualification': 20,
            'proposal': 50,
            'negotiation': 80,
            'won': 100,
            'lost': 0
        };

        const updates = {
            stage: newStage,
            probability: probabilityMap[newStage] ?? deal.probability,
            won_at: newStage === 'won' ? new Date().toISOString() : undefined,
            lost_at: newStage === 'lost' ? new Date().toISOString() : undefined
        };

        try {
            await updateDealStage(deal.id, updates.stage, updates.probability);
            setDeal(prev => ({ ...prev, ...updates })); // Update the main deal state
            setFormData(prev => ({ ...prev, probability: updates.probability })); // Update formData for display in sidebar
            toast.success(`Estágio atualizado para ${newStage.toUpperCase()}`);
        } catch (error) {
            toast.error('Erro ao atualizar estágio');
        }
    };

    const handleConfirmLost = async (reason: string, notes: string) => {
        try {
            const updates = {
                stage: 'lost',
                probability: 0,
                lost_at: new Date().toISOString(),
                loss_reason: reason,
                description: deal.description ? `${deal.description}\n\n[MOTIVO DA PERDA]: ${reason}\n${notes}` : `[MOTIVO DA PERDA]: ${reason}\n${notes}`
            };

            await updateDeal(deal.id, updates);
            setDeal(prev => ({ ...prev, ...updates })); // Update the main deal state
            setFormData(prev => ({ ...prev, probability: updates.probability })); // Update formData for display in sidebar
            toast.error('Oportunidade marcada como PERDIDA.');
            setShowLostModal(false);
            onClose(); // Close main modal? Or stay to review?
        } catch (error) {
            toast.error('Erro ao marcar como perdida.');
        }
    };

    const handleProductsUpdate = async () => {
        try {
            setIsProductsLoading(true);
            const freshDeal = await getDealDetails(deal.id);
            if (freshDeal) {
                // Viewing a deal must not rewrite its financial value.
                // Explicit product mutations already recalculate and persist
                // totals in DealProductsTab. Never synchronize on a GET/read.
                setDeal(prev => ({
                    ...prev,
                    ...freshDeal,
                    deal_products: freshDeal.deal_products || [],
                    value: freshDeal.value,
                    account_id: freshDeal.account_id || prev.account_id,
                    client_contact_id: freshDeal.client_contact_id || prev.client_contact_id,
                    commission_deduction: prev.commission_deduction ?? freshDeal.commission_deduction,
                    owner_profile: freshDeal.owner_profile || prev.owner_profile
                }));
                setFormData(prev => ({ ...prev, value: freshDeal.value }));
            }
        } catch (error) {
            console.error('Error refreshing deal products:', error);
        } finally {
            setIsProductsLoading(false);
        }
    };

    // Modal content is portalled to document.body. Inert the underlying
    // application shell while the opportunity dialog is open so background
    // actions cannot receive focus or be evaluated as foreground controls.
    // Restore the previous inert state on close/unmount (including error paths).
    useEffect(() => {
        if (!isOpen) return;
        const shell = document.querySelector<HTMLElement>('[data-slot="crm-dashboard-shell"]');
        if (!shell) return;
        const wasInert = shell.inert;
        shell.inert = true;
        return () => { shell.inert = wasInert; };
    }, [isOpen]);

    if (!isOpen) return null;

    const pricedProductTotal = calculateDealValue(deal.deal_products || []);
    const estimatedValue = typeof deal.value === 'number' && Number.isFinite(deal.value) ? deal.value : null;
    const hasPricedItems = Array.isArray(deal.deal_products) && deal.deal_products.length > 0;
    const pricingMismatch = !isProductsLoading && estimatedValue !== null && hasPricedItems &&
        Math.abs(estimatedValue - pricedProductTotal) > 0.01;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent
                data-qa-region="deal-dialog"
                showCloseButton={false}
                // This large multi-section dialog uses a direct, meaningful name
                // rather than dynamic IDREFs. Per WAI-ARIA APG, omit the
                // container description when content has complex structure.
                aria-label={`Detalhes da oportunidade: ${deal.title}`}
                aria-labelledby={undefined}
                aria-describedby={undefined}
                onOpenAutoFocus={() => {
                    // No DialogTrigger exists in this controlled-only modal.
                    // Capture its real opener before Radix moves focus inside.
                    const focused = document.activeElement;
                    if (focused instanceof HTMLElement &&
                        focused !== document.body &&
                        !focused.closest('[role="dialog"]')) {
                        returnFocusRef.current = focused;
                    }
                }}
                onCloseAutoFocus={(event) => {
                    // Restore only after the shell's inert cleanup, without
                    // stealing focus if the opener was removed by navigation.
                    event.preventDefault();
                    const opener = returnFocusRef.current;
                    returnFocusRef.current = null;
                    requestAnimationFrame(() => {
                        if (opener?.isConnected && !opener.closest('[inert], [aria-hidden="true"]')) {
                            opener.focus({ preventScroll: true });
                        }
                    });
                }}
                className="ds-deal-dialog w-[var(--ds-deal-dialog-responsive-width)] max-w-[var(--ds-deal-dialog-responsive-width)] h-[var(--ds-deal-dialog-height)] rounded-[var(--ds-deal-dialog-radius)] p-0 gap-0 bg-background border-border text-foreground overflow-hidden flex flex-col"
            >

                {/* Header */}
                <div data-qa-region="deal-header" className="ds-deal-header border-b border-border bg-card">
                    <div className="flex min-w-0 items-center gap-3">
                        <div className={`shrink-0 rounded-[var(--radius-panel)] p-[var(--ds-deal-header-icon-padding)] flex items-center justify-center shadow-control-ui ${deal.stage === 'won' ? 'bg-success-subtle text-success-readable' :
                            deal.stage === 'lost' ? 'bg-destructive-subtle text-destructive-readable' : 'bg-primary/20 text-info'
                            }`}>
                            <DollarSign className="size-[var(--ds-nav-icon-size)]" />
                        </div>
                        <div className="min-w-0">
                            <DialogTitle
                                className={isEditing ? 'sr-only' : 'ds-type-section-title font-semibold text-foreground'}
                            >{isEditing ? formData.title : deal.title}</DialogTitle>
                            <DialogDescription className="sr-only">
                                Visualizar e editar detalhes da oportunidade
                            </DialogDescription>
                            {isEditing && (
                                <Input
                                    aria-label="Título da oportunidade"
                                    value={formData.title}
                                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                    className="w-[var(--ds-deal-title-edit-width)] max-w-full border-border bg-muted/50 ds-type-section-title"
                                />
                            )}
                            <div className="mt-1 flex flex-wrap items-center gap-2 ds-type-label text-muted-foreground">
                                <Building2 className="w-3.5 h-3.5 text-info/60 shrink-0" />
                                {isEditing ? (
                                    <Select
                                        value={formData.account_id || 'none'}
                                        onValueChange={handleAccountChange}
                                    >
                                        <SelectTrigger className="h-7 py-0 px-2 text-xs border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors max-w-[var(--ds-deal-account-select-width)] rounded-lg">
                                            <SelectValue placeholder="Vincular Empresa..." />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-border/60 shadow-xl max-h-[300px]">
                                            <SelectItem value="none" className="text-muted-foreground italic">Sem empresa vinculada</SelectItem>
                                            {accounts.map(acc => (
                                                <SelectItem key={acc.id} value={acc.id} className="text-xs font-medium">
                                                    {acc.name}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <span className="text-muted-foreground font-medium">{deal.company || 'Sem empresa vinculada'}</span>
                                )}
                                <span className="text-muted-foreground/30 px-1">|</span>
                                <span className="ds-type-metadata uppercase font-bold tracking-tighter text-muted-foreground">ID: #{deal.id.slice(0, 8)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="ds-deal-header-actions flex flex-wrap items-center gap-2">
                        <div className="flex items-center gap-2">
                            <span className="ds-type-metadata font-semibold text-muted-foreground">Etapa</span>
                            <Select value={deal.stage} onValueChange={handleStageChange}>
                                <SelectTrigger aria-label="Alterar etapa da oportunidade"
                                    className="w-[var(--ds-deal-stage-select-width)] max-w-full border-border bg-surface ds-type-control">
                                    <SelectValue placeholder="Selecionar etapa" />
                                </SelectTrigger>
                                <SelectContent>
                                    {[
                                        { id: 'qualification', label: 'Qualificação' },
                                        { id: 'proposal', label: 'Proposta' },
                                        { id: 'negotiation', label: 'Negociação' },
                                        { id: 'won', label: 'Ganho' },
                                        { id: 'lost', label: 'Perdido' },
                                    ].map(stage => (
                                        <SelectItem key={stage.id} value={stage.id}>{stage.label}</SelectItem>
                                    ))}
                                    {!['qualification', 'proposal', 'negotiation', 'won', 'lost'].includes(deal.stage) && (
                                        <SelectItem value={deal.stage}>{deal.stage}</SelectItem>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <Button variant="outline" size="sm" disabled={isLoading}
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            className="ds-type-control">
                            {isEditing ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                            {isEditing ? 'Salvar' : 'Editar'}
                        </Button>
                        <Button variant="ghost" size="icon" disabled={isLoading}
                            onClick={handleDuplicate} aria-label="Duplicar oportunidade"
                            title="Duplicar oportunidade">
                            <Copy className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={onClose}
                            aria-label="Fechar detalhes da oportunidade">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className="ds-deal-body">

                    {/* Main Tabs Area */}

                    <div className="ds-deal-main flex flex-col border-r border-border bg-background">
                        <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
                            <div data-qa-region="deal-tabs" className="ds-deal-tabbar border-b border-border bg-surface">
                                <div className="ds-deal-tabs-row">
                                    <TabsList aria-label="Seções principais da oportunidade"
                                        className="ds-deal-tablist grid w-full gap-[var(--ds-deal-tabs-gap)] border-0 bg-surface-subtle p-0">
                                        {[
                                            { id: 'overview', label: 'Resumo', icon: LayoutDashboard },
                                            { id: 'products', label: 'Produtos', icon: Package },
                                            { id: 'proposals', label: 'Propostas', icon: FileText },
                                        ].map(tab => (
                                            <TabsTrigger key={tab.id} value={tab.id}
                                                data-section-selected={activeTab === tab.id}
                                                aria-selected={activeTab === tab.id}
                                                // The selected section, not Radix's last focused
                                                // primary tab, owns the visual state. Disabling the
                                                // color transition prevents a stale blue pill in
                                                // the immediately captured History state.
                                                style={{
                                                    backgroundColor: activeTab === tab.id ? 'var(--primary)' : 'transparent',
                                                    color: activeTab === tab.id ? 'var(--primary-foreground)' : 'var(--foreground)',
                                                    boxShadow: 'none',
                                                    transition: 'none',
                                                }}
                                                className="text-label-ui font-medium normal-case tracking-normal text-foreground data-[state=active]:text-primary-foreground">
                                                <tab.icon className="hidden h-4 w-4 shrink-0 sm:inline" aria-hidden="true" />
                                                <span className="truncate">{tab.label}</span>
                                            </TabsTrigger>
                                        ))}
                                    </TabsList>
                                    <Select value={secondaryTabs.some(tab => tab.value === activeTab) ? activeTab : ''}
                                        onValueChange={setActiveTab}>
                                        <SelectTrigger
                                            aria-label="Outras seções da oportunidade"
                                            data-qa-region="deal-more-sections"
                                            className="ds-deal-more-trigger ds-type-control border-border bg-card text-foreground">
                                            <SelectValue placeholder="Mais seções" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {secondaryTabs.map(tab => (
                                                <SelectItem key={tab.value} value={tab.value}>{tab.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            <div className="flex-1 overflow-hidden relative">
                                <div className="absolute inset-0 flex flex-col">
                                    <TabsContent value="overview" className="ds-deal-content-scroll mt-0 overflow-y-auto custom-scrollbar flex-1 h-full w-full">
                                        <OverviewTab
                                            deal={deal}
                                            onViewStakeholders={() => setActiveTab('stakeholders')}
                                            onViewProducts={() => setActiveTab('products')}
                                            onViewCommunications={() => setActiveTab('omnichannel')}
                                        />
                                    </TabsContent>

                                    <TabsContent value="proposals" className="mt-0 flex flex-col flex-1 h-full w-full overflow-hidden">
                                        <ProposalsTab
                                            key={proposalsRefreshKey}
                                            dealId={deal.id}
                                            onGenerate={() => router.push(`/pipeline/proposals/editor/${deal.id}`)}
                                            onView={(proposal) => {
                                                // Inject deal context for ViewProposalModal
                                                setFocusedProposal({
                                                    ...proposal,
                                                    dealTitle: deal.title,
                                                    company: deal.company,
                                                    customer_name: deal.company // Fallback 
                                                } as Proposal);
                                                setShowViewProposalModal(true);
                                            }}
                                        />
                                    </TabsContent>

                                    <DealProductsTab
                                        deal={deal}
                                        setDeal={setDeal}
                                        isEditing={isEditing}
                                        setIsEditing={setIsEditing}
                                        distributors={distributors}
                                        isLoading={isProductsLoading}
                                    />

                                    {/* These sections are selected by a combobox, not a Radix tab trigger.
                                        Render named regions instead of orphan tabpanels with missing aria-labelledby IDs. */}
                                    {activeTab === 'partners' && (
                                        <section data-qa-secondary-section="partners" role="region" aria-label="Parceiros" className="ds-deal-content-scroll m-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar h-full">
                                            <PartnersTab
                                                deal={deal}
                                                isEditing={isEditing}
                                                distributors={distributors}
                                                allAccounts={allAccounts}
                                                allContacts={allContacts}
                                            />
                                        </section>
                                    )}


                                    {activeTab === 'omnichannel' && (
                                        <section data-qa-secondary-section="omnichannel" role="region" aria-label="Comunicações" className="ds-deal-content-scroll m-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar h-full">
                                            <SmartTimeline dealId={deal.id} />
                                        </section>
                                    )}

                                    {activeTab === 'stakeholders' && (
                                        <section data-qa-secondary-section="stakeholders" role="region" aria-label="Clientes" className="ds-deal-content-scroll m-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar h-full">
                                            <StakeholdersTab
                                                deal={isEditing ? { ...deal, account_id: formData.account_id } : deal}
                                                setDeal={setDeal}
                                                isEditing={isEditing}
                                                allContacts={allContacts}
                                            />
                                        </section>
                                    )}

                                    {activeTab === 'documents' && (
                                        <section data-qa-secondary-section="documents" role="region" aria-label="Documentos" className="m-0 flex-1 min-h-0 overflow-hidden h-full">
                                            <FilesTab deal={deal} />
                                        </section>
                                    )}

                                    {activeTab === 'history' && (
                                        <section data-qa-secondary-section="history" role="region" aria-label="Histórico" className="ds-deal-content-scroll m-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar h-full">
                                            <HistoryTab deal={deal} />
                                        </section>
                                    )}
                                </div>
                            </div >
                        </Tabs >
                    </div >

                    {/* Sidebar Command Center */}
                    <aside data-qa-region="deal-sidebar" className="ds-deal-inspector border-l border-border bg-card antialiased">
                        <div className="ds-deal-inspector-content flex-1 overflow-y-auto custom-scrollbar">
                            {/* Separate stored estimate from product-derived pricing. */}
                            <section data-qa-region="deal-financial" className="ds-panel-financial ds-deal-financial">
                                <h3 className="ds-type-body font-semibold text-foreground">Valores e previsão</h3>
                                <dl className="mt-3 grid gap-3">
                                    <div className="flex items-baseline justify-between gap-3">
                                        <dt className="ds-type-label text-muted-foreground">Valor estimado</dt>
                                        <dd className="ds-type-body font-semibold text-foreground">
                                            {estimatedValue === null ? 'Não informado' : formatCurrency(estimatedValue)}
                                        </dd>
                                    </div>
                                    <div className="flex items-baseline justify-between gap-3">
                                        <dt className="ds-type-label text-muted-foreground">Valor calculado dos itens</dt>
                                        <dd className="ds-type-body font-semibold text-foreground">
                                            {isProductsLoading ? 'Carregando…' :
                                                hasPricedItems ? formatCurrency(pricedProductTotal) : 'Sem itens'}
                                        </dd>
                                    </div>
                                </dl>
                                {pricingMismatch && (
                                    <div data-qa-region="deal-pricing-discrepancy" role="note"
                                        className="mt-3 rounded-[var(--radius-control)] border border-warning/30 bg-warning-subtle p-3">
                                        <p className="ds-type-label font-medium text-warning-readable">
                                            O valor estimado difere do valor calculado dos itens.
                                            Confira os preços antes de preparar uma proposta.
                                        </p>
                                        <Button type="button" size="sm" variant="outline"
                                            className="mt-2 ds-type-control" onClick={() => setActiveTab('products')}>
                                            Revisar itens
                                        </Button>
                                    </div>
                                )}
                                <div className="mt-4 border-t border-border pt-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="ds-type-label text-muted-foreground">Probabilidade de fechamento</span>
                                        <strong className="ds-type-body text-foreground">{formData.probability}%</strong>
                                    </div>
                                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                                        <div className="h-full rounded-full bg-primary transition-[width]"
                                            style={{ width: `${formData.probability}%` }} />
                                    </div>
                                    {isEditing && (
                                        <input type="range" min="0" max="100" step="10"
                                            className="mt-2 w-full accent-primary"
                                            aria-label="Probabilidade de fechamento"
                                            value={formData.probability}
                                            onChange={event => setFormData({ ...formData, probability: Number(event.target.value) })} />
                                    )}
                                </div>
                                <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-3">
                                    <div>
                                        <p className="ds-type-label text-muted-foreground">Previsão de fechamento</p>
                                        {isEditing ? (
                                            <input type="date" aria-label="Previsão de fechamento"
                                                className="ds-type-control mt-1 max-w-full rounded-[var(--radius-control)] border border-border bg-background p-2 text-foreground"
                                                value={formData.expected_close_date || ''}
                                                onChange={event => setFormData({ ...formData, expected_close_date: event.target.value })} />
                                        ) : (
                                            <p className="ds-type-body font-medium text-foreground">
                                                {deal.expected_close_date
                                                    ? deal.expected_close_date.split('T')[0].split('-').reverse().join('/')
                                                    : 'Não definida'}
                                            </p>
                                        )}
                                    </div>
                                    {!isEditing && (
                                        <Button type="button" size="sm" variant="ghost"
                                            aria-label="Editar previsão de fechamento"
                                            onClick={() => setIsEditing(true)}>
                                            <Calendar className="h-4 w-4" />
                                        </Button>
                                    )}
                                </div>
                            </section>

                            <section data-qa-region="deal-recent-activities" className="ds-deal-inspector-section">
                                <div className="mb-3 flex items-center justify-between gap-2">
                                    <h3 className="ds-type-body font-semibold text-foreground">Atividades recentes</h3>
                                    <Button type="button" size="sm" variant="ghost" className="ds-type-label"
                                        onClick={() => setActiveTab('history')}>Ver histórico</Button>
                                </div>
                                <DealActivityTimeline deal={deal} compact />
                            </section>

                            {deal.stage === 'lost' && (
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="h-4 w-4 text-destructive-readable fill-destructive-subtle" />
                                        <h4 className="ds-type-metadata font-black text-destructive-readable uppercase tracking-widest">Feedback de Perda</h4>
                                    </div>
                                    <div className="bg-surface-subtle p-4 rounded-xl border border-border/40 transition-all hover:bg-surface-raised hover:border-primary/20 group">
                                        <p className="ds-type-metadata font-bold text-muted-foreground uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Motivo Principal</p>
                                        <p className="text-sm font-bold text-destructive-readable">{deal.loss_reason || 'Não informado'}</p>
                                        {deal.lost_at && (
                                            <p className="ds-type-metadata text-destructive-readable/50 font-medium mt-1">
                                                Registrado em: {new Date(deal.lost_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        )}
                                    </div>
                                </section>
                            )}
                            {/* AI & Risk Sections */}
                            <div className="space-y-6">
                                <div data-qa-region="deal-doctor">
                                    <DealDoctorFinal
                                        deal={deal}
                                    onClose={() => setShowDealDoctor(false)}
                                    onAnalysisComplete={(analysis) => {
                                        console.log('[ViewDealModal-Sidebar] Analysis Completed:', analysis);
                                        setDeal(prev => {
                                            const newDeal = {
                                                ...prev,
                                                health_score: analysis.healthScore,
                                                health_trend: analysis.trend,
                                                risk_factors: analysis.riskFactors
                                            };
                                            console.log('[ViewDealModal-Sidebar] Updating Deal State:', newDeal);
                                            return newDeal;
                                        });
                                    }}
                                    />
                                </div>
                                <div className="h-px bg-surface-subtle"></div>
                                <div data-qa-region="deal-risk"><RiskRadar deal={deal} /></div>
                                <div className="h-px bg-surface-subtle"></div>
                                <div data-qa-region="deal-actions"><DealSuggestedActions dealId={deal.id} /></div>
                            </div>

                            {/* Client Portal Card */}
                            <div className="ds-panel-highlight p-4 border relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Globe className="h-24 w-24 text-primary" />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-primary" />
                                            Portal do Cliente
                                        </h3>
                                        <p className="ds-type-metadata text-muted-foreground leading-relaxed">
                                            Compartilhe este link seguro para acompanhamento da proposta e status.
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="w-full bg-primary border-primary hover:bg-primary/90 text-white font-bold"
                                        onClick={async () => {
                                            try {
                                                const result = await getOrCreateRoom(deal.id);
                                                if (result && 'room' in result && result.room) {
                                                    const url = `${window.location.origin}/portal/${result.room.access_token}`;
                                                    navigator.clipboard.writeText(url);
                                                    toast.success('Link do Portal copiado!');
                                                } else if (result && 'error' in result) {
                                                    console.error('Failed to create/get deal room:', result.error);
                                                    toast.error(`Erro: ${result.error}`);
                                                } else {
                                                    console.error('Failed to create/get deal room for deal:', deal.id);
                                                    toast.error('Erro ao gerar link do portal. Verifique os logs.');
                                                }
                                            } catch (err) {
                                                console.error('Critical error creating portal link:', err);
                                                toast.error('Erro crítico ao gerar link do portal');
                                            }
                                        }}
                                    >
                                        Gerar & Copiar Link
                                    </Button>
                                </div>
                            </div>

                            {/* Tags */}
                            <section>
                                <h4 className="ds-type-metadata font-black text-muted-foreground uppercase tracking-widest mb-4">Segmentação & Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(deal.tags || []).map(tag => (
                                        <span key={tag} className="px-2.5 py-1 rounded-full bg-info-subtle ds-type-metadata font-black text-info border border-info/30 uppercase tracking-tighter">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar Action Buttons Footer */}
                        <div className="ds-deal-inspector-footer border-t border-border bg-card space-y-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => router.push(`/pipeline/proposals/editor/${deal.id}`)}
                                    className="flex-1 bg-muted/50 hover:bg-muted/50 text-foreground py-3 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-border hover:border-info/40"
                                >
                                    <FileText className="h-4 w-4 text-info" />
                                    Proposta
                                </button>

                                <button
                                    onClick={() => setShowContractBuilder(true)}
                                    className="flex-1 bg-muted/50 hover:bg-muted/50 text-foreground py-3 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-border hover:border-success/40"
                                >
                                    <Scroll className="h-4 w-4 text-success-readable" />
                                    Contrato
                                </button>
                            </div>

                            {deal.stage === 'won' && (
                                <button
                                    onClick={() => setShowHandoverModal(true)}
                                    className="w-full py-3 bg-success-subtle hover:bg-success-subtle text-success-readable rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-success/30"
                                >
                                    <CheckSquare className="h-4 w-4" />
                                    Iniciar Handover Técnico
                                </button>
                            )}
                        </div>
                    </aside >
                </div >

                {/* Modals & Drawers */}
                {
                    showEmailDrafter && (
                        <AIEmailDrafter deal={deal} onClose={() => setShowEmailDrafter(false)} />
                    )
                }
                {
                    showContractBuilder && (
                        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm p-8 flex flex-col animate-in fade-in duration-300">
                            <ContractBuilder
                                deal={deal}
                                onClose={() => setShowContractBuilder(false)}
                                onSave={(contract) => {
                                    console.log('Saving contract', contract);
                                    setShowContractBuilder(false);
                                    toast.success('Contrato salvo (Mock)');
                                }}
                            />
                        </div>
                    )
                }

                {/* ProposalGeneratorWizard replaced by full-screen editor route:
                    /pipeline/proposals/editor/{dealId} */}

                {
                    showLostModal && (
                        <LostDealModal
                            deal={deal}
                            isOpen={showLostModal}
                            onClose={() => setShowLostModal(false)}
                            onConfirm={handleConfirmLost}
                        />
                    )
                }

                {
                    showWonWizard && (
                        <WonDealWizard
                            deal={deal}
                            isOpen={showWonWizard}
                            onClose={() => setShowWonWizard(false)}
                            onSuccess={(updatedDeal) => {
                                setDeal(updatedDeal);
                                setShowHandoverModal(true);
                            }}
                        />
                    )
                }

                {
                    showHandoverModal && (
                        <TechnicalHandoverModal
                            deal={deal}
                            onClose={() => setShowHandoverModal(false)}
                        />
                    )
                }

                {
                    focusedProposal && (
                        <ViewProposalModal
                            proposal={focusedProposal}
                            distributors={distributors}
                            isOpen={showViewProposalModal}
                            onClose={() => {
                                setShowViewProposalModal(false);
                                setFocusedProposal(null);
                            }}
                            onDelete={async (id) => {
                                try {
                                    await deleteProposal(id);
                                    toast.success('Proposta excluída com sucesso');
                                    setShowViewProposalModal(false);
                                    setFocusedProposal(null);
                                    // Force refresh of proposals tab
                                    setProposalsRefreshKey((prev) => prev + 1);
                                } catch (e) {
                                    console.error('Erro ao excluir proposta:', e);
                                    toast.error('Erro ao excluir proposta');
                                }
                            }}
                            onUpdateStatus={async (id, updates) => {
                                try {
                                    console.log('🔄 [ViewDealModal] onUpdateStatus called:', { id, updates });

                                    // Call server action to update in database
                                    await updateProposal(id, updates);

                                    // Update local state
                                    if (focusedProposal) {
                                        setFocusedProposal({
                                            ...focusedProposal,
                                            ...updates
                                        });
                                    }

                                    // Force refresh of proposals tab
                                    setProposalsRefreshKey((prev) => prev + 1);

                                    console.log('✅ [ViewDealModal] Proposal updated successfully');
                                } catch (e) {
                                    console.error('❌ [ViewDealModal] Error updating proposal:', e);
                                    toast.error('Erro ao atualizar proposta');
                                }
                            }}
                        />
                    )
                }
            </DialogContent >
        </Dialog >
    );
}
