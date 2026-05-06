'use client';

import { useReducer, useMemo, useCallback } from 'react';
import type { Deal } from '@/types/deal';
import { isHardware, isSoftware, isSupport } from '@/utils/productClassification';

// ── Section IDs ───────────────────────────────────────────────────────
export type SectionId =
    | 'cover'
    | 'confidentiality'
    | 'overview'
    | 'hardware'
    | 'software'
    | 'custom_notes'
    | 'investment'
    | 'differentials';

export interface SectionDef {
    id: SectionId;
    label: string;
    enabled: boolean;
}

// ── Template Types ────────────────────────────────────────────────────
export type TemplateType = 'executivo' | 'tecnico' | 'detalhado' | 'rapido';

// ── Editable Texts ────────────────────────────────────────────────────
export interface EditableTexts {
    proposalTitle: string;
    confidentialityText: string;
    differentials: Array<{ title: string; description: string; icon: string }>;
    priceStudyValidity: string;
    generalNotes: string;
    customNotesTitle: string;
    customNotesContent: string;
}

// ── Billing Override (per distributor, per proposal) ──────────────────
export interface BillingOverride {
    selectedCnpj: string;
    selectedBranchName: string;
    paymentTerms: string;
}

// ── Config ────────────────────────────────────────────────────────────
export interface EditorConfig {
    template: TemplateType;
    showBillingInfo: boolean;
    isPriceStudy: boolean;
    allowSignature: boolean;
    includeAISummary: boolean;
    quoteDisplayMode: 'consolidated' | 'options';
    clientLogo?: string;
    billingOverrides: Record<string, BillingOverride>;
}

// ── State ─────────────────────────────────────────────────────────────
export interface ProposalEditorState {
    sections: SectionDef[];
    editableTexts: EditableTexts;
    config: EditorConfig;
    selectedSectionId: SectionId | null;
    aiSummary: string;
    objectives: any[];
    simplifiedProductNames: Record<string, string>;
    softwareHighlights: Array<{ title: string; value: string }>;
    benefitTiles: Array<{ value: string; label: string }>;
    isGenerating: boolean;
}

// ── Actions ───────────────────────────────────────────────────────────
export type EditorAction =
    | { type: 'TOGGLE_SECTION'; id: SectionId }
    | { type: 'REORDER_SECTIONS'; sections: SectionDef[] }
    | { type: 'UPDATE_TEXT'; key: keyof EditableTexts; value: any }
    | { type: 'UPDATE_DIFFERENTIAL'; index: number; field: 'title' | 'description' | 'icon'; value: string }
    | { type: 'UPDATE_CONFIG'; updates: Partial<EditorConfig> }
    | { type: 'SET_TEMPLATE'; template: TemplateType }
    | { type: 'SELECT_SECTION'; id: SectionId | null }
    | { type: 'SET_AI_DATA'; data: { summary?: string; objectives?: any[]; simplifiedProductNames?: Record<string, string> } }
    | { type: 'SET_AI_SUMMARY'; summary: string }
    | { type: 'SET_SOFTWARE_HIGHLIGHTS'; highlights: Array<{ title: string; value: string }> }
    | { type: 'SET_BENEFIT_TILES'; tiles: Array<{ value: string; label: string }> }
    | { type: 'SET_GENERATING'; value: boolean }
    | { type: 'SET_ACTIVE_SECTIONS'; sections: SectionId[] }
    | { type: 'UPDATE_BILLING_OVERRIDE'; distributorId: string; override: Partial<BillingOverride> }
    | { type: 'INIT_BILLING_OVERRIDES'; overrides: Record<string, BillingOverride> }
    | { type: 'RESET'; deal: Deal };

// ── Default Texts ─────────────────────────────────────────────────────
const DEFAULT_DIFFERENTIALS = [
    {
        title: 'Expertise Técnica Comprovada',
        description: 'Equipe certificada com anos de experiência em infraestrutura crítica e soluções enterprise',
        icon: '🎯',
    },
    {
        title: 'Parcerias Estratégicas',
        description: 'Parceiros oficiais Lenovo, Microsoft, Veeam, Virtuozzo, IBM, VMware, RedHat e principais fabricantes do mercado',
        icon: '🤝',
    },
    {
        title: 'Foco no Sucesso do Cliente',
        description: 'Suporte dedicado e acompanhamento contínuo pós-implementação para garantir resultados',
        icon: '⭐',
    },
];

