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

        // Auto-configure based on template but preserve customTitle
        const getTemplateConfig = (t: TemplateType) => {
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
        canProceed,
    };
};
