import { useState, useCallback } from 'react';

export type TemplateType = 'executivo' | 'tecnico' | 'detalhado' | 'rapido';

export interface ProposalConfig {
    template: TemplateType;
    includeAISummary: boolean;
    includeProductDetails: boolean;
    includeTechnicalSpecs: boolean;
    includeROIAnalysis: boolean;
    includeCover: boolean;
    includeConfidentiality: boolean;
    includeInvestment: boolean;
    includeOverview: boolean;
    includeHardware: boolean;
    includeSoftware: boolean;
    includeDifferentials: boolean;
    showBillingInfo: boolean;
    isPriceStudy?: boolean;
    allowSignature?: boolean;
    clientLogo?: string;
    customTitle?: string;
}

const DEFAULT_CONFIG: ProposalConfig = {
    template: 'executivo',
    includeAISummary: true,
    includeProductDetails: true,
    includeTechnicalSpecs: false,
    includeROIAnalysis: true,
    includeCover: true,
    includeConfidentiality: true,
    includeInvestment: true,
    includeOverview: true,
    includeHardware: true,
    includeSoftware: true,
    includeDifferentials: true,
    showBillingInfo: true,
    isPriceStudy: false,
    allowSignature: false,
    customTitle: '',
};

export const getTemplateConfig = (t: TemplateType) => {
    switch (t) {
        case 'executivo':
            return {
                includeAISummary: true,
                includeProductDetails: false,
                includeTechnicalSpecs: false,
                includeROIAnalysis: true,
            };
        case 'tecnico':
            return {
                includeAISummary: true,
                includeProductDetails: true,
                includeTechnicalSpecs: true,
                includeROIAnalysis: false,
            };
        case 'detalhado':
            return {
                includeAISummary: true,
                includeProductDetails: true,
                includeTechnicalSpecs: true,
                includeROIAnalysis: true,
            };
        case 'rapido':
            return {
                includeAISummary: false,
                includeProductDetails: false,
                includeTechnicalSpecs: false,
                includeROIAnalysis: false,
            };
        default:
            return {};
    }
};

export const useProposalIntelligence = () => {
    const [currentStep, setCurrentStep] = useState(1);
    const [selectedTemplate, setSelectedTemplate] = useState<TemplateType>('executivo');
    const [config, setConfig] = useState<ProposalConfig>(DEFAULT_CONFIG);

    const goToNextStep = () => {
        if (currentStep < 3) {
            setCurrentStep(currentStep + 1);
        }
    };

    const goToPreviousStep = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const selectTemplate = useCallback((template: TemplateType) => {
        setSelectedTemplate(template);

        setConfig(prev => ({
            ...prev,
            ...getTemplateConfig(template),
            template
        }));
    }, []);

    const updateConfig = useCallback((updates: Partial<ProposalConfig>) => {
        setConfig(prev => ({ ...prev, ...updates }));
    }, []);

    const reset = useCallback(() => {
        setCurrentStep(1);
        setSelectedTemplate('executivo');
        setConfig(DEFAULT_CONFIG);
    }, []);

    const autoConfigure = useCallback((dealTitle: string, products: any[] = [], dealValue: number = 0) => {
        let template: TemplateType = 'executivo';
        const hasHardware = products.some(p => 
            p.category?.toLowerCase() === 'hardware' || 
            p.name?.toLowerCase().includes('server') || 
            p.name?.toLowerCase().includes('storage')
        );
        const hasSoftware = products.some(p => 
            p.category?.toLowerCase() === 'software' || 
            p.name?.toLowerCase().includes('licença') || 
            p.name?.toLowerCase().includes('ibm')
        );
        const hasIBM = products.some(p => 
            p.brand?.toLowerCase() === 'ibm' || 
            p.name?.toLowerCase().includes('ibm') ||
            p.sku?.startsWith('9846') // Common IBM prefix patterns
        );

        // 1. Template Selection
        if (hasIBM) template = 'executivo'; // Current best for IBM
        else if (dealValue < 10000) template = 'rapido';
        else if (hasHardware && hasSoftware) template = 'detalhado';

        // 2. Section Toggles
        const updates: Partial<ProposalConfig> = {
            template,
            includeHardware: hasHardware,
            includeSoftware: hasSoftware,
            includeROIAnalysis: dealValue > 50000,
            includeDifferentials: true,
            includeOverview: true
        };

        // 3. Smart Title
        if (dealTitle) {
            if (hasIBM && hasHardware) {
                updates.customTitle = `Solução de Infraestrutura IBM: ${dealTitle}`;
            } else if (hasSoftware && !hasHardware) {
                updates.customTitle = `Licenciamento e Subscrição: ${dealTitle}`;
            }
        }

        setConfig(prev => ({
            ...prev,
            ...updates,
            ...getTemplateConfig(template)
        }));
        setSelectedTemplate(template);
    }, []);

    const canProceed = () => {
        switch (currentStep) {
            case 1:
                return selectedTemplate !== null;
            case 2:
                return true; // Always can proceed from config
            case 3:
                return true;
            default:
                return false;
        }
    };

    return {
        currentStep,
        selectedTemplate,
        config,
        goToNextStep,
        goToPreviousStep,
        selectTemplate,
        updateConfig,
        reset,
        autoConfigure,
        canProceed,
    };
};