const DEFAULT_CONFIDENTIALITY_TEXT =
    'O conteúdo deste documento destina-se exclusivamente à avaliação interna da organização destinatária. As informações aqui contidas são proprietárias e não devem ser compartilhadas com terceiros sem autorização prévia. Qualquer alteração nas premissas técnicas ou comerciais descritas implicará na necessidade de uma revisão formal das condições propostas.';

function createDefaultTexts(deal: Deal): EditableTexts {
    return {
        proposalTitle: `Proposta: ${deal.title}`,
        confidentialityText: DEFAULT_CONFIDENTIALITY_TEXT,
        differentials: [...DEFAULT_DIFFERENTIALS],
        priceStudyValidity: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toLocaleDateString('pt-BR'),
        generalNotes: '',
        customNotesTitle: 'Notas Adicionais',
        customNotesContent: '',
    };
}

// ── Smart Section Defaults ────────────────────────────────────────────
function createSmartSections(deal: Deal): SectionDef[] {
    const products = deal.deal_products || [];
    const hasSW = products.some(p => isSoftware(p) && p.is_visible_on_proposal !== false);
    const hasHW = products.some(p => (isHardware(p) || isSupport(p)) && p.is_visible_on_proposal !== false);

    // Dynamic labels based on product mix
    const hwLabel = hasSW && hasHW
        ? 'Infraestrutura & Hardware'
        : 'Especificação Técnica';
    const swLabel = hasSW && !hasHW
        ? 'Soluções & Licenciamento'
        : 'Software & Licenciamento';

    return [
        { id: 'cover', label: 'Capa', enabled: true },
        { id: 'confidentiality', label: 'Confidencialidade', enabled: true },
        { id: 'differentials', label: 'Diferenciais', enabled: true },
        { id: 'overview', label: 'Visão Geral do Projeto', enabled: true },
        { id: 'hardware', label: hwLabel, enabled: hasHW },
        { id: 'software', label: swLabel, enabled: hasSW },
        { id: 'custom_notes', label: 'Texto Livre', enabled: false },
        { id: 'investment', label: 'Estrutura de Investimento', enabled: true },
    ];
}

function getTemplatePresets(template: TemplateType): Partial<{ sections: Partial<Record<SectionId, boolean>>; config: Partial<EditorConfig> }> {
    switch (template) {
        case 'executivo':
            return {
                config: { includeAISummary: true },
            };
        case 'tecnico':
            return {
                config: { includeAISummary: true },
            };
        case 'detalhado':
            return {
                config: { includeAISummary: true },
            };
        case 'rapido':
            return {
                sections: {
                    confidentiality: false,
                    overview: false,
                    differentials: false,
                },
                config: { includeAISummary: false },
            };
        default:
            return {};
    }
}

