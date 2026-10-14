'use client';

import { useEffect, useState, useRef } from 'react';

import { CheckCircle2, ChevronRight, FileText, Loader2, Sparkles, Zap, Globe, TrendingUp, Shield, Coins, ArrowLeft, FileSignature, CreditCard, Target } from 'lucide-react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import { ProposalCoverPage } from './ProposalCoverPage';
import { ProposalOverviewPage } from './ProposalOverviewPage';
import { ProposalHardwarePage } from './ProposalHardwarePage';
import { ProposalSoftwarePage } from './ProposalSoftwarePage';

import { ProposalInvestmentPage } from './ProposalInvestmentPage';
import { ProposalDifferentialsPage } from './ProposalDifferentialsPage';
import { ProposalConfidentialityPage } from './ProposalConfidentialityPage';
import { ConfigToggle } from './ConfigToggle';
import { ProposalTemplateSelector } from './ProposalTemplateSelector';

import { useProposalIntelligence } from '@/hooks/useProposalIntelligence';
import { useProposalGenerator } from '@/hooks/useProposalGenerator';
import { useProposalPpt } from '@/hooks/useProposalPpt';
import { useProposalDocx } from '@/hooks/useProposalDocx';
import { getOrganizationTheme } from '@/app/actions/theme-actions';
import type { Deal } from '@/types/deal';

interface ProposalGeneratorWizardProps {
    deal: Deal;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess?: () => void;
    distributors?: Array<{ id: string; name: string;[key: string]: unknown }>;
}

