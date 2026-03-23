'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Download, Loader2, Eye, EyeOff, FileText,
    Settings2, Type, Shield, Star, Cpu, Monitor, DollarSign, Award,
    Sparkles, Save, ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
    GripVertical, ImageIcon,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    type DragEndEvent,
} from '@dnd-kit/core';
import { formatCurrency } from '@/utils/format';
import {
    SortableContext,
    verticalListSortingStrategy,
    useSortable,
    arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Deal } from '@/types/deal';
import {
    useProposalEditorState,
    type SectionId,
    type SectionDef,
    type TemplateType,
    type BillingOverride,
} from '@/hooks/useProposalEditorState';
import { ClientLogoUpload } from './ClientLogoUpload';
import { useProposalPpt } from '@/hooks/useProposalPpt';
import { getOrganizationTheme } from '@/app/actions/theme-actions';

// ── Preview Page Components (React HTML for visual preview) ──────────
import { ProposalCoverPage } from '@/components/proposals/ProposalCoverPage';
import { ProposalConfidentialityPage } from '@/components/proposals/ProposalConfidentialityPage';
import { ProposalOverviewPage } from '@/components/proposals/ProposalOverviewPage';
import { ProposalHardwarePage } from '@/components/proposals/ProposalHardwarePage';
import { ProposalSoftwarePage } from '@/components/proposals/ProposalSoftwarePage';
import { ProposalInvestmentPage } from '@/components/proposals/ProposalInvestmentPage';
import { ProposalDifferentialsPage } from '@/components/proposals/ProposalDifferentialsPage';

// ── Section Icons ────────────────────────────────────────────────────
const sectionIcons: Record<SectionId, React.ElementType> = {
    cover: FileText,
    confidentiality: Shield,
    overview: Eye,
    hardware: Cpu,
    software: Monitor,
    investment: DollarSign,
    differentials: Award,
};

// ── Template Options ─────────────────────────────────────────────────
const templateOptions: { id: TemplateType; label: string; desc: string }[] = [
    { id: 'executivo', label: 'Executivo Master', desc: 'Design minimalista e autoritativo' },
    { id: 'tecnico', label: 'Mergulho Técnico', desc: 'Foco em arquitetura e especificações' },
    { id: 'detalhado', label: 'Especificação Detalhada', desc: 'Detalhes customizados de produtos' },
    { id: 'rapido', label: 'Via Rápida', desc: 'Fechamentos táticos simplificados' },
];

interface ProposalEditorClientProps {
    deal: Deal;
    distributors?: Array<{
        id: string;
        name: string;
        cnpj: string | null;
        payment_terms: string | null;
        logo_url: string | null;
        account_branches: Array<{ id: string; name: string; cnpj: string | null }>;
        account_contacts: Array<{
            id: string;
            name: string;
            email: string | null;
            mobile_phone: string | null;
            landline_phone: string | null;
            role: string | null;
        }>;
    }>;
    initialData?: any;
}