// ── Reducer ───────────────────────────────────────────────────────────
function reducer(state: ProposalEditorState, action: EditorAction): ProposalEditorState {
    switch (action.type) {
        case 'TOGGLE_SECTION':
            return {
                ...state,
                sections: state.sections.map(s =>
                    s.id === action.id ? { ...s, enabled: !s.enabled } : s
                ),
            };

        case 'REORDER_SECTIONS':
            return { ...state, sections: action.sections };

        case 'UPDATE_TEXT':
            return {
                ...state,
                editableTexts: { ...state.editableTexts, [action.key]: action.value },
            };

        case 'UPDATE_DIFFERENTIAL':
            return {
                ...state,
                editableTexts: {
                    ...state.editableTexts,
                    differentials: state.editableTexts.differentials.map((d, i) =>
                        i === action.index ? { ...d, [action.field]: action.value } : d
                    ),
                },
            };

        case 'UPDATE_CONFIG':
            return {
                ...state,
                config: { ...state.config, ...action.updates },
            };

        case 'SET_TEMPLATE': {
            const presets = getTemplatePresets(action.template);
            let newSections = state.sections;

            if (presets.sections) {
                newSections = state.sections.map(s => ({
                    ...s,
                    enabled: presets.sections![s.id] ?? s.enabled,
                }));
            }

            return {
                ...state,
                config: { ...state.config, ...presets.config, template: action.template },
                sections: newSections,
            };
        }

        case 'SELECT_SECTION':
            return { ...state, selectedSectionId: action.id };

        case 'SET_AI_DATA':
            return { 
                ...state, 
                aiSummary: action.data.summary ?? state.aiSummary,
                objectives: action.data.objectives ?? state.objectives,
                simplifiedProductNames: action.data.simplifiedProductNames ?? state.simplifiedProductNames
            };

        case 'SET_AI_SUMMARY':
            return { ...state, aiSummary: action.summary };

        case 'SET_SOFTWARE_HIGHLIGHTS':
            return { ...state, softwareHighlights: action.highlights };

        case 'SET_BENEFIT_TILES':
            return { ...state, benefitTiles: action.tiles };

        case 'SET_GENERATING':
            return { ...state, isGenerating: action.value };

        case 'SET_ACTIVE_SECTIONS':
            return {
                ...state,
                sections: state.sections.map(s => ({
                    ...s,
                    enabled: action.sections.includes(s.id)
                }))
            };

        case 'UPDATE_BILLING_OVERRIDE':
            return {
                ...state,
                config: {
                    ...state.config,
                    billingOverrides: {
                        ...state.config.billingOverrides,
                        [action.distributorId]: {
                            ...(state.config.billingOverrides[action.distributorId] || { selectedCnpj: '', selectedBranchName: '', paymentTerms: '' }),
                            ...action.override,
                        },
                    },
                },
            };

        case 'INIT_BILLING_OVERRIDES':
            return {
                ...state,
                config: {
                    ...state.config,
                    billingOverrides: { ...action.overrides, ...state.config.billingOverrides },
                },
            };

        case 'RESET':
            return createInitialState(action.deal);

        default:
            return state;
    }
}

// ── Initial State Factory ─────────────────────────────────────────────
function createInitialState(deal: Deal): ProposalEditorState {
    const smartSections = createSmartSections(deal);
    const firstEnabled = smartSections.find(s => s.enabled);
    return {
        sections: smartSections,
        editableTexts: createDefaultTexts(deal),
        config: {
            template: 'executivo',
            showBillingInfo: true,
            isPriceStudy: false,
            allowSignature: false,
            includeAISummary: true,
            quoteDisplayMode: 'consolidated',
            billingOverrides: {},
        },
        selectedSectionId: firstEnabled?.id || null,
        aiSummary: '',
        objectives: [],
        simplifiedProductNames: {},
        softwareHighlights: [],
        benefitTiles: [],
        isGenerating: false,
    };
}

