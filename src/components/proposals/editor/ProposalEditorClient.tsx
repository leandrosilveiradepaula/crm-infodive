'use client';

import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    ArrowLeft, Download, Loader2, Eye, EyeOff, FileText,
    Shield, Cpu, Monitor, DollarSign, Award,
    Sparkles, Save, ChevronLeft, ChevronRight,
    GripVertical, ImageIcon, Settings2, Type, Wand2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
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
    type BillingOverride,
} from '@/hooks/useProposalEditorState';
import { ClientLogoUpload } from './ClientLogoUpload';
import { useProposalPpt } from '@/hooks/useProposalPpt';
import { useProposalDocx } from '@/hooks/useProposalDocx';
import { getOrganizationTheme } from '@/app/actions/theme-actions';

// ── Preview Page Components ──────────────────────────────────────────
import { ProposalCoverPage } from '@/components/proposals/ProposalCoverPage';
import { ProposalConfidentialityPage } from '@/components/proposals/ProposalConfidentialityPage';
import { ProposalOverviewPage } from '@/components/proposals/ProposalOverviewPage';
import { ProposalHardwarePage } from '@/components/proposals/ProposalHardwarePage';
import { ProposalSoftwarePage } from '@/components/proposals/ProposalSoftwarePage';
import { ProposalInvestmentPage } from '@/components/proposals/ProposalInvestmentPage';
import { ProposalDifferentialsPage } from '@/components/proposals/ProposalDifferentialsPage';
import { ProposalCustomNotesPage } from '@/components/proposals/ProposalCustomNotesPage';