export function ProposalEditorClient({ deal, distributors = [], initialData }: ProposalEditorClientProps) {
    const router = useRouter();

    // ── Global State ──────────────────────────────────────────────────
    const [orgTheme, setOrgTheme] = React.useState<{ theme_primary: string | null; theme_accent: string | null }>({
        theme_primary: null,
        theme_accent: null
    });

    React.useEffect(() => {
        const fetchOrgTheme = async () => {
            const theme = await getOrganizationTheme();
            setOrgTheme(theme);
        };
        fetchOrgTheme();
    }, []);

    // Refs for PPT capture
    const coverRef = React.useRef<HTMLDivElement>(null);
    const overviewRef = React.useRef<HTMLDivElement>(null);
    const hardwareRef = React.useRef<HTMLDivElement>(null);
    const softwareRef = React.useRef<HTMLDivElement>(null);
    const investmentRef = React.useRef<HTMLDivElement>(null);
    const differentialsRef = React.useRef<HTMLDivElement>(null);
    const confidentialityRef = React.useRef<HTMLDivElement>(null);

    const { generatingPpt, handleDownloadPpt } = useProposalPpt();

    const {
        state,
        dispatch,
        activeSections,
        totalValue,
        toggleSection,
        updateText,
        updateDifferential,
        updateConfig,
        setTemplate,
        selectSection,
        setAiSummary,
        setSoftwareHighlights,
        setBenefitTiles,
        setGenerating,
        updateBillingOverride,
        initBillingOverrides,
    } = useProposalEditorState(deal, initialData);

    // ── Init billing overrides from distributor data ─────────────────
    useEffect(() => {
        if (distributors.length === 0) return;
        // Only init overrides that don't already have saved data
        const products = deal.deal_products || [];
        const usedDistIds = [...new Set(products.map(p => p.distributor_id).filter(Boolean))] as string[];
        const overrides: Record<string, BillingOverride> = {};
        usedDistIds.forEach(dId => {
            if (state.config.billingOverrides[dId]) return; // already has saved override
            const dist = distributors.find(d => d.id === dId);
            if (dist) {
                overrides[dId] = {
                    selectedCnpj: dist.cnpj || '',
                    selectedBranchName: dist.name,
                    paymentTerms: dist.payment_terms || '',
                };
            }
        });
        if (Object.keys(overrides).length > 0) {
            initBillingOverrides(overrides);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [distributors]);

    // dnd-kit sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
        useSensor(KeyboardSensor)
    );

    const handleDragEnd = useCallback((event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = state.sections.findIndex(s => s.id === active.id);
        const newIndex = state.sections.findIndex(s => s.id === over.id);
        if (oldIndex !== -1 && newIndex !== -1) {
            const newSections = arrayMove(state.sections, oldIndex, newIndex);
            dispatch({ type: 'REORDER_SECTIONS', sections: newSections });
        }
    }, [state.sections, dispatch]);

    const [expandedPanels, setExpandedPanels] = useState<Record<string, boolean>>({
        template: true,
        sections: true,
        texts: false,
        config: false,
    });

    const [previewSection, setPreviewSection] = useState<SectionId | null>(null);

    const togglePanel = (panel: string) => {
        setExpandedPanels(prev => ({ ...prev, [panel]: !prev[panel] }));
    };

    // ── AI Summary Generation ────────────────────────────────────────
    const generateAISummary = useCallback(async () => {
        try {
            const products = deal.deal_products || [];
            const response = await fetch('/api/gemini/proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deal: {
                        title: deal.title,
                        company: deal.company,
                        value: totalValue,
                    },
                    products: products.map((p: any) => ({
                        name: p.name,
                        category: p.category,
                        quantity: p.quantity,
                        unit_price: p.unit_price,
                    })),
                }),
            });

            if (response.ok) {
                const data = await response.json();
                setAiSummary(data.summary || data.content || '');
                toast.success('Sumário AI gerado com sucesso!');
            }
        } catch (error) {
            console.error('Error generating AI summary:', error);
            toast.error('Erro ao gerar sumário AI');
        }
    }, [deal, totalValue, setAiSummary]);

    // ── Save Draft ───────────────────────────────────────────────────
    const [isSaving, setIsSaving] = useState(false);
    const handleSave = useCallback(async () => {
        setIsSaving(true);
        try {
            const response = await fetch('/api/proposals/save-draft', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dealId: deal.id,
                    activeSections: activeSections.map(s => s.id),
                    editableTexts: state.editableTexts,
                    config: state.config,
                    aiSummary: state.aiSummary || undefined,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || errorData.error || 'Erro ao salvar rascunho');
            }

            toast.success('Rascunho salvo com sucesso!');
        } catch (error: any) {
            console.error('Error saving draft:', error);
            toast.error(error.message || 'Erro ao salvar rascunho');
        } finally {
            setIsSaving(false);
        }
    }, [deal.id, activeSections, state]);

    // ── PDF Generation ───────────────────────────────────────────────
    const handleGenerate = useCallback(async () => {
        setGenerating(true);
        try {
            const response = await fetch('/api/proposals/generate-pdf', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dealId: deal.id,
                    activeSections: activeSections.map(s => s.id),
                    editableTexts: state.editableTexts,
                    config: state.config,
                    aiSummary: state.aiSummary || undefined,
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || 'Erro ao gerar PDF');
            }

            // Download PDF
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            const proposalNumber = response.headers.get('X-Proposal-Number') || 'draft';
            a.download = `proposta-${proposalNumber}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);

            toast.success('Proposta gerada e salva com sucesso!');

            // Navigate back to deal
            setTimeout(() => {
                router.push(`/pipeline?dealId=${deal.id}&tab=proposals`);
            }, 1500);
        } catch (error: any) {
            console.error('Error generating proposal:', error);
            toast.error(error.message || 'Erro ao gerar proposta');
        } finally {
            setGenerating(false);
        }
    }, [deal.id, activeSections, state, setGenerating, router]);

    // ── PPT Generation ────────────────────────────────────────+++++++───
    const handleGeneratePpt = useCallback(async () => {
        // Mock a proposal object since we are in the editor
        // useProposalPpt expects: content.config, content.editableTexts, title, company_name, createdAt
        const mockProposal = {
            id: 'draft',
            title: state.editableTexts.proposalTitle,
            company_name: deal.company,
            createdAt: new Date().toISOString(),
            content: {
                activeSections: activeSections.map(s => s.id),
                config: state.config,
                editableTexts: state.editableTexts
            }
        };

        handleDownloadPpt(mockProposal, {
            coverRef,
            overviewRef,
            hardwareRef,
            softwareRef,
            investmentRef,
            differentialsRef,
            confidentialityRef
        });
    }, [deal.company, state.config, state.editableTexts, handleDownloadPpt]);

    // ── Build preview pseudo-deal for React preview components ───────
    const previewDeal = {
        ...deal,
        title: state.editableTexts.proposalTitle,
    } as Deal;

    return (
        <div className="w-full flex flex-col bg-background rounded-xl border border-border mt-2 mb-8 shadow-sm relative">
            {/* ── Top Bar ──────────────────────────────────────────── */}
            <header className="sticky top-0 z-50 h-16 border-b border-border bg-card flex items-center justify-between px-4 lg:px-6 shrink-0 rounded-t-xl">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => router.push(`/pipeline?dealId=${deal.id}&tab=proposals`)}
                        className="text-muted-foreground hover:text-foreground gap-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Button>
                    <div className="w-px h-6 bg-border" />
                    <div>
                        <h1 className="text-sm font-bold text-foreground tracking-tight">
                            Editor de Proposta
                        </h1>
                        <p className="text-[10px] text-muted-foreground font-medium">
                            {deal.title} • {deal.company}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSave}
                        disabled={isSaving || state.isGenerating}
                        className="text-primary border-primary/20 hover:bg-primary/5 gap-2 text-xs font-bold"
                    >
                        {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <Save className="w-3.5 h-3.5" />
                        )}
                        Salvar
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleGeneratePpt}
                        disabled={state.isGenerating || generatingPpt || activeSections.length === 0}
                        className="text-stage-proposal border-stage-proposal/20 hover:bg-stage-proposal/5 gap-2 text-xs font-bold"
                    >
                        {generatingPpt ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                            <FileText className="w-3.5 h-3.5" />
                        )}
                        Gerar PPT (Híbrido)
                    </Button>

                    {state.config.includeAISummary && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={generateAISummary}
                            className="text-purple-600 border-purple-200 hover:bg-purple-50 gap-2 text-xs font-bold"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            {state.aiSummary ? 'Regenerar Sumário AI' : 'Gerar Sumário AI'}
                        </Button>
                    )}

                    <Button
                        onClick={handleGenerate}
                        disabled={state.isGenerating || generatingPpt || activeSections.length === 0}
                        className="bg-primary hover:bg-primary/90 text-white gap-2 font-bold text-xs px-6"
                    >
                        {state.isGenerating ? (
                            <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Gerando...
                            </>
                        ) : (
                            <>
                                <Download className="w-4 h-4" />
                                Gerar PDF e Salvar
                            </>
                        )}
                    </Button>
                </div>
            </header>

            {/* ── Main Content ─────────────────────────────────────── */}
            <div className="flex-1 flex flex-col lg:flex-row relative">

                {/* ── Left Sidebar (Config) ──────────────────────── */}
                <aside className="w-full lg:w-[360px] border-r border-border bg-card shrink-0 lg:sticky lg:top-16 lg:max-h-[calc(100vh-8rem)] lg:overflow-y-auto custom-scrollbar">
                    <div className="p-5 space-y-1">

                        {/* Template Selection */}
                        <CollapsiblePanel
                            title="Template"
                            icon={Settings2}
                            isOpen={expandedPanels.template}
                            onToggle={() => togglePanel('template')}
                        >
                            <div className="grid grid-cols-2 gap-2">
                                {templateOptions.map(t => (
                                    <button
                                        key={t.id}
                                        onClick={() => setTemplate(t.id)}
                                        className={`p-3 rounded-xl border-2 transition-all text-left ${state.config.template === t.id
                                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 shadow-sm'
                                            : 'border-border hover:border-blue-300 hover:bg-muted/50'
                                            }`}
                                    >
                                        <p className={`text-[11px] font-bold ${state.config.template === t.id ? 'text-primary' : 'text-foreground'
                                            }`}>{t.label}</p>
                                        <p className="text-[9px] text-muted-foreground mt-0.5">{t.desc}</p>
                                    </button>
                                ))}
                            </div>
                        </CollapsiblePanel>

                        {/* Sections Toggle */}
                        <CollapsiblePanel
                            title="Seções"
                            icon={Eye}
                            isOpen={expandedPanels.sections}
                            onToggle={() => togglePanel('sections')}
                            badge={`${activeSections.length}/${state.sections.length}`}
                        >
                            <div className="space-y-1.5">
                                {state.sections.map(section => {
                                    const Icon = sectionIcons[section.id];
                                    return (
                                        <div
                                            key={section.id}
                                            className={`flex items-center justify-between p-2.5 rounded-lg transition-all cursor-pointer ${section.enabled
                                                ? 'bg-blue-50/60 dark:bg-blue-500/5 border border-blue-200 dark:border-blue-500/20'
                                                : 'bg-muted/30 border border-transparent hover:border-border'
                                                }`}
                                            onClick={() => section.enabled && selectSection(section.id)}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <Icon className={`w-3.5 h-3.5 ${section.enabled ? 'text-blue-500' : 'text-muted-foreground'
                                                    }`} />
                                                <span className={`text-xs font-bold ${section.enabled ? 'text-foreground' : 'text-muted-foreground'
                                                    }`}>{section.label}</span>
                                            </div>
                                            <Switch
                                                checked={section.enabled}
                                                onCheckedChange={() => toggleSection(section.id)}
                                                className="scale-75"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </CollapsiblePanel>

                        {/* Editable Texts */}
                        <CollapsiblePanel
                            title="Textos Editáveis"
                            icon={Type}
                            isOpen={expandedPanels.texts}
                            onToggle={() => togglePanel('texts')}
                        >
                            <div className="space-y-4">
                                {/* Proposal Title */}
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                        Título da Proposta
                                    </label>
                                    <Input
                                        value={state.editableTexts.proposalTitle}
                                        onChange={e => updateText('proposalTitle', e.target.value)}
                                        className="text-xs h-9 bg-muted/30 border-border"
                                    />
                                </div>

                                {/* Confidentiality Text */}
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                        Termo de Confidencialidade
                                    </label>
                                    <textarea
                                        value={state.editableTexts.confidentialityText}
                                        onChange={e => updateText('confidentialityText', e.target.value)}
                                        rows={4}
                                        className="w-full text-xs p-2.5 rounded-lg bg-muted/30 border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                    />
                                </div>

                                {/* Differentials */}
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                        Diferenciais
                                    </label>
                                    {state.editableTexts.differentials.map((diff, i) => (
                                        <div key={i} className="mb-3 p-3 bg-muted/20 rounded-lg border border-border">
                                            <Input
                                                value={diff.title}
                                                onChange={e => updateDifferential(i, 'title', e.target.value)}
                                                className="text-xs h-8 mb-1.5 bg-transparent border-border font-bold"
                                                placeholder="Título"
                                            />
                                            <textarea
                                                value={diff.description}
                                                onChange={e => updateDifferential(i, 'description', e.target.value)}
                                                rows={2}
                                                className="w-full text-[11px] p-2 rounded-md bg-transparent border border-border text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-blue-500/20"
                                                placeholder="Descrição"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Price Study Validity */}
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                        Validade do Estudo de Preços
                                    </label>
                                    <Input
                                        value={state.editableTexts.priceStudyValidity}
                                        onChange={e => updateText('priceStudyValidity', e.target.value)}
                                        className="text-xs h-9 bg-muted/30 border-border"
                                        placeholder="DD/MM/AAAA"
                                    />
                                </div>

                                {/* General Notes */}
                                <div>
                                    <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                                        Observações Gerais
                                    </label>
                                    <textarea
                                        value={state.editableTexts.generalNotes}
                                        onChange={e => updateText('generalNotes', e.target.value)}
                                        rows={3}
                                        className="w-full text-xs p-2.5 rounded-lg bg-muted/30 border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                        placeholder="Notas adicionais..."
                                    />
                                </div>
                            </div>
                        </CollapsiblePanel>

                        {/* Config Switches */}
                        <CollapsiblePanel
                            title="Configurações"
                            icon={Settings2}
                            isOpen={expandedPanels.config}
                            onToggle={() => togglePanel('config')}
                        >
                            <div className="space-y-3">
                                {[
                                    { key: 'includeAISummary', label: 'Resumo com IA', desc: 'Gera overview automático via Gemini' },
                                    { key: 'showBillingInfo', label: 'Info de Faturamento', desc: 'Exibe dados de billing por distribuidor' },
                                    { key: 'isPriceStudy', label: 'Estudo de Preços', desc: 'Marca como estudo de preços com validade' },
                                    { key: 'allowSignature', label: 'Assinatura Digital', desc: 'Habilita assinatura digital na proposta' },
                                ].map(item => (
                                    <div key={item.key} className="flex items-center justify-between p-2.5 rounded-lg bg-muted/20 border border-border">
                                        <div>
                                            <p className="text-xs font-bold text-foreground">{item.label}</p>
                                            <p className="text-[9px] text-muted-foreground">{item.desc}</p>
                                        </div>
                                        <Switch
                                            checked={(state.config as any)[item.key]}
                                            onCheckedChange={v => {
                                                updateConfig({ [item.key]: v });
                                                if (item.key === 'includeAISummary' && !v) {
                                                    setAiSummary('');
                                                    setSoftwareHighlights([]);
                                                    setBenefitTiles([]);
                                                }
                                            }}
                                            className="scale-75"
                                        />
                                    </div>
                                ))}
                            </div>
                        </CollapsiblePanel>

                        {/* Client Logo Upload */}
                        <CollapsiblePanel
                            title="Logo do Cliente"
                            icon={ImageIcon}
                            isOpen={expandedPanels.logo || false}
                            onToggle={() => togglePanel('logo')}
                        >
                            <ClientLogoUpload
                                currentLogo={state.config.clientLogo}
                                onLogoChange={(logo) => updateConfig({ clientLogo: logo })}
                            />
                        </CollapsiblePanel>

                        {/* Billing Editor — only when showBillingInfo is on */}
                        {state.config.showBillingInfo && (() => {
                            const products = deal.deal_products || [];
                            const usedDistIds = [...new Set(products.map(p => p.distributor_id).filter(Boolean))];
                            const relevantDists = distributors.filter(d => usedDistIds.includes(d.id));
                            if (relevantDists.length === 0) return null;
                            return (
                                <CollapsiblePanel
                                    title="Faturamento"
                                    icon={DollarSign}
                                    isOpen={expandedPanels.billing || false}
                                    onToggle={() => togglePanel('billing')}
                                >
                                    <div className="space-y-4">
                                        {relevantDists.map(dist => {
                                            const override = state.config.billingOverrides[dist.id] || {
                                                selectedCnpj: dist.cnpj || '',
                                                selectedBranchName: dist.name,
                                                paymentTerms: dist.payment_terms || '',
                                            };
                                            // Build CNPJ options: main + branches
                                            const cnpjOptions = [
                                                { label: `${dist.name} (Matriz)`, cnpj: dist.cnpj || '', branchName: dist.name },
                                                ...(dist.account_branches || []).filter((b: any) => b.cnpj).map((b: any) => ({
                                                    label: `${b.name}`, cnpj: b.cnpj, branchName: b.name,
                                                })),
                                            ];
                                            return (
                                                <div key={dist.id} className="p-3 rounded-xl bg-muted/30 border border-border space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                                                        <p className="text-xs font-black text-foreground truncate">{dist.name}</p>
                                                    </div>
                                                    {/* CNPJ / Branch Select */}
                                                    <div>
                                                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">CNPJ / Filial</label>
                                                        <select
                                                            value={override.selectedCnpj}
                                                            onChange={e => {
                                                                const opt = cnpjOptions.find(o => o.cnpj === e.target.value);
                                                                updateBillingOverride(dist.id, {
                                                                    selectedCnpj: e.target.value,
                                                                    selectedBranchName: opt?.branchName || dist.name,
                                                                });
                                                            }}
                                                            className="w-full text-xs p-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                        >
                                                            {cnpjOptions.map((opt, i) => (
                                                                <option key={i} value={opt.cnpj}>
                                                                    {opt.label} — {opt.cnpj}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                    {/* Payment Terms */}
                                                    <div>
                                                        <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Condições de Pagamento</label>
                                                        <textarea
                                                            rows={4}
                                                            value={override.paymentTerms}
                                                            onChange={e => updateBillingOverride(dist.id, { paymentTerms: e.target.value })}
                                                            className="w-full text-xs p-2.5 rounded-lg bg-background border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                                                            placeholder="Separe condições com ; para listar em bullets"
                                                        />
                                                        <p className="text-[8px] text-muted-foreground mt-1">Separe itens com ; para bullet points</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </CollapsiblePanel>
                            );
                        })()}
                    </div>
                </aside>

                {/* ── Preview Area ────────────────────────────────── */}
                <main className="flex-1 bg-muted/20 p-4 lg:p-8 min-h-[600px] overflow-auto">
                    <div className="max-w-[900px] mx-auto space-y-6">
                        {/* Summary Bar */}
                        <div className="flex items-center justify-between p-4 bg-card rounded-xl border border-border shadow-sm">
                            <div className="flex items-center gap-6">
                                <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Páginas</p>
                                    <p className="text-lg font-black text-foreground">{activeSections.length}</p>
                                </div>
                                <div className="w-px h-8 bg-border" />
                                <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Produtos</p>
                                    <p className="text-lg font-black text-foreground">{deal.deal_products?.length || 0}</p>
                                </div>
                                <div className="w-px h-8 bg-border" />
                                <div>
                                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Valor Total</p>
                                    <p className="text-lg font-black text-primary">
                                        {formatCurrency(totalValue)}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <FileText className="w-4 h-4" />
                                Template: <span className="font-bold text-foreground capitalize">{state.config.template}</span>
                            </div>
                        </div>

                        {/* Page Thumbnails */}
                        {activeSections.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                <EyeOff className="w-12 h-12 mb-4 opacity-30" />
                                <p className="text-sm font-bold">Nenhuma seção ativa</p>
                                <p className="text-xs mt-1">Ative pelo menos uma seção na sidebar</p>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext
                                    items={activeSections.map(s => s.id)}
                                    strategy={verticalListSortingStrategy}
                                >
                                    {activeSections.map((section, index) => (
                                        <SortablePageCard
                                            key={section.id}
                                            section={section}
                                            index={index}
                                            total={activeSections.length}
                                            isSelected={state.selectedSectionId === section.id}
                                            onSelect={() => selectSection(section.id)}
                                            previewDeal={previewDeal}
                                            aiSummary={state.aiSummary}
                                            editableTexts={state.editableTexts}
                                            distributors={distributors}
                                            billingOverrides={state.config.billingOverrides}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        )}
                    </div>
                </main>
            </div>

            {/* Hidden Render Container for PPT */}
            {generatingPpt && (
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                    <div ref={coverRef}>
                        <ProposalCoverPage
                            dealTitle={previewDeal.title}
                            companyName={previewDeal.company}
                            date={new Date().toLocaleDateString('pt-BR')}
                            clientLogo={state.config.clientLogo}
                            themePrimary={orgTheme.theme_primary || undefined}
                            themeAccent={orgTheme.theme_accent || undefined}
                            layout="landscape"
                            hideValues={true}
                        />
                    </div>

                    <div ref={confidentialityRef}>
                        <ProposalConfidentialityPage
                            themePrimary={orgTheme.theme_primary || undefined}
                            themeAccent={orgTheme.theme_accent || undefined}
                            layout="landscape"
                        />
                    </div>

                    <div ref={overviewRef}>
                        <ProposalOverviewPage
                            dealTitle={previewDeal.title}
                            aiSummary={state.aiSummary}
                            themePrimary={orgTheme.theme_primary || undefined}
                            themeAccent={orgTheme.theme_accent || undefined}
                            layout="landscape"
                        />
                    </div>

                    <div ref={hardwareRef}>
                        <ProposalHardwarePage
                            deal={previewDeal}
                            themePrimary={orgTheme.theme_primary || undefined}
                            themeAccent={orgTheme.theme_accent || undefined}
                            layout="landscape"
                        />
                    </div>

                    <div ref={softwareRef}>
                        <ProposalSoftwarePage
                            deal={previewDeal}
                            themePrimary={orgTheme.theme_primary || undefined}
                            themeAccent={orgTheme.theme_accent || undefined}
                            layout="landscape"
                        />
                    </div>

                    <div ref={investmentRef}>
                        <ProposalInvestmentPage
                            deal={previewDeal}
                            distributors={distributors}
                            config={state.config as any}
                            themePrimary={orgTheme.theme_primary || undefined}
                            themeAccent={orgTheme.theme_accent || undefined}
                            layout="landscape"
                        />
                    </div>

                    <div ref={differentialsRef}>
                        <ProposalDifferentialsPage
                            themePrimary={orgTheme.theme_primary || undefined}
                            themeAccent={orgTheme.theme_accent || undefined}
                            layout="landscape"
                        />
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Sortable Page Card (dnd-kit) ──────────────────────────────────
function SortablePageCard({
    section,
    index,
    total,
    isSelected,
    onSelect,
    previewDeal,
    aiSummary,
    editableTexts,
    distributors,
    billingOverrides,
}: {
    section: SectionDef;
    index: number;
    total: number;
    isSelected: boolean;
    onSelect: () => void;
    previewDeal: Deal;
    aiSummary?: string;
    editableTexts: any;
    distributors: any[];
    billingOverrides: Record<string, any>;
}) {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.85 : 1,
    };

    const Icon = sectionIcons[section.id];

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`group relative cursor-pointer rounded-xl overflow-hidden border-2 transition-all shadow-sm hover:shadow-lg mb-6 ${isSelected
                ? 'border-blue-500 shadow-blue-200/50 dark:shadow-blue-500/20'
                : 'border-border hover:border-blue-300'
                } ${isDragging ? 'shadow-2xl ring-2 ring-blue-400/30' : ''}`}
            onClick={onSelect}
        >
            {/* Section Badge + Drag Handle */}
            <div className="absolute top-3 left-3 z-10 flex items-center gap-2 bg-card/90 backdrop-blur-sm px-3 py-1.5 rounded-lg border border-border shadow-sm">
                <div
                    {...attributes}
                    {...listeners}
                    className="cursor-grab active:cursor-grabbing p-0.5 -ml-1 text-muted-foreground hover:text-blue-500 transition-colors"
                    onClick={(e) => e.stopPropagation()}
                >
                    <GripVertical className="w-3.5 h-3.5" />
                </div>
                <Icon className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-[10px] font-bold text-foreground uppercase tracking-wider">
                    {section.label}
                </span>
                <span className="text-[9px] text-muted-foreground">
                    {index + 1}/{total}
                </span>
            </div>

            {/* Preview Thumbnail */}
            <div className="transform scale-[0.35] origin-top-left w-[210mm] pointer-events-none"
                style={{ minHeight: 'calc(297mm * 0.35)' }}>
                <PagePreview
                    sectionId={section.id}
                    deal={previewDeal}
                    aiSummary={aiSummary}
                    editableTexts={editableTexts}
                    distributors={distributors}
                    billingOverrides={billingOverrides}
                />
            </div>
        </div>
    );
}

// ── Collapsible Panel ────────────────────────────────────────────────
function CollapsiblePanel({
    title, icon: Icon, isOpen, onToggle, badge, children,
}: {
    title: string;
    icon: React.ElementType;
    isOpen: boolean;
    onToggle: () => void;
    badge?: string;
    children: React.ReactNode;
}) {
    return (
        <div className="rounded-xl border border-border overflow-hidden">
            <button
                onClick={onToggle}
                className="w-full flex items-center justify-between p-3 bg-muted/20 hover:bg-muted/40 transition-colors"
            >
                <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold text-foreground uppercase tracking-wider">{title}</span>
                    {badge && (
                        <span className="text-[9px] font-bold bg-blue-100 text-primary px-1.5 py-0.5 rounded-full dark:bg-blue-500/20">
                            {badge}
                        </span>
                    )}
                </div>
                {isOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
            </button>
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                    >
                        <div className="p-3 pt-2">
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ── Page Preview (renders existing React components for visual preview) ──
function PagePreview({
    sectionId,
    deal,
    aiSummary,
    editableTexts,
    distributors,
    billingOverrides,
}: {
    sectionId: SectionId;
    deal: Deal;
    aiSummary?: string;
    editableTexts: any;
    distributors: any[];
    billingOverrides: Record<string, any>;
}) {
    const today = new Date().toLocaleDateString('pt-BR', {
        day: '2-digit', month: 'long', year: 'numeric',
    });

    switch (sectionId) {
        case 'cover':
            return (
                <ProposalCoverPage
                    dealTitle={deal.title}
                    companyName={deal.company || 'Cliente'}
                    date={today}
                    mainTitle={editableTexts?.proposalTitle}
                />
            );
        case 'confidentiality':
            return <ProposalConfidentialityPage />;
        case 'overview':
            return <ProposalOverviewPage dealTitle={deal.title} aiSummary={aiSummary} />;
        case 'hardware':
            return <ProposalHardwarePage deal={deal} />;
        case 'software':
            return <ProposalSoftwarePage deal={deal} />;
        case 'investment':
            return <ProposalInvestmentPage deal={deal} distributors={distributors} billingOverrides={billingOverrides} />;
        case 'differentials':
            return <ProposalDifferentialsPage />;
        default:
            return null;
    }
}