// ── Hook ──────────────────────────────────────────────────────────────
export function useProposalEditorState(deal: Deal, initialData?: any) {
    const initFn = useCallback((d: Deal) => {
        const defaultState = createInitialState(d);
        if (!initialData) return defaultState;

        const merged = { ...defaultState };
        if (initialData.editableTexts) {
            merged.editableTexts = { ...defaultState.editableTexts, ...initialData.editableTexts };
        }
        if (initialData.config) {
            merged.config = { ...defaultState.config, ...initialData.config };
        }
        if (initialData.aiSummary) {
            merged.aiSummary = initialData.aiSummary;
        }
        if (initialData.objectives) {
            merged.objectives = initialData.objectives;
        }
        if (initialData.simplifiedProductNames) {
            merged.simplifiedProductNames = initialData.simplifiedProductNames;
        }
        if (initialData.softwareHighlights && Array.isArray(initialData.softwareHighlights)) {
            merged.softwareHighlights = initialData.softwareHighlights;
        }
        if (initialData.benefitTiles && Array.isArray(initialData.benefitTiles)) {
            merged.benefitTiles = initialData.benefitTiles;
        }
        if (initialData.activeSections && Array.isArray(initialData.activeSections)) {
            const activeSet = new Set(initialData.activeSections);
            // MERGE: Keep our smart labels, only overwrite the toggled state from DB
            merged.sections = defaultState.sections.map(s => ({
                ...s,
                enabled: activeSet.has(s.id)
            }));

            // Preserve the order from the DB
            const newOrder = [...merged.sections].sort((a, b) => {
                const aIndex = initialData.activeSections.indexOf(a.id);
                const bIndex = initialData.activeSections.indexOf(b.id);
                if (aIndex === -1 && bIndex === -1) return 0;
                if (aIndex === -1) return 1;
                if (bIndex === -1) return -1;
                return aIndex - bIndex;
            });
            merged.sections = newOrder;
        }

        return merged;
    }, [initialData]);

    const [state, dispatch] = useReducer(reducer, deal, initFn);

    const activeSections = useMemo(
        () => state.sections.filter(s => s.enabled),
        [state.sections]
    );

    const totalValue = useMemo(() => {
        const products = deal.deal_products || [];
        return products
            .filter(p => !p.is_optional)
            .reduce((acc, p) => acc + (p.unit_price || 0) * (p.quantity || 1), 0);
    }, [deal.deal_products]);

    const toggleSection = useCallback((id: SectionId) => dispatch({ type: 'TOGGLE_SECTION', id }), []);
    const updateText = useCallback((key: keyof EditableTexts, value: any) => dispatch({ type: 'UPDATE_TEXT', key, value }), []);
    const updateDifferential = useCallback((index: number, field: 'title' | 'description' | 'icon', value: string) => dispatch({ type: 'UPDATE_DIFFERENTIAL', index, field, value }), []);
    const updateConfig = useCallback((updates: Partial<EditorConfig>) => dispatch({ type: 'UPDATE_CONFIG', updates }), []);
    const setTemplate = useCallback((template: TemplateType) => dispatch({ type: 'SET_TEMPLATE', template }), []);
    const selectSection = useCallback((id: SectionId | null) => dispatch({ type: 'SELECT_SECTION', id }), []);
    const setAiData = useCallback((data: { summary?: string; objectives?: any[]; simplifiedProductNames?: Record<string, string> }) => dispatch({ type: 'SET_AI_DATA', data }), []);
    const setAiSummary = useCallback((summary: string) => dispatch({ type: 'SET_AI_SUMMARY', summary }), []);
    const setSoftwareHighlights = useCallback((highlights: Array<{ title: string; value: string }>) => dispatch({ type: 'SET_SOFTWARE_HIGHLIGHTS', highlights }), []);
    const setBenefitTiles = useCallback((tiles: Array<{ value: string; label: string }>) => dispatch({ type: 'SET_BENEFIT_TILES', tiles }), []);
    const setGenerating = useCallback((value: boolean) => dispatch({ type: 'SET_GENERATING', value }), []);
    const updateBillingOverride = useCallback((distributorId: string, override: Partial<BillingOverride>) => dispatch({ type: 'UPDATE_BILLING_OVERRIDE', distributorId, override }), []);
    const initBillingOverrides = useCallback((overrides: Record<string, BillingOverride>) => dispatch({ type: 'INIT_BILLING_OVERRIDES', overrides }), []);
    const reset = useCallback(() => dispatch({ type: 'RESET', deal }), [deal]);

    const autoOptimize = useCallback(() => {
        const products = deal.deal_products || [];
        const hasSW = products.some(isSoftware);
        const hasHW = products.some(p => isHardware(p) || isSupport(p));

        let template: TemplateType = 'executivo';
        if (hasHW && !hasSW) template = 'tecnico';
        if (hasSW && !hasHW) template = 'detalhado';

        const active: SectionId[] = ['cover', 'overview', 'investment', 'confidentiality'];
        if (hasHW) active.push('hardware');
        if (hasSW) active.push('software');
        if (totalValue > 50000 || products.length > 5) active.push('differentials');
        
        // Preserve custom_notes if user had it enabled
        if (state.sections.find(s => s.id === 'custom_notes')?.enabled) {
            active.push('custom_notes');
        }

        dispatch({ 
            type: 'UPDATE_CONFIG', 
            updates: { template, includeAISummary: true } 
        });
        dispatch({ type: 'SET_ACTIVE_SECTIONS', sections: active });
    }, [deal, totalValue]);

    return {
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
        setAiData,
        setAiSummary,
        setSoftwareHighlights,
        setBenefitTiles,
        setGenerating,
        updateBillingOverride,
        initBillingOverrides,
        reset,
        autoOptimize,
    };
}