// ── Section Icons ────────────────────────────────────────────────────
const sectionIcons: Record<SectionId, React.ElementType> = {
    cover: FileText,
    confidentiality: Shield,
    overview: Eye,
    hardware: Cpu,
    software: Monitor,
    custom_notes: Type,
    investment: DollarSign,
    differentials: Award,
};

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
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => { setIsMounted(true); }, []);

    // ── Org Theme ─────────────────────────────────────────────────────
    const [orgTheme, setOrgTheme] = useState<{ theme_primary: string | null; theme_accent: string | null }>({
        theme_primary: null, theme_accent: null,
    });

    useEffect(() => {
        getOrganizationTheme().then(setOrgTheme);
    }, []);

    // ── PPT capture refs ──────────────────────────────────────────────
    const coverRef = React.useRef<HTMLDivElement>(null);
    const overviewRef = React.useRef<HTMLDivElement>(null);
    const hardwareRef = React.useRef<HTMLDivElement>(null);
    const softwareRef = React.useRef<HTMLDivElement>(null);
    const investmentRef = React.useRef<HTMLDivElement>(null);
    const differentialsRef = React.useRef<HTMLDivElement>(null);
    const confidentialityRef = React.useRef<HTMLDivElement>(null);
    const customNotesRef = React.useRef<HTMLDivElement>(null);

    const { generatingPpt, handleDownloadPpt } = useProposalPpt();
    const { generatingDocx, handleDownloadDocx } = useProposalDocx();

    const {
        state, dispatch, activeSections, totalValue,
        toggleSection, updateText, updateDifferential, updateConfig,
        selectSection, setAiData, setAiSummary,
        setSoftwareHighlights, setBenefitTiles, setGenerating,
        updateBillingOverride, initBillingOverrides,
    } = useProposalEditorState(deal, initialData);

    // ── Init billing overrides ────────────────────────────────────────
    useEffect(() => {
        if (distributors.length === 0) return;
        const products = deal.deal_products || [];
        const usedDistIds = [...new Set(products.map(p => p.distributor_id).filter(Boolean))] as string[];
        const overrides: Record<string, BillingOverride> = {};
        usedDistIds.forEach(dId => {
            if (state.config.billingOverrides[dId]) return;
            const dist = distributors.find(d => d.id === dId);
            if (dist) {
                overrides[dId] = {
                    selectedCnpj: dist.cnpj || '',
                    selectedBranchName: dist.name,
                    paymentTerms: dist.payment_terms || '',
                };
            }
        });
        if (Object.keys(overrides).length > 0) initBillingOverrides(overrides);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [distributors]);

    // ── DnD ───────────────────────────────────────────────────────────
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
            dispatch({ type: 'REORDER_SECTIONS', sections: arrayMove(state.sections, oldIndex, newIndex) });
        }
    }, [state.sections, dispatch]);

    // ── Selected section for preview ──────────────────────────────────
    const selectedIndex = useMemo(() => {
        if (!state.selectedSectionId) return 0;
        const idx = activeSections.findIndex(s => s.id === state.selectedSectionId);
        return idx >= 0 ? idx : 0;
    }, [state.selectedSectionId, activeSections]);

    const currentSection = activeSections[selectedIndex] || null;

    const goToSection = (dir: -1 | 1) => {
        const newIdx = selectedIndex + dir;
        if (newIdx >= 0 && newIdx < activeSections.length) {
            selectSection(activeSections[newIdx].id);
        }
    };

    // ── AI Summary ────────────────────────────────────────────────────
    const [isGeneratingAI, setIsGeneratingAI] = useState(false);
    const generateAISummary = useCallback(async () => {
        setIsGeneratingAI(true);
        try {
            const products = deal.deal_products || [];
            const response = await fetch('/api/gemini/proposal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    deal: { title: deal.title, company: deal.company, value: totalValue },
                    products: products.map((p: any) => ({
                        name: p.name, category: p.category, quantity: p.quantity, unit_price: p.unit_price,
                    })),
                }),
            });
            if (response.ok) {
                const data = await response.json();
                setAiData({
                    summary: data.summary || '',
                    objectives: data.objectives || [],
                    simplifiedProductNames: data.simplifiedProductNames || {},
                });
                if (data.softwareHighlights) setSoftwareHighlights(data.softwareHighlights);
                if (data.benefitTiles) setBenefitTiles(data.benefitTiles);
                toast.success('Conteúdo IA gerado com sucesso!');
            }
        } catch (error) {
            console.error('Error generating AI summary:', error);
            toast.error('Erro ao gerar conteúdo IA');
        } finally {
            setIsGeneratingAI(false);
        }
    }, [deal, totalValue, setAiData, setSoftwareHighlights, setBenefitTiles]);

    // ── Save Draft ────────────────────────────────────────────────────
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
                throw new Error(errorData.details || errorData.error || 'Erro ao salvar');
            }
            toast.success('Rascunho salvo!');
        } catch (error: any) {
            toast.error(error.message || 'Erro ao salvar rascunho');
        } finally {
            setIsSaving(false);
        }
    }, [deal.id, activeSections, state]);

    // ── PDF Generation ────────────────────────────────────────────────
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
            if (!response.ok) throw new Error((await response.json()).error || 'Erro ao gerar PDF');
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `proposta-${response.headers.get('X-Proposal-Number') || 'draft'}.pdf`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(url);
            toast.success('PDF gerado com sucesso!');
            setTimeout(() => router.push(`/pipeline?dealId=${deal.id}&tab=proposals`), 1500);
        } catch (error: any) {
            toast.error(error.message || 'Erro ao gerar proposta');
        } finally {
            setGenerating(false);
        }
    }, [deal.id, activeSections, state, setGenerating, router]);

    // ── PPT Generation ────────────────────────────────────────────────
    const handleGeneratePpt = useCallback(async () => {
        handleDownloadPpt({
            id: 'draft',
            title: state.editableTexts.proposalTitle,
            company_name: deal.company,
            createdAt: new Date().toISOString(),
            content: {
                config: state.config,
                editableTexts: state.editableTexts,
                aiSummary: state.aiSummary,
                objectives: state.objectives,
            activeSections: activeSections.map(s => s.id),
        },
    }, { coverRef, overviewRef, hardwareRef, softwareRef, investmentRef, differentialsRef, confidentialityRef, customNotesRef });
}, [deal.company, state, activeSections, handleDownloadPpt]);

    // ── DOCX Generation ───────────────────────────────────────────────
    const handleGenerateDocx = useCallback(async () => {
        handleDownloadDocx({
            id: 'draft',
            title: state.editableTexts.proposalTitle,
            company_name: deal.company,
            createdAt: new Date().toISOString(),
            products_json: deal.deal_products || [],
            content: {
                config: state.config,
                editableTexts: state.editableTexts,
                aiSummary: state.aiSummary,
                objectives: state.objectives,
                simplifiedProductNames: state.simplifiedProductNames,
                activeSections: activeSections.map(s => s.id),
            },
        });
    }, [deal, state, activeSections, handleDownloadDocx]);

    const previewDeal = { ...deal, title: state.editableTexts.proposalTitle } as Deal;
    const isExporting = state.isGenerating || generatingPpt || generatingDocx;

    // ═══════════════════════════════════════════════════════════════════
    // RENDER
    // ═══════════════════════════════════════════════════════════════════
    return (
        <div className="w-full h-[calc(100vh-4rem)] flex flex-col bg-background">

            {/* ── HEADER ─────────────────────────────────────────────── */}
            <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 shrink-0 z-40">
                <div className="flex items-center gap-3">
                    <Button
                        variant="ghost" size="icon"
                        onClick={() => router.push(`/pipeline?dealId=${deal.id}&tab=proposals`)}
                        className="text-muted-foreground hover:text-foreground h-8 w-8"
                    >
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                    <div className="h-5 w-px bg-border" />
                    <div>
                        <h1 className="text-sm font-bold text-foreground leading-tight">{deal.title}</h1>
                        <p className="text-xs text-muted-foreground">{deal.company} • Editor de Proposta</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {/* Save */}
                    <Button
                        variant="ghost" size="sm"
                        onClick={handleSave}
                        disabled={isSaving || isExporting}
                        className="text-muted-foreground hover:text-foreground gap-1.5 text-xs h-8"
                    >
                        {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Salvar
                    </Button>

                    <div className="h-5 w-px bg-border" />

                    {/* AI Generate */}
                    <Button
                        variant="outline" size="sm"
                        onClick={generateAISummary}
                        disabled={isGeneratingAI || isExporting}
                        className="gap-1.5 text-xs h-8 text-teal-600 border-teal-200 hover:bg-teal-50 hover:text-teal-700"
                    >
                        {isGeneratingAI
                            ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            : <Wand2 className="w-3.5 h-3.5" />
                        }
                        {state.aiSummary ? 'Regenerar IA' : 'Gerar com IA'}
                    </Button>

                    {/* Export Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline" size="sm"
                                disabled={isExporting || activeSections.length === 0}
                                className="gap-1.5 text-xs h-8"
                            >
                                <Download className="w-3.5 h-3.5" />
                                Exportar
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="min-w-[180px]">
                            <DropdownMenuItem onClick={handleGeneratePpt} disabled={generatingPpt}>
                                <FileText className="w-4 h-4 mr-2" />
                                {generatingPpt ? 'Gerando...' : 'PowerPoint (.pptx)'}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleGenerateDocx} disabled={generatingDocx}>
                                <FileText className="w-4 h-4 mr-2" />
                                {generatingDocx ? 'Gerando...' : 'Word (.docx)'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Primary CTA */}
                    <Button
                        size="sm"
                        onClick={handleGenerate}
                        disabled={isExporting || activeSections.length === 0}
                        className="bg-primary hover:bg-primary/90 text-white gap-1.5 text-xs h-8 px-4 font-bold"
                    >
                        {state.isGenerating
                            ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Gerando...</>
                            : <><Download className="w-3.5 h-3.5" /> Gerar PDF</>
                        }
                    </Button>
                </div>
            </header>

            {/* ── BODY: 3 columns ─────────────────────────────────────── */}
            <div className="flex-1 flex overflow-hidden">

                {/* ── LEFT: Section List (240px) ──────────────────────── */}
                <aside className="w-60 border-r border-border bg-card shrink-0 flex flex-col">
                    <div className="p-3 border-b border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Seções da Proposta</p>
                    </div>
                    <div className="flex-1 overflow-y-auto p-2">
                        {isMounted ? (
                            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                                <SortableContext items={state.sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                                    {state.sections.map(section => (
                                        <SortableSectionItem
                                            key={section.id}
                                            section={section}
                                            isSelected={currentSection?.id === section.id}
                                            onSelect={() => selectSection(section.id)}
                                            onToggle={() => toggleSection(section.id)}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        ) : (
                            state.sections.map(section => {
                                const Icon = sectionIcons[section.id];
                                return (
                                    <div key={section.id} className="flex items-center gap-2 px-2.5 py-2 rounded-lg mb-1 border-l-2 border-transparent">
                                        <div className="w-3" />
                                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                                        <span className="text-xs flex-1 truncate text-foreground/80">{section.label}</span>
                                        <Switch checked={section.enabled} className="scale-[0.55]" />
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Config toggles */}
                    <div className="border-t border-border p-3 space-y-2">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Configurações</p>
                        {[
                            { key: 'showBillingInfo', label: 'Faturamento' },
                            { key: 'isPriceStudy', label: 'Estudo de Preços' },
                            { key: 'allowSignature', label: 'Assinatura Digital' },
                        ].map(item => (
                            <div key={item.key} className="flex items-center justify-between">
                                <span className="text-xs text-foreground">{item.label}</span>
                                <Switch
                                    checked={(state.config as any)[item.key]}
                                    onCheckedChange={v => updateConfig({ [item.key]: v })}
                                    className="scale-[0.65]"
                                />
                            </div>
                        ))}
                    </div>
                </aside>

                {/* ── CENTER: Preview ──────────────────────────────────── */}
                <main className="flex-1 bg-muted/30 flex flex-col overflow-hidden">
                    {/* Nav bar */}
                    <div className="h-10 border-b border-border bg-card/50 flex items-center justify-between px-4 shrink-0">
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost" size="icon"
                                onClick={() => goToSection(-1)}
                                disabled={selectedIndex <= 0}
                                className="h-7 w-7"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-xs font-bold text-foreground min-w-[80px] text-center">
                                {currentSection ? `${selectedIndex + 1} / ${activeSections.length}` : '—'}
                            </span>
                            <Button
                                variant="ghost" size="icon"
                                onClick={() => goToSection(1)}
                                disabled={selectedIndex >= activeSections.length - 1}
                                className="h-7 w-7"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                        {currentSection && (
                            <div className="flex items-center gap-2">
                                {React.createElement(sectionIcons[currentSection.id], { className: 'w-3.5 h-3.5 text-primary' })}
                                <span className="text-xs font-bold text-foreground">{currentSection.label}</span>
                            </div>
                        )}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <span>{activeSections.length} páginas</span>
                            <span>{deal.deal_products?.length || 0} produtos</span>
                            <span className="font-bold text-primary">{formatCurrency(totalValue)}</span>
                        </div>
                    </div>

                    {/* Preview area */}
                    <div className="flex-1 overflow-auto flex items-start justify-center p-6">
                        <AnimatePresence mode="wait">
                            {currentSection ? (
                                <motion.div
                                    key={currentSection.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.2 }}
                                    className="bg-white rounded-lg shadow-xl border border-border overflow-hidden"
                                    style={{ width: '210mm', transformOrigin: 'top center' }}
                                >
                                    <div className="transform scale-[0.55] origin-top-left w-[210mm]" style={{ minHeight: 'calc(297mm * 0.55)' }}>
                                        <PagePreview
                                            sectionId={currentSection.id}
                                            deal={previewDeal}
                                            aiSummary={state.aiSummary}
                                            objectives={state.objectives}
                                            simplifiedProductNames={state.simplifiedProductNames}
                                            editableTexts={state.editableTexts}
                                            distributors={distributors}
                                            billingOverrides={state.config.billingOverrides}
                                        />
                                    </div>
                                </motion.div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
                                    <EyeOff className="w-10 h-10 mb-3 opacity-30" />
                                    <p className="text-sm font-bold">Nenhuma seção ativa</p>
                                    <p className="text-xs mt-1">Ative pelo menos uma seção na barra lateral</p>
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </main>

                {/* ── RIGHT: Inspector ─────────────────────────────────── */}
                <aside className="w-80 border-l border-border bg-card shrink-0 overflow-y-auto flex flex-col">
                    <div className="p-3 border-b border-border">
                        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                            {currentSection ? `Editar: ${currentSection.label}` : 'Propriedades'}
                        </p>
                    </div>
                    <div className="flex-1 p-4 space-y-4 overflow-y-auto custom-scrollbar">
                        {currentSection ? (
                            <InspectorPanel
                                sectionId={currentSection.id}
                                state={state}
                                deal={deal}
                                distributors={distributors}
                                updateText={updateText}
                                updateDifferential={updateDifferential}
                                updateConfig={updateConfig}
                                updateBillingOverride={updateBillingOverride}
                            />
                        ) : (
                            <div className="text-center py-10 text-muted-foreground">
                                <Settings2 className="w-8 h-8 mx-auto mb-3 opacity-30" />
                                <p className="text-xs">Selecione uma seção para editar</p>
                            </div>
                        )}
                    </div>
                </aside>
            </div>

            {/* ── Hidden PPT render ────────────────────────────────────── */}
            {generatingPpt && (
                <div style={{ position: 'absolute', top: '-9999px', left: '-9999px' }}>
                    <div ref={coverRef}>
                        <ProposalCoverPage
                            dealTitle={previewDeal.title} companyName={previewDeal.company}
                            date={new Date().toLocaleDateString('pt-BR')} clientLogo={state.config.clientLogo}
                            themePrimary={orgTheme.theme_primary || undefined} themeAccent={orgTheme.theme_accent || undefined}
                            layout="landscape" hideValues={true} sellerName={previewDeal.owner}
                        />
                    </div>
                    <div ref={confidentialityRef}>
                        <ProposalConfidentialityPage themePrimary={orgTheme.theme_primary || undefined} themeAccent={orgTheme.theme_accent || undefined} layout="landscape" />
                    </div>
                    <div ref={overviewRef}>
                        <ProposalOverviewPage dealTitle={previewDeal.title} aiSummary={state.aiSummary} objectives={state.objectives}
                            themePrimary={orgTheme.theme_primary || undefined} themeAccent={orgTheme.theme_accent || undefined} layout="landscape" />
                    </div>
                    <div ref={hardwareRef}>
                        <ProposalHardwarePage deal={previewDeal} simplifiedProductNames={state.simplifiedProductNames}
                            themePrimary={orgTheme.theme_primary || undefined} themeAccent={orgTheme.theme_accent || undefined} layout="landscape" />
                    </div>
                    <div ref={softwareRef}>
                        <ProposalSoftwarePage deal={previewDeal} simplifiedProductNames={state.simplifiedProductNames}
                            themePrimary={orgTheme.theme_primary || undefined} themeAccent={orgTheme.theme_accent || undefined} layout="landscape" />
                    </div>
                    <div ref={investmentRef}>
                        <ProposalInvestmentPage deal={previewDeal} distributors={distributors as any} config={state.config as any}
                            simplifiedProductNames={state.simplifiedProductNames}
                            themePrimary={orgTheme.theme_primary || undefined} themeAccent={orgTheme.theme_accent || undefined} layout="landscape" />
                    </div>
                    <div ref={differentialsRef}>
                        <ProposalDifferentialsPage themePrimary={orgTheme.theme_primary || undefined} themeAccent={orgTheme.theme_accent || undefined} layout="landscape" />
                    </div>
                    <div ref={customNotesRef}>
                        <ProposalCustomNotesPage 
                            title={state.editableTexts.customNotesTitle} 
                            content={state.editableTexts.customNotesContent} 
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

// ═════════════════════════════════════════════════════════════════════
// SORTABLE SECTION ITEM
// ═════════════════════════════════════════════════════════════════════
function SortableSectionItem({
    section, isSelected, onSelect, onToggle,
}: {
    section: SectionDef;
    isSelected: boolean;
    onSelect: () => void;
    onToggle: () => void;
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: section.id });
    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 50 : undefined,
        opacity: isDragging ? 0.7 : 1,
    };
    const Icon = sectionIcons[section.id];

    return (
        <div
            ref={setNodeRef}
            style={style}
            onClick={() => section.enabled && onSelect()}
            className={`group flex items-center gap-2 px-2.5 py-2 rounded-lg mb-1 transition-all cursor-pointer
                ${isSelected
                    ? 'bg-primary/8 border-l-2 border-primary'
                    : 'hover:bg-muted/50 border-l-2 border-transparent'
                }
                ${!section.enabled ? 'opacity-40' : ''}
                ${isDragging ? 'shadow-lg ring-1 ring-primary/20' : ''}
            `}
        >
            <div
                {...attributes} {...listeners}
                className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={e => e.stopPropagation()}
            >
                <GripVertical className="w-3 h-3" />
            </div>
            <Icon className={`w-3.5 h-3.5 shrink-0 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
            <span className={`text-xs flex-1 truncate ${isSelected ? 'font-bold text-foreground' : 'text-foreground/80'}`}>
                {section.label}
            </span>
            <Switch
                checked={section.enabled}
                onCheckedChange={() => onToggle()}
                onClick={e => e.stopPropagation()}
                className="scale-[0.55]"
            />
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════
// INSPECTOR PANEL (contextual right sidebar)
// ═════════════════════════════════════════════════════════════════════
function InspectorPanel({
    sectionId, state, deal, distributors,
    updateText, updateDifferential, updateConfig, updateBillingOverride,
}: {
    sectionId: SectionId;
    state: any;
    deal: Deal;
    distributors: any[];
    updateText: (key: any, value: any) => void;
    updateDifferential: (index: number, field: any, value: string) => void;
    updateConfig: (updates: any) => void;
    updateBillingOverride: (distributorId: string, override: any) => void;
}) {
    switch (sectionId) {
        case 'cover':
            return (
                <div className="space-y-4">
                    <FieldGroup label="Título da Proposta">
                        <Input
                            value={state.editableTexts.proposalTitle}
                            onChange={e => updateText('proposalTitle', e.target.value)}
                            className="text-xs h-9"
                        />
                    </FieldGroup>
                    <FieldGroup label="Logo do Cliente">
                        <ClientLogoUpload
                            currentLogo={state.config.clientLogo}
                            onLogoChange={logo => updateConfig({ clientLogo: logo })}
                        />
                    </FieldGroup>
                </div>
            );

        case 'confidentiality':
            return (
                <FieldGroup label="Texto de Confidencialidade">
                    <textarea
                        value={state.editableTexts.confidentialityText}
                        onChange={e => updateText('confidentialityText', e.target.value)}
                        rows={8}
                        className="w-full text-xs p-3 rounded-lg bg-muted/30 border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                    />
                </FieldGroup>
            );

        case 'overview':
            return (
                <div className="space-y-4">
                    {state.aiSummary ? (
                        <FieldGroup label="Resumo do Projeto (IA)">
                            <p className="text-xs text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3 border border-border">
                                {state.aiSummary.substring(0, 300)}...
                            </p>
                        </FieldGroup>
                    ) : (
                        <div className="text-center py-6 bg-muted/20 rounded-lg border border-dashed border-border">
                            <Wand2 className="w-6 h-6 mx-auto mb-2 text-muted-foreground/50" />
                            <p className="text-xs text-muted-foreground">
                                Clique em "Gerar com IA" no header para criar o resumo
                            </p>
                        </div>
                    )}
                    {state.objectives?.length > 0 && (
                        <FieldGroup label={`Objetivos (${state.objectives.length})`}>
                            <div className="space-y-2">
                                {state.objectives.map((obj: any, i: number) => (
                                    <div key={i} className="text-xs p-2 bg-muted/20 rounded-lg border border-border">
                                        <p className="font-bold text-foreground">{obj.title}</p>
                                        <p className="text-muted-foreground mt-0.5 text-xs">{obj.description?.substring(0, 100)}</p>
                                    </div>
                                ))}
                            </div>
                        </FieldGroup>
                    )}
                </div>
            );

        case 'differentials':
            return (
                <div className="space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Diferenciais</p>
                    {state.editableTexts.differentials.map((diff: any, i: number) => (
                        <div key={i} className="p-3 bg-muted/20 rounded-lg border border-border space-y-2">
                            <Input
                                value={diff.title}
                                onChange={e => updateDifferential(i, 'title', e.target.value)}
                                className="text-xs h-8 font-bold"
                                placeholder="Título"
                            />
                            <textarea
                                value={diff.description}
                                onChange={e => updateDifferential(i, 'description', e.target.value)}
                                rows={2}
                                className="w-full text-xs p-2 rounded-md bg-background border border-border text-foreground resize-none focus:outline-none focus:ring-1 focus:ring-primary/20"
                                placeholder="Descrição"
                            />
                        </div>
                    ))}
                </div>
            );

        case 'custom_notes':
            return (
                <div className="space-y-4">
                    <FieldGroup label="Título da Página">
                        <Input
                            value={state.editableTexts.customNotesTitle}
                            onChange={e => updateText('customNotesTitle', e.target.value)}
                            className="text-xs h-9"
                            placeholder="Ex: Notas Complementares"
                        />
                    </FieldGroup>
                    <FieldGroup label="Conteúdo Livre">
                        <textarea
                            value={state.editableTexts.customNotesContent}
                            onChange={e => updateText('customNotesContent', e.target.value)}
                            rows={15}
                            className="w-full text-xs p-3 rounded-lg bg-muted/30 border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 leading-relaxed"
                            placeholder="Use este espaço para incluir detalhes do escopo, termos adicionais, ou referências não convencionais..."
                        />
                    </FieldGroup>
                </div>
            );

        case 'investment':
            return (
                <div className="space-y-4">
                    <FieldGroup label="Validade Estudo de Preços">
                        <Input
                            value={state.editableTexts.priceStudyValidity}
                            onChange={e => updateText('priceStudyValidity', e.target.value)}
                            className="text-xs h-9"
                            placeholder="DD/MM/AAAA"
                        />
                    </FieldGroup>
                    <FieldGroup label="Observações">
                        <textarea
                            value={state.editableTexts.generalNotes}
                            onChange={e => updateText('generalNotes', e.target.value)}
                            rows={3}
                            className="w-full text-xs p-2.5 rounded-lg bg-muted/30 border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                            placeholder="Notas adicionais..."
                        />
                    </FieldGroup>

                    {/* Billing overrides */}
                    {state.config.showBillingInfo && (() => {
                        const products = deal.deal_products || [];
                        const usedDistIds = [...new Set(products.map(p => p.distributor_id).filter(Boolean))];
                        const relevantDists = distributors.filter(d => usedDistIds.includes(d.id));
                        if (relevantDists.length === 0) return null;
                        return relevantDists.map(dist => {
                            const override = state.config.billingOverrides[dist.id] || {
                                selectedCnpj: dist.cnpj || '', selectedBranchName: dist.name, paymentTerms: dist.payment_terms || '',
                            };
                            const cnpjOptions = [
                                { label: `${dist.name} (Matriz)`, cnpj: dist.cnpj || '', branchName: dist.name },
                                ...(dist.account_branches || []).filter((b: any) => b.cnpj).map((b: any) => ({
                                    label: b.name, cnpj: b.cnpj, branchName: b.name,
                                })),
                            ];
                            return (
                                <div key={dist.id} className="p-3 rounded-lg bg-muted/20 border border-border space-y-2">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1 h-5 bg-primary rounded-full" />
                                        <p className="text-xs font-bold text-foreground truncate">{dist.name}</p>
                                    </div>
                                    <select
                                        value={override.selectedCnpj}
                                        onChange={e => {
                                            const opt = cnpjOptions.find(o => o.cnpj === e.target.value);
                                            // Pre-fill terms from distributor default if not already set or if user switches branch
                                            // We use the account-level terms as the initial default since we solved the branch column crash
                                            const defaultTerms = dist.payment_terms || '';
                                            
                                            updateBillingOverride(dist.id, {
                                                selectedCnpj: e.target.value,
                                                selectedBranchName: opt?.branchName || dist.name,
                                                paymentTerms: override.paymentTerms || defaultTerms,
                                            });
                                        }}
                                        className="w-full text-xs p-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                                    >
                                        {cnpjOptions.map((opt, i) => (
                                            <option key={i} value={opt.cnpj}>{opt.label} — {opt.cnpj}</option>
                                        ))}
                                    </select>
                                    <textarea
                                        rows={3}
                                        value={override.paymentTerms}
                                        onChange={e => updateBillingOverride(dist.id, { paymentTerms: e.target.value })}
                                        className="w-full text-xs p-2 rounded-lg bg-background border border-border text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        placeholder="Condições de pagamento (separe com ; para bullets)"
                                    />
                                </div>
                            );
                        });
                    })()}
                </div>
            );

        default:
            return (
                <div className="text-center py-10 text-muted-foreground">
                    <p className="text-xs">Esta seção não possui propriedades editáveis</p>
                </div>
            );
    }
}

// ═════════════════════════════════════════════════════════════════════
// FIELD GROUP
// ═════════════════════════════════════════════════════════════════════
function FieldGroup({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                {label}
            </label>
            {children}
        </div>
    );
}

// ═════════════════════════════════════════════════════════════════════
// PAGE PREVIEW
// ═════════════════════════════════════════════════════════════════════
function PagePreview({
    sectionId, deal, aiSummary, objectives, simplifiedProductNames,
    editableTexts, distributors, billingOverrides,
}: {
    sectionId: SectionId;
    deal: Deal;
    aiSummary?: string;
    objectives?: any[];
    simplifiedProductNames?: Record<string, string>;
    editableTexts: any;
    distributors: any[];
    billingOverrides: Record<string, any>;
}) {
    const today = new Date().toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' });

    switch (sectionId) {
        case 'cover':
            return <ProposalCoverPage dealTitle={deal.title} companyName={deal.company || 'Cliente'} date={today} mainTitle={editableTexts?.proposalTitle} sellerName={deal.owner} />;
        case 'confidentiality':
            return <ProposalConfidentialityPage />;
        case 'overview':
            return <ProposalOverviewPage dealTitle={deal.title} aiSummary={aiSummary} objectives={objectives} />;
        case 'hardware':
            return <ProposalHardwarePage deal={deal} simplifiedProductNames={simplifiedProductNames} />;
        case 'software':
            return <ProposalSoftwarePage deal={deal} simplifiedProductNames={simplifiedProductNames} />;
        case 'investment':
            return <ProposalInvestmentPage deal={deal} distributors={distributors} billingOverrides={billingOverrides} simplifiedProductNames={simplifiedProductNames} />;
        case 'differentials':
            return <ProposalDifferentialsPage />;
        case 'custom_notes':
            return <ProposalCustomNotesPage title={editableTexts?.customNotesTitle} content={editableTexts?.customNotesContent} />;
        default:
            return null;
    }
}
