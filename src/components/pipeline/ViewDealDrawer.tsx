
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { X, Save, Edit, History, Package, MessageSquare, Clock, Paperclip,
    TrendingUp, DollarSign, User, Users, Calendar, Activity as ActivityIcon,
    Plus, Trash2, FileText, CheckCircle2, AlertTriangle, MoreHorizontal, AlertCircle,
    Bot, ShieldCheck, Mail, Building2, Phone, Edit2, Scroll, FileSpreadsheet,
    Briefcase, Zap, CreditCard, CheckSquare, Globe, Copy, ArrowRight, ExternalLink,
    LayoutDashboard, File as FileIcon, FolderOpen
} from 'lucide-react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
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
import { ThemeCurrencyInput } from '@/components/ui/theme/ThemeComponents';
import type { Deal } from '@/types/deal';
import { useDraftForm, FloatingSaveBar, UnsavedChangesDialog } from '@/components/ui/floating-save-bar';
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
import { ViewProposalDrawer } from '../proposals/ViewProposalDrawer';
import type { Proposal } from '@/types/proposal';
import { SmartTimeline } from '../omnichannel/SmartTimeline';
import { formatCurrency } from '@/utils/format';
import { calculateDealValue } from '@/utils/dealCalculations';
import { useDeals } from '@/hooks/useDeals';

import { Account } from '@/types/account';
import { Contact } from '@/types/contact';

interface ViewDealDrawerProps {
    deal: Deal;
    isOpen: boolean;
    onClose: () => void;
    distributors?: Account[];
    allAccounts?: Account[];
    initialTab?: string;
}