export function ProposalGeneratorWizard({ deal, open, onOpenChange, onSuccess, distributors = [] }: ProposalGeneratorWizardProps) {
    const {
        selectedTemplate,
        config,
        selectTemplate,
        updateConfig,
        reset,
        autoConfigure,
    } = useProposalIntelligence();

    // Track last deal ID to know when to force reset
    const lastDealIdRef = useRef<string | null>(null);

    // Map wizard steps: 1=Template, 2=Config, 3=Generate/Success
    const [wizardStep, setWizardStep] = useState(1);

    // Refs for PDF capture
    const coverRef = useRef<HTMLDivElement>(null);
    const overviewRef = useRef<HTMLDivElement>(null);
    const hardwareRef = useRef<HTMLDivElement>(null);
    const softwareRef = useRef<HTMLDivElement>(null);

    const investmentRef = useRef<HTMLDivElement>(null);
    const differentialsRef = useRef<HTMLDivElement>(null);
    const confidentialityRef = useRef<HTMLDivElement>(null);
    const customNotesRef = useRef<HTMLDivElement>(null);

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

    const {
        handleAnalyzeAI,
        handleGeneratePdf,
        loading,
        status,
        setStatus,
        aiSummary,
        setAiSummary,
        objectives,
        setObjectives,
        softwareHighlights,
        setSoftwareHighlights,
        benefitTiles,
        setBenefitTiles,
        simplifiedProductNames,
        proposalNumber,
        setProposalNumber
    } = useProposalGenerator({
        deal,
        config,
        selectedTemplate,
        onSuccess,
        refs: {
            coverRef,
            overviewRef,
            hardwareRef,
            softwareRef,
            investmentRef,
            differentialsRef,
            confidentialityRef,
            customNotesRef
        }
    });

    const { handleDownloadPpt, generatingPpt } = useProposalPpt();
    const { handleDownloadDocx, generatingDocx } = useProposalDocx();

    // Reset wizard only when a DIFFERENT deal is opened
    useEffect(() => {
        if (open) {
            if (lastDealIdRef.current !== deal.id) {
                setWizardStep(1);
                reset();
                autoConfigure(deal.title, deal.deal_products || [], deal.value);
                lastDealIdRef.current = deal.id;
                setAiSummary('');
                setSoftwareHighlights([]);
                setBenefitTiles([]);
                setProposalNumber('');
            } else if (wizardStep === 4) {
                // Was on success screen, reset to step 1 for new attempt
                setWizardStep(1);
            }
            setStatus('idle');
        }
    }, [open, deal.id, deal.title, deal.value, reset, autoConfigure, setAiSummary, setStatus, wizardStep]);

    const handleNextFromConfig = async () => {
        if (config.includeAISummary || config.includeOverview) {
            const success = await handleAnalyzeAI();
            if (success) setWizardStep(3);
        } else {
            setWizardStep(3);
        }
    };

    const handleGenerateClick = async () => {
        const success = await handleGeneratePdf({ aiSummary, objectives });
        if (success) {
            setWizardStep(4);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[90vh] bg-card border-border text-foreground p-0 overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-8 border-b border-border flex justify-between items-center bg-muted/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-32 bg-blue-500/5 blur-3xl rounded-full translate-x-1/2 -translate-y-1/2" />
                    <div className="flex items-center gap-4">
                        <div className="bg-primary p-3 rounded-xl">
                            <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <DialogTitle className="text-xl font-bold text-foreground">Gerador de Propostas IA</DialogTitle>
                            <div className="flex items-center gap-2">
                                <p className="text-xs text-blue-500 font-black uppercase tracking-widest mt-0.5">Configuração Estratégica: {deal.company}</p>
                                {status === 'analyzing_ai' && <Badge variant="secondary" className="bg-teal-500/10 text-teal-400 border-teal-500/20 animate-pulse"><Sparkles className="h-3 w-3 mr-1" /> Analisando Deal...</Badge>}
                                {status === 'capturing_pages' && <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse"><Loader2 className="h-3 w-3 mr-1 animate-spin" /> Renderizando Páginas...</Badge>}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-8 bg-muted/10">
                    {/* Step 1: Template Selection */}
                    {wizardStep === 1 && (
                        <ProposalTemplateSelector
                            selectedTemplate={selectedTemplate}
                            onSelectTemplate={selectTemplate}
                        />
                    )}

                    {/* Step 2: Configuration */}
                    {wizardStep === 2 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 max-w-3xl mx-auto">
                            <div className="text-center space-y-4">
                                <h3 className="text-2xl font-bold">Personalizar Conteúdo</h3>
                                <p className="text-muted-foreground">Selecione quais seções farão parte do documento final.</p>
                            </div>

                            <div className="grid grid-cols-1 gap-4">
                                <div className="p-6 bg-card border border-border rounded-2xl space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                            <FileText className="h-5 w-5" />
                                        </div>
                                        <p className="font-bold text-sm">Título da Proposta (Capa)</p>
                                    </div>
                                    <input
                                        type="text"
                                        value={config.customTitle}
                                        onChange={(e) => updateConfig({ customTitle: e.target.value })}
                                        className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                                        placeholder="Ex: Proposta de Infraestrutura e Licenciamento"
                                    />
                                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Este título aparecerá em destaque na capa do PDF.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <ConfigToggle
                                    label="Resumo Executivo IA"
                                    description="Análise automática do deal pelo Gemini"
                                    icon={Sparkles}
                                    checked={config.includeAISummary}
                                    onChange={(c: boolean) => updateConfig({ includeAISummary: c })}
                                    color="text-teal-400"
                                />
                                <ConfigToggle
                                    label="Overview do Projeto"
                                    description="Objetivos e benefícios principais"
                                    icon={FileText}
                                    checked={config.includeOverview}
                                    onChange={(c: boolean) => updateConfig({ includeOverview: c })}
                                    color="text-blue-400"
                                />
                                <ConfigToggle
                                    label="Infraestrutura Hardware"
                                    description="Specs detalhadas dos equipamentos"
                                    icon={Zap}
                                    checked={config.includeHardware}
                                    onChange={(c: boolean) => updateConfig({ includeHardware: c })}
                                    color="text-orange-400"
                                />
                                <ConfigToggle
                                    label="Software & Licenças"
                                    description="Detalhamento de licenciamento"
                                    icon={Globe}
                                    checked={config.includeSoftware}
                                    onChange={(c: boolean) => updateConfig({ includeSoftware: c })}
                                    color="text-cyan-400"
                                />
                                <ConfigToggle
                                    label="Estrutura de Investimento"
                                    description="Valores e condições comerciais"
                                    icon={Coins}
                                    checked={config.includeInvestment}
                                    onChange={(c: boolean) => updateConfig({ includeInvestment: c })}
                                    color="text-emerald-400"
                                />
                                <ConfigToggle
                                    label="Diferenciais Infodive"
                                    description="Página institucional de valor"
                                    icon={TrendingUp}
                                    checked={config.includeDifferentials}
                                    onChange={(c: boolean) => updateConfig({ includeDifferentials: c })}
                                    color="text-pink-400"
                                />
                                <ConfigToggle
                                    label="Confidencialidade"
                                    description="Termos de NDA e proteção"
                                    icon={Shield}
                                    checked={config.includeConfidentiality}
                                    onChange={(c: boolean) => updateConfig({ includeConfidentiality: c })}
                                    color="text-yellow-400"
                                />
                                <ConfigToggle
                                    label="Assinatura Digital"
                                    description="Permitir assinatura via link público"
                                    icon={FileSignature}
                                    checked={!!config.allowSignature}
                                    onChange={(c: boolean) => updateConfig({ allowSignature: c })}
                                    color="text-green-400"
                                />
                                <ConfigToggle
                                    label="Dados de Faturamento"
                                    description="Exibir CNPJs e termos de pagamento"
                                    icon={CreditCard}
                                    checked={!!config.showBillingInfo}
                                    onChange={(c: boolean) => updateConfig({ showBillingInfo: c })}
                                    color="text-blue-400"
                                />
                                <ConfigToggle
                                    label="Estudo de Preços"
                                    description="Aviso de validade (estudo preliminar)"
                                    icon={TrendingUp}
                                    checked={!!config.isPriceStudy}
                                    onChange={(c: boolean) => updateConfig({ isPriceStudy: c })}
                                    color="text-amber-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Step 3: Content Review & Edit */}
                    {wizardStep === 3 && (
                        <div className="space-y-8 animate-in slide-in-from-right-8 max-w-4xl mx-auto">
                            <div className="text-center space-y-4">
                                <h3 className="text-2xl font-bold">Revisar Conteúdo Estratégico</h3>
                                <p className="text-muted-foreground text-sm">A IA sugeriu o conteúdo abaixo. Você pode ajustar os textos antes de gerar o arquivo final.</p>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
                                {/* Executive Summary */}
                                <div className="p-6 bg-card border border-border rounded-2xl space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-teal-500/10 text-teal-500 rounded-lg">
                                            <Sparkles className="h-5 w-5" />
                                        </div>
                                        <p className="font-bold text-sm">Resumo Executivo (IA)</p>
                                    </div>
                                    <textarea
                                        value={aiSummary}
                                        onChange={(e) => setAiSummary(e.target.value)}
                                        rows={6}
                                        className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition-all resize-none"
                                        placeholder="O resumo aparecerá aqui..."
                                    />
                                </div>

                                {/* Objectives Grid Edit */}
                                {objectives.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-3 px-2">
                                            <div className="p-2 bg-blue-500/10 text-blue-500 rounded-lg">
                                                <Target className="h-4 w-4" />
                                            </div>
                                            <p className="font-bold text-sm">Objetivos Estratégicos</p>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {objectives.map((obj, i) => (
                                                <div key={i} className="p-4 bg-card border border-border rounded-xl space-y-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs font-black bg-blue-500 text-white w-5 h-5 rounded-full flex items-center justify-center">{obj.number}</span>
                                                        <input
                                                            value={obj.title}
                                                            onChange={(e) => {
                                                                const newObjs = [...objectives];
                                                                newObjs[i].title = e.target.value;
                                                                setObjectives(newObjs);
                                                            }}
                                                            className="flex-1 bg-transparent border-none p-0 text-xs font-bold focus:ring-0"
                                                        />
                                                    </div>
                                                    <textarea
                                                        value={obj.description}
                                                        onChange={(e) => {
                                                            const newObjs = [...objectives];
                                                            newObjs[i].description = e.target.value;
                                                            setObjectives(newObjs);
                                                        }}
                                                        rows={2}
                                                        className="w-full bg-muted/30 border-none rounded-lg p-2 text-xs focus:ring-0 resize-none"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Step 4: Success */}
                    {wizardStep === 4 && (
                        <div className="flex flex-col items-center justify-center h-full space-y-6 animate-in zoom-in-95">
                            <div className="h-24 w-24 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500" />
                            </div>
                            <h3 className="text-3xl font-bold">Proposta Criada!</h3>
                            <p className="text-muted-foreground text-center max-w-md">
                                O download do PDF iniciou automaticamente. O documento também foi salvo no histórico do deal.
                            </p>
                            <Button variant="default" onClick={() => onOpenChange(false)} className="bg-primary hover:bg-primary/90 text-white">Fechar Janela</Button>
                        </div>
                    )}
                </div>

                {/* Footer Navigation */}
                {wizardStep < 4 && (
                    <div className="p-8 border-t border-border flex justify-between items-center bg-card/80 backdrop-blur-md">
                        <Button variant="ghost" onClick={() => wizardStep > 1 ? setWizardStep(s => s - 1) : onOpenChange(false)} className="font-bold text-xs uppercase tracking-widest px-6">
                            {wizardStep === 1 ? 'Cancelar' : <><ArrowLeft className="h-3.5 w-3.5 mr-2" /> Voltar</>}
                        </Button>

                        {wizardStep === 1 && (
                            <Button onClick={() => setWizardStep(2)} className="bg-primary hover:bg-primary/90">
                                Configurar <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}

                        {wizardStep === 2 && (
                            <Button onClick={handleNextFromConfig} disabled={loading} className="bg-primary hover:bg-primary/90">
                                {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                {loading ? 'Analisando...' : 'Analisar e Revisar'} <ChevronRight className="h-4 w-4 ml-2" />
                            </Button>
                        )}

                        {wizardStep === 3 && (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => handleGeneratePdf({ aiSummary, objectives })}
                                    disabled={loading}
                                    className="border-primary/20 hover:bg-primary/5"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                                    Gerar PDF
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleDownloadDocx({
                                        ...deal,
                                        company_name: deal.company,
                                        products_json: deal.deal_products,
                                        number: proposalNumber,
                                        content: {
                                            aiSummary,
                                            objectives,
                                            config,
                                            editableTexts: {
                                                proposalTitle: config.customTitle
                                            }
                                        }
                                    })}
                                    disabled={loading || generatingDocx}
                                    className="border-blue-500/20 hover:bg-blue-500/5 text-blue-500"
                                >
                                    {generatingDocx ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />}
                                    Gerar DOCX
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => handleDownloadPpt({ id: deal.id, title: deal.title, company_name: deal.company, number: proposalNumber, content: { config, aiSummary, objectives } }, { coverRef, overviewRef, hardwareRef, softwareRef, investmentRef, differentialsRef, confidentialityRef, customNotesRef })}
                                    disabled={loading || generatingPpt}
                                    className="border-orange-500/20 hover:bg-orange-500/5 text-orange-500"
                                >
                                    {generatingPpt ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Zap className="h-4 w-4 mr-2" />}
                                    Gerar PPT
                                </Button>
                                <Button
                                    onClick={handleGenerateClick}
                                    disabled={loading}
                                    className="bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 border-0"
                                >
                                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                                    {loading ? 'Finalizando...' : 'Concluir & Baixar'}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                {/* Hidden Render Container */}
                <div className="fixed left-[-9999px] top-0 overflow-hidden">
                    {/* Pages to Capture */}
                    <div ref={coverRef}>
                        <ProposalCoverPage
                            dealTitle={deal.title}
                            companyName={deal.company}
                            date={new Date().toLocaleDateString('pt-BR')}
                            clientLogo={config.clientLogo}
                            mainTitle={config.customTitle}
                            proposalNumber={proposalNumber || undefined}
                            themePrimary={orgTheme.theme_primary || undefined}
                            themeAccent={orgTheme.theme_accent || undefined}
                        />
                    </div>

                    <div ref={confidentialityRef}>
                        <ProposalConfidentialityPage
                            themePrimary={orgTheme.theme_primary || undefined}
                            themeAccent={orgTheme.theme_accent || undefined}
                        />
                    </div>

                    <div ref={overviewRef}>
                        <ProposalOverviewPage
                            dealTitle={deal.title}
                            aiSummary={aiSummary}
                            objectives={objectives}
                            themePrimary={orgTheme.theme_primary || undefined}
                            themeAccent={orgTheme.theme_accent || undefined}
                        />
                    </div>

                    <div ref={hardwareRef}>
                        <ProposalHardwarePage
                            deal={deal}
                            simplifiedProductNames={simplifiedProductNames}
                            themePrimary={orgTheme.theme_primary || undefined}
                            themeAccent={orgTheme.theme_accent || undefined}
                        />
                    </div>

                    <div ref={softwareRef}>
                        <ProposalSoftwarePage
                            deal={deal}
                            softwareHighlights={softwareHighlights}
                            benefitTiles={benefitTiles}
                            simplifiedProductNames={simplifiedProductNames}
                            themePrimary={orgTheme.theme_primary || undefined}
                            themeAccent={orgTheme.theme_accent || undefined}
                        />
                    </div>

                    <div ref={investmentRef}>
                        <ProposalInvestmentPage
                            deal={deal}
                            distributors={distributors as any}
                            config={config}
                            simplifiedProductNames={simplifiedProductNames}
                            themePrimary={orgTheme.theme_primary || undefined}
                            themeAccent={orgTheme.theme_accent || undefined}
                        />
                    </div>

                    <div ref={differentialsRef}>
                        <ProposalDifferentialsPage
                            themePrimary={orgTheme.theme_primary || undefined}
                            themeAccent={orgTheme.theme_accent || undefined}
                        />
                    </div>

                    <div ref={customNotesRef}>
                        {/* Placeholder for custom notes if needed in the future, 
                            currently used as ref by hooks */}
                        <div className="bg-white p-20 min-h-[1123px] w-[794px]" />
                    </div>

                    {/* NOTE: If we want to support the legacy contentRef / single page summary, we could add it back here conditionally */}
                </div>
            </DialogContent>
        </Dialog>
    );
}