export function ViewDealDrawer({ deal: initialDeal, isOpen, onClose, distributors = [], allAccounts = [], initialTab = 'overview' }: ViewDealDrawerProps) {
    const router = useRouter();
    const { duplicateDeal } = useDeals();
    const [deal, setDeal] = useState<Deal>(initialDeal);
    const [activeTab, setActiveTab] = useState(initialTab);
    const [isEditing, setIsEditing] = useState(true);
    const [headerTitle, setHeaderTitle] = useState(initialDeal.title);
    const titleInputRef = React.useRef<HTMLInputElement>(null);
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

    // Form State with useDraftForm
    const initialFormData = React.useMemo(() => ({
        title: deal.title || '',
        value: deal.value || 0,
        company: deal.company || '',
        account_id: deal.account_id || '',
        client_contact_id: deal.client_contact_id || '',
        contact_name: deal.contact_name || '',
        contact_email: deal.contact_email || '',
        contact_phone: deal.contact_phone || '',
        expected_close_date: deal.expected_close_date?.split('T')[0] || '',
        probability: deal.probability || 20,
        billing_type: deal.billing_type || 'direct',
        distributor_id: deal.distributor_id || '',
        distributor_contact_id: deal.distributor_contact_id || '',
        manufacturer_contact_id: deal.manufacturer_contact_id || '',
        custom_fields: deal.custom_fields || {}
    }), [deal]);

    const {
        formData,
        setFormData,
        updateField,
        updateFormData,
        isDirty,
        changedCount,
        isSaving,
        saveChanges,
        discardChanges,
        safeExecute,
        showUnsavedModal,
        setShowUnsavedModal
    } = useDraftForm({
        initialData: initialFormData,
        onSave: async (updated) => {
            const updatePayload = {
                title: updated.title,
                account_id: updated.account_id || undefined,
                client_contact_id: updated.client_contact_id || undefined,
                company: updated.company,
                value: updated.value,
                expected_close_date: updated.expected_close_date ? `${updated.expected_close_date}T00:00:00.000Z` : undefined,
                probability: updated.probability,
                billing_type: updated.billing_type,
                distributor_id: updated.distributor_id || null,
                distributor_contact_id: updated.distributor_contact_id || null,
                manufacturer_contact_id: updated.manufacturer_contact_id || null,
                custom_fields: updated.custom_fields || undefined
            };
            await updateDeal(deal.id, updatePayload);
            setDeal(prev => ({ ...prev, ...updatePayload }) as Deal);
            setHeaderTitle(updated.title);
            lastSavedTitle.current = updated.title;
        }
    });

    // State for forcing refresh of proposals list
    const [proposalsRefreshKey, setProposalsRefreshKey] = useState(0);
    const [prevDealId, setPrevDealId] = useState(initialDeal.id);
    const lastSavedTitle = React.useRef(initialDeal.title);

    useEffect(() => {
        // Robust Sync: If the parent props change (e.g. after revalidatePath), 
        // we must update our local state.
        const hasIdChanged = prevDealId !== initialDeal.id;

        if (hasIdChanged) {
            setDeal(initialDeal);
            setPrevDealId(initialDeal.id);
            setHeaderTitle(initialDeal.title);
        } else if (!isEditing) {
            // Sync from server when NOT editing.
            setDeal(prev => {
                // Safeguard: If initialDeal.title is different from our local state, 
                // but matches the title we HAD before the last save, it's likely a stale prop 
                // from Next.js revalidation. We should ignore it.
                const isStaleTitle = initialDeal.title !== prev.title && initialDeal.title === lastSavedTitle.current;

                // Avoid unnecessary updates if products are the same
                if (JSON.stringify(prev.deal_products) === JSON.stringify(initialDeal.deal_products) &&
                    prev.value === initialDeal.value &&
                    (prev.title === initialDeal.title || isStaleTitle)) {
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
                title: initialDeal.title || '',
                value: initialDeal.value || 0,
                company: initialDeal.company || '',
                account_id: initialDeal.account_id || '',
                client_contact_id: initialDeal.client_contact_id || '',
                contact_name: initialDeal.contact_name || '',
                contact_email: initialDeal.contact_email || '',
                contact_phone: initialDeal.contact_phone || '',
                expected_close_date: initialDeal.expected_close_date?.split('T')[0] || '',
                probability: initialDeal.probability || 20,
                billing_type: initialDeal.billing_type || 'direct',
                distributor_id: initialDeal.distributor_id || '',
                distributor_contact_id: initialDeal.distributor_contact_id || '',
                manufacturer_contact_id: initialDeal.manufacturer_contact_id || '',
                custom_fields: initialDeal.custom_fields || {}
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
            value: deal.value || 0,
            account_id: deal.account_id || '',
            client_contact_id: deal.client_contact_id || ''
        }));
    }, [deal.value, deal.account_id, deal.client_contact_id]);

    const handleAccountChange = (accountId: string) => {
        const selectedAccount = accounts.find(a => a.id === accountId);
        setFormData(prev => ({
            ...prev,
            account_id: accountId === 'none' ? '' : accountId,
            company: selectedAccount ? selectedAccount.name : (accountId === 'none' ? 'Cliente' : prev.company)
        }));

        // Also update local deal state so tabs (like Stakeholders) react instantly
        setDeal(prev => ({
            ...prev,
            account_id: accountId === 'none' ? undefined : accountId,
            company: selectedAccount ? selectedAccount.name : (accountId === 'none' ? 'Cliente' : (prev.company || ''))
        }));
    };

    // Ghost Input: Update draft state on title change/blur
    const handleTitleBlur = () => {
        const newTitle = headerTitle.trim();
        if (newTitle) {
            updateField('title', newTitle);
        }
    };

    const handleTitleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            titleInputRef.current?.blur();
        }
        if (e.key === 'Escape') {
            setHeaderTitle(formData.title);
            titleInputRef.current?.blur();
        }
    };

    // Ghost Select: Update draft state on company change
    const handleGhostAccountChange = (accountId: string) => {
        const selectedAccount = accounts.find(a => a.id === accountId);
        const newAccountId = accountId === 'none' ? '' : accountId;
        const newCompany = selectedAccount ? selectedAccount.name : (accountId === 'none' ? 'Cliente' : formData.company);
        updateFormData({
            account_id: newAccountId,
            company: newCompany
        });
    };

    // Generic Ghost Field Update for Cockpit Financeiro
    const handleGhostFieldUpdate = (field: string, value: any) => {
        updateField(field as any, value);
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
                company: formData.company,
                value: formData.value,
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
            lastSavedTitle.current = formData.title;
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
                const freshProducts = freshDeal.deal_products || [];
                const primaryQuote = (freshDeal.deal_quotes || []).find(q => q.is_primary);
                const primaryProducts = primaryQuote
                    ? freshProducts.filter(p => !p.quote_id || p.quote_id === primaryQuote.id)
                    : freshProducts;
                const newTotalValue = calculateDealValue(primaryProducts);

                // Safeguard: If the loaded value differs from the actual product sum, sync it
                // ONLY if there are actually products in the deal, to avoid overwriting manual estimates on empty deals
                if (primaryProducts.length > 0 && Math.abs((freshDeal.value || 0) - newTotalValue) > 0.01) {
                    await updateDeal(deal.id, { value: newTotalValue });
                }

                setDeal(prev => {
                    const updatedDeal = {
                        ...prev,
                        ...freshDeal,
                        deal_products: freshProducts,
                        value: primaryProducts.length > 0 ? newTotalValue : freshDeal.value,
                        account_id: freshDeal.account_id || prev.account_id,
                        client_contact_id: freshDeal.client_contact_id || prev.client_contact_id,
                        commission_deduction: prev.commission_deduction ?? freshDeal.commission_deduction,
                        owner_profile: freshDeal.owner_profile || prev.owner_profile
                    };
                    return updatedDeal;
                });

                // Keep formData in sync
                setFormData(prev => ({
                    ...prev,
                    value: newTotalValue
                }));
            }
        } catch (error) {
            console.error('Error refreshing deal products:', error);
        } finally {
            setIsProductsLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && safeExecute(onClose)}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="w-full sm:max-w-[min(95vw,1200px)] h-full p-0 gap-0 bg-background border-border text-foreground overflow-hidden flex flex-col"
                onPointerDownOutside={(e) => {
                    if (e.target instanceof Element && e.target.closest('.floating-save-bar')) {
                        e.preventDefault();
                    }
                }}
            >

                {/* Header */}
                <div className="h-20 border-b border-border flex items-center justify-between px-8 bg-card">
                    <div className="flex items-center gap-6 flex-1 min-w-0">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner shrink-0 ${deal.stage === 'won' ? 'bg-emerald-500/20 text-emerald-500' :
                            deal.stage === 'lost' ? 'bg-rose-500/20 text-rose-500' : 'bg-primary/20 text-blue-500'
                            }`}>
                            <DollarSign className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0 pr-4 flex flex-col justify-center">
                            <div className="h-8 flex items-center">
                                <SheetTitle className="sr-only">{deal.title}</SheetTitle>
                                <SheetDescription className="sr-only">Visualizar e editar detalhes da oportunidade</SheetDescription>
                                <input
                                    ref={titleInputRef}
                                    value={headerTitle}
                                    onChange={(e) => setHeaderTitle(e.target.value)}
                                    onBlur={handleTitleBlur}
                                    onKeyDown={handleTitleKeyDown}
                                    className="text-xl font-bold tracking-tight text-foreground truncate w-full bg-transparent border-none outline-none p-0 m-0 h-8 leading-8 rounded-md hover:bg-muted/40 focus:bg-muted/30 focus:ring-1 focus:ring-primary/30 px-1.5 -mx-1.5 transition-colors cursor-text"
                                    title={deal.title}
                                />
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground w-full">
                                <Building2 className="w-3.5 h-3.5 text-blue-500/60 shrink-0" />
                                <div className="h-6 flex items-center flex-1 min-w-0">
                                    <Select
                                        value={formData.account_id || 'none'}
                                        onValueChange={handleGhostAccountChange}
                                    >
                                        <SelectTrigger className="h-6 border-none bg-transparent shadow-none p-0 m-0 text-sm font-medium text-muted-foreground hover:bg-muted/40 focus:ring-1 focus:ring-primary/30 rounded-md px-1.5 -mx-1.5 transition-colors gap-1 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:opacity-0 [&:hover>svg]:opacity-60 w-auto max-w-full">
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
                                </div>
                                <span className="text-muted-foreground/30 px-1 shrink-0">|</span>
                                <span className="text-[10px] uppercase font-bold tracking-tighter text-muted-foreground/50 shrink-0">ID: #{deal.id.slice(0, 8)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 bg-muted/50 rounded-lg p-1 border border-border">
                            {['qualification', 'proposal', 'negotiation', 'won', 'lost'].map((stage) => {
                                const stageLabels: Record<string, string> = {
                                    'qualification': 'Qualificação',
                                    'proposal': 'Proposta',
                                    'negotiation': 'Negociação',
                                    'won': 'Ganho',
                                    'lost': 'Perdido'
                                };
                                return (
                                    <button
                                        key={stage}
                                        onClick={() => handleStageChange(stage)}
                                        className={`px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-all ${deal.stage === stage
                                            ? 'bg-primary text-white shadow-lg'
                                            : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                                            }`}
                                    >
                                        {stageLabels[stage]}
                                    </button>
                                );
                            })}
                        </div>
                        <div className="flex items-center gap-1 border-l border-border pl-4 ml-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={handleDuplicate}
                                disabled={isLoading}
                                title="Duplicar Oportunidade"
                                className="hover:bg-blue-100 dark:hover:bg-blue-900/20 hover:text-primary rounded-full h-10 w-10 transition-colors"
                            >
                                <Copy className="w-5 h-5 text-foreground/70" />
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => safeExecute(onClose)}
                                className="hover:bg-rose-100 dark:hover:bg-rose-900/20 hover:text-rose-600 rounded-full h-10 w-10 transition-colors"
                            >
                                <X className="w-6 h-6 text-foreground/70" />
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Main Content Grid */}
                <div className={`flex-1 grid ${activeTab === 'overview' ? 'grid-cols-[1fr_400px]' : 'grid-cols-1'} overflow-hidden`}>

                    {/* Main Tabs Area */}

                    <div className="flex flex-col bg-background h-full overflow-hidden border-r border-border">
                        <Tabs defaultValue="overview" value={activeTab} onValueChange={(tab) => safeExecute(() => setActiveTab(tab))} className="flex-1 flex flex-col">
                            <div className="px-4 py-3 border-b border-border/40 bg-background/95 backdrop-blur z-10 sticky top-0">
                                <TabsList className="w-full justify-start gap-1 overflow-x-auto no-scrollbar">
                                    {[
                                        { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
                                        { id: 'proposals', label: 'Propostas', icon: FileText },
                                        { id: 'products', label: 'Produtos', icon: Package },
                                        { id: 'partners', label: 'Parceiros', icon: Building2 },
                                        { id: 'stakeholders', label: 'Clientes', icon: Users },
                                        { id: 'documents', label: 'Documentos', icon: FolderOpen },
                                        { id: 'omnichannel', label: 'Comunicações', icon: MessageSquare },
                                        { id: 'history', label: 'Histórico', icon: History },
                                    ].map((tab) => (
                                        <TabsTrigger
                                            key={tab.id}
                                            value={tab.id}
                                        >
                                            <tab.icon className="w-3.5 h-3.5" />
                                            {tab.label}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </div>
                            <div className="flex-1 overflow-hidden relative">
                                <div className="absolute inset-0 flex flex-col">
                                    <TabsContent value="overview" className="mt-0 overflow-y-auto custom-scrollbar px-8 pt-4 pb-20 flex-1 h-full w-full">
                                        <OverviewTab
                                            deal={deal}
                                            formData={formData}
                                            onViewStakeholders={() => setActiveTab('stakeholders')}
                                            onViewProducts={() => setActiveTab('products')}
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
                                        onNavigateToDocuments={(quoteId) => {
                                            setActiveTab('documents');
                                            // Scroll to the correct folder after tab switch
                                            setTimeout(() => {
                                                const el = document.getElementById(`folder-${quoteId}`);
                                                el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                            }, 150);
                                        }}
                                    />

                                    <TabsContent value="partners" className="m-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar px-8 pt-4 pb-20 h-full">
                                        <PartnersTab
                                            deal={deal}
                                            isEditing={isEditing}
                                            distributors={distributors}
                                            allAccounts={allAccounts}
                                            allContacts={allContacts}
                                            formData={formData}
                                            updateField={updateField as any}
                                        />
                                    </TabsContent>


                                    <TabsContent value="omnichannel" className="m-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar px-8 pt-4 pb-20 h-full">
                                        <SmartTimeline dealId={deal.id} />
                                    </TabsContent>

                                    <TabsContent value="stakeholders" className="m-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar px-8 pt-4 pb-20 h-full">
                                        <StakeholdersTab
                                            deal={isEditing ? { ...deal, account_id: formData.account_id } : deal}
                                            setDeal={setDeal}
                                            isEditing={isEditing}
                                            allContacts={allContacts}
                                            formData={formData}
                                            updateField={updateField as any}
                                        />
                                    </TabsContent>

                                    <TabsContent value="documents" className="m-0 flex-1 min-h-0 overflow-hidden h-full">
                                        <FilesTab deal={deal} />
                                    </TabsContent>

                                    <TabsContent value="history" className="m-0 flex-1 min-h-0 overflow-y-auto custom-scrollbar px-8 pt-4 pb-20 h-full">
                                        <HistoryTab deal={deal} />
                                    </TabsContent>
                                </div>
                            </div >
                        </Tabs >
                    </div >

                    {/* Sidebar Command Center */}
                    {activeTab === 'overview' && (
                        <div className="bg-card border-l border-border flex flex-col h-full overflow-hidden antialiased">
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                            {/* Financial Cockpit Section */}
                            <section className="bg-gradient-to-br from-blue-50 to-white border border-border rounded-xl p-4 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 p-20 rounded-full blur-3xl opacity-10 translate-x-10 -translate-y-10 bg-blue-400 pointer-events-none" />
                                <div className="flex items-center gap-2 mb-6 relative z-10">
                                    <div className="p-1.5 bg-blue-100 rounded-lg border border-blue-200">
                                        <Zap className="h-4 w-4 text-primary" />
                                    </div>
                                    <h4 className="text-[10px] font-bold text-foreground uppercase tracking-wide">Cockpit Financeiro</h4>
                                </div>
                                {/* Stats Container */}
                                <div className="space-y-3 relative z-10">
                                    {/* Value Display */}
                                    <div className="bg-card p-3 rounded-lg border border-border group-hover:border-blue-300 transition-all relative z-10 shadow-sm">
                                        <div className="flex justify-between items-start mb-1">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Valor Total (Forecast)</p>
                                            {isEditing && (deal.deal_products?.length ?? 0) > 0 && (
                                                <Badge variant="outline" className="text-[7px] px-1 py-0 h-4 bg-muted/30">Auto</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-baseline gap-1">
                                            {(() => {
                                                const primaryQuote = (deal.deal_quotes || []).find(q => q.is_primary);
                                                const products = primaryQuote
                                                    ? (deal.deal_products || []).filter(p => !p.quote_id || p.quote_id === primaryQuote.id)
                                                    : (deal.deal_products || []);
                                                    
                                                if (isEditing && products.length === 0) {
                                                    return (
                                                        <div className="w-full mt-1">
                                                            <ThemeCurrencyInput
                                                                id="edit-deal-value"
                                                                value={formData.value || 0}
                                                                onChange={(e) => setFormData(prev => ({ ...prev, value: Number(e.target.value) }))}
                                                                onBlur={(e) => handleGhostFieldUpdate('value', Number(e.target.value))}
                                                                placeholder="0,00"
                                                                className="h-8 font-black w-full"
                                                            />
                                                        </div>
                                                    );
                                                }

                                                const total = products.length > 0 ? calculateDealValue(products) : (deal.value || 0);
                                                return (
                                                    <>
                                                        <span className="text-[10px] font-bold text-primary">R$</span>
                                                        <span className="text-2xl font-black text-foreground tracking-tight">
                                                            {formatCurrency(total).replace('R$', '').trim()}
                                                        </span>
                                                    </>
                                                );
                                            })()}
                                        </div>
                                    </div>

                                    {/* Probability Gauge */}
                                    <div className="bg-card p-3 rounded-lg border border-border group-hover:border-blue-300 transition-all relative z-10 shadow-sm">
                                        <div className="flex justify-between items-center mb-3">
                                            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Confiança no Fechamento</p>
                                            <span className={`text-[10px] font-black uppercase ${formData.probability > 70 ? 'text-emerald-600' : 'text-primary'}`}>
                                                {formData.probability}%
                                            </span>
                                        </div>
                                        <div className="h-2 bg-muted/50 rounded-full overflow-hidden">
                                            {isEditing ? (
                                                <input
                                                    type="range" min="0" max="100" step="10"
                                                    className="w-full h-full opacity-0 cursor-pointer absolute inset-0"
                                                    value={formData.probability}
                                                    onChange={e => setFormData({ ...formData, probability: Number(e.target.value) })}
                                                    onMouseUp={e => handleGhostFieldUpdate('probability', Number((e.target as HTMLInputElement).value))}
                                                    onTouchEnd={e => handleGhostFieldUpdate('probability', Number((e.target as HTMLInputElement).value))}
                                                />
                                            ) : null}
                                            <div
                                                className={`h-full rounded-full transition-all duration-1000 ${formData.probability > 70 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]'}`}
                                                style={{ width: `${formData.probability}%` }}
                                            />
                                        </div>
                                    </div>

                                    {/* Expected Close Date */}
                                    <div
                                        className="bg-card p-3 rounded-lg border border-border group-hover:border-blue-300 transition-all relative z-10 cursor-pointer hover:bg-muted/50 shadow-sm"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Data de Fechamento</p>
                                                <p className="text-sm font-bold text-foreground">
                                                    {isEditing ? (
                                                        <input
                                                            type="date"
                                                            className="bg-transparent border-none focus:ring-0 p-0 w-full cursor-pointer font-bold text-foreground text-sm"
                                                            value={formData.expected_close_date || ''}
                                                            onChange={e => {
                                                                setFormData({ ...formData, expected_close_date: e.target.value });
                                                                handleGhostFieldUpdate('expected_close_date', e.target.value ? `${e.target.value}T00:00:00.000Z` : null);
                                                            }}
                                                            onClick={(e) => e.stopPropagation()}
                                                        />
                                                    ) : (
                                                        deal.expected_close_date ? deal.expected_close_date.split('T')[0].split('-').reverse().join('/') : 'Não Definido'
                                                    )}
                                                </p>
                                            </div>
                                            <Calendar className="h-8 w-8 text-blue-500/20" />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {deal.stage === 'lost' && (
                                <section className="space-y-4">
                                    <div className="flex items-center gap-2 mb-2">
                                        <AlertCircle className="h-4 w-4 text-red-500 fill-red-50" />
                                        <h4 className="text-[10px] font-black text-red-600 uppercase tracking-widest">Feedback de Perda</h4>
                                    </div>
                                    <div className="bg-card/5 p-4 rounded-xl border border-white/5 transition-all hover:bg-card/10 hover:border-primary/20 group">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-1 group-hover:text-primary transition-colors">Motivo Principal</p>
                                        <p className="text-sm font-bold text-red-500">{deal.loss_reason || 'Não informado'}</p>
                                        {deal.lost_at && (
                                            <p className="text-[9px] text-red-500/50 font-medium mt-1">
                                                Registrado em: {new Date(deal.lost_at).toLocaleDateString('pt-BR')}
                                            </p>
                                        )}
                                    </div>
                                </section>
                            )}
                            {/* AI & Risk Sections */}
                            <div className="space-y-6">
                                <DealDoctorFinal
                                    deal={deal}
                                    onClose={() => setShowDealDoctor(false)}
                                    onAnalysisComplete={(analysis) => {
                                        console.log('[ViewDealDrawer-Sidebar] Analysis Completed:', analysis);
                                        setDeal(prev => {
                                            const newDeal = {
                                                ...prev,
                                                health_score: analysis.healthScore,
                                                health_trend: analysis.trend,
                                                risk_factors: analysis.riskFactors
                                            };
                                            console.log('[ViewDealDrawer-Sidebar] Updating Deal State:', newDeal);
                                            return newDeal;
                                        });
                                    }}
                                />
                                <div className="h-px bg-card/5"></div>
                                <RiskRadar deal={deal} />
                                <div className="h-px bg-card/5"></div>
                                <DealSuggestedActions dealId={deal.id} />
                            </div>

                            {/* Client Portal Card */}
                            <div className="bg-gradient-to-r from-blue-50 to-teal-50 p-4 rounded-xl border border-blue-200 relative overflow-hidden group">
                                <div className="absolute right-0 top-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                    <Globe className="h-24 w-24 text-primary" />
                                </div>
                                <div className="relative z-10 space-y-4">
                                    <div>
                                        <h3 className="text-sm font-bold text-foreground mb-1 flex items-center gap-2">
                                            <Globe className="h-4 w-4 text-primary" />
                                            Portal do Cliente
                                        </h3>
                                        <p className="text-[10px] text-muted-foreground leading-relaxed">
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
                                <h4 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-4">Segmentação & Tags</h4>
                                <div className="flex flex-wrap gap-2">
                                    {(deal.tags || ['Enterprise', 'High Priority']).map(tag => (
                                        <span key={tag} className="px-2.5 py-1 rounded-full bg-blue-100 text-[9px] font-black text-blue-700 border border-blue-200 uppercase tracking-tighter">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </section>
                        </div>

                        {/* Sidebar Action Buttons Footer */}
                        <div className="p-8 border-t border-border bg-card space-y-3">
                            <div className="flex gap-2">
                                <button
                                    onClick={() => router.push(`/pipeline/proposals/editor/${deal.id}`)}
                                    className="flex-1 bg-muted/50 hover:bg-muted/50 text-foreground py-3 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-border hover:border-teal-300"
                                >
                                    <FileText className="h-4 w-4 text-teal-500" />
                                    Proposta
                                </button>

                                <button
                                    onClick={() => setShowContractBuilder(true)}
                                    className="flex-1 bg-muted/50 hover:bg-muted/50 text-foreground py-3 px-4 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-border hover:border-emerald-300"
                                >
                                    <Scroll className="h-4 w-4 text-emerald-600" />
                                    Contrato
                                </button>
                            </div>

                            {deal.stage === 'won' && (
                                <button
                                    onClick={() => setShowHandoverModal(true)}
                                    className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs transition-colors flex items-center justify-center gap-2 border border-emerald-200"
                                >
                                    <CheckSquare className="h-4 w-4" />
                                    Iniciar Handover Técnico
                                </button>
                            )}
                        </div>
                    </div >
                    )}
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
                        <ViewProposalDrawer
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
                                    console.log('🔄 [ViewDealDrawer] onUpdateStatus called:', { id, updates });

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

                                    console.log('✅ [ViewDealDrawer] Proposal updated successfully');
                                } catch (e) {
                                    console.error('❌ [ViewDealDrawer] Error updating proposal:', e);
                                    toast.error('Erro ao atualizar proposta');
                                }
                            }}
                        />
                    )
                }

                <FloatingSaveBar
                    isDirty={isDirty && !showUnsavedModal}
                    changedCount={changedCount}
                    isSaving={isSaving}
                    onSave={saveChanges}
                    onDiscard={discardChanges}
                />

                <UnsavedChangesDialog
                    open={showUnsavedModal}
                    onOpenChange={setShowUnsavedModal}
                    onSave={saveChanges}
                    onDiscard={discardChanges}
                    isSaving={isSaving}
                />
            </SheetContent>
        </Sheet>
    );
}
