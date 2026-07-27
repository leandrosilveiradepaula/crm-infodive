import type { Deal, DealProduct } from '@/types/deal';

import type { Account } from '@/types/account';

import { isSoftware, isService, isSupport, isHardware, getClassificationLabel } from '@/utils/productClassification';

import { getSmartProductDescription } from '@/utils/formatProductDescription';

import { sortProductsHierarchically } from '@/utils/productSorting';



export interface ExportProposalData {

    proposal: any;

    deal?: Deal;

    distributors?: Account[];

    sellerName?: string;

    clientLogo?: string;

}



export interface ExportProduct {

    id: string;

    name: string;

    displayName: string;

    sku: string;

    description: string;

    quantity: number;

    unitPrice: number;

    unitPriceUSD: number;

    totalPrice: number;

    totalPriceUSD: number;

    category: string;

    categoryLabel: string;

    pricingModel: 'one_time' | 'monthly' | 'annual';

    billingType: 'direct' | 'indirect';

    distributorId: string;

    distributorName: string;

    distributorCnpj: string;

    isOptional: boolean;

    parentId: string | null;

    duration: number | null;

    durationUnit: string | null;

    isPresentInUSD: boolean;

    exchangeRate: number;

    techDetails: any[];

    showSkuOnProposal: boolean;

    displayOrder: number;

}



export interface ExportBillingGroup {

    id: string; // distributor_id or 'infodive'

    type: 'reseller' | 'direct';

    title: string; // 'Faturamento Direto' or 'Faturamento Revenda'

    companyName: string; // branch name, distributor name, or reseller name

    cnpj: string;

    paymentTerms: string;

    products: ExportProduct[];

}



export interface ExportOptionBlock {

    id: string;

    label: string; // 'Opção A', 'Opção B'

    displayName: string; // quote title or root product display name

    products: ExportProduct[];

    totalBRL: number;

    totalUSD: number;

}



export interface UnifiedExportData {

    proposalId: string;

    title: string;

    companyName: string;

    proposalNumber: string;

    date: string;

    sellerName: string;

    clientLogo: string | null;

    themePrimary: string;

    themeAccent: string;

    aiSummary?: string;

    objectives?: Array<{ number: string; title: string; description: string; }>;

    customNotesTitle?: string;

    customNotesContent?: string;

    confidentialityText?: string;

    differentials?: Array<{ title: string; description: string; icon: string }>;

    softwareHighlights?: Array<{ title: string; value: string }>;

    benefitTiles?: Array<{ value: string; label: string }>;

    layout: 'portrait' | 'landscape';

    

    // Active sections helper

    activeSections: string[];

    isSectionActive: (id: string) => boolean;



    // All products (sorted hierarchically)

    allProducts: ExportProduct[];

    mainProducts: ExportProduct[];

    optionalProducts: ExportProduct[];



    // Grouping / display modes

    quoteDisplayMode: 'consolidated' | 'options';

    isMultiQuoteOptions: boolean;

    isSingleQuoteOptions: boolean;

    optionBlocks: ExportOptionBlock[];



    // Financial summaries

    totalBRL: number;

    totalUSD: number;

    

    // Billing

    showBillingInfo: boolean;

    billingGroups: ExportBillingGroup[];



    // Price Study

    isPriceStudy: boolean;

    priceStudyValidity: string;

}



export function mapProposalToExportData(

    proposal: any,

    deal?: Deal,

    distributors: Account[] = [],

    sellerName?: string,

    clientLogo?: string

): UnifiedExportData {

    const content = proposal.content || {};

    const config = content.config || {};

    const editableTexts = content.editableTexts || {};

    const activeSections = content.activeSections || [];

    const simplifiedProductNames = content.simplifiedProductNames || {};



    const primaryColor = config.themePrimary || '#1e3a5f';

    const accentColor = config.themeAccent || '#E31837';



    // 1. Get raw products from proposal or deal

    const rawProducts: DealProduct[] = proposal.products_json || (deal && deal.deal_products) || [];

    const sortedRawProducts = sortProductsHierarchically(rawProducts);



    // 2. Map raw products to ExportProduct

    const allMappedProducts: ExportProduct[] = sortedRawProducts.map((p) => {

        const qty = p.quantity || 1;

        const isPresentInUSD = !!p.present_in_usd;

        const exchangeRate = p.exchange_rate || 1;

        const unitBRL = p.unit_price || 0;

        

        // Calculate unit and total values in USD and BRL

        const unitPrice = unitBRL;

        const unitPriceUSD = isPresentInUSD ? (unitBRL / exchangeRate) : 0;

        const totalPrice = unitBRL * qty;

        const totalPriceUSD = unitPriceUSD * qty;



        const displayName = simplifiedProductNames[p.name] || p.display_name || p.name || 'Item';



        // Parse technical details JSON safely

        let techDetails: any[] = [];

        const sourceDetails = p.description || p.tech_details;

        if (sourceDetails) {

            try {

                techDetails = typeof sourceDetails === 'string' ? JSON.parse(sourceDetails) : sourceDetails;

            } catch {

                techDetails = String(sourceDetails)

                    .split('\n')

                    .filter((l) => l.trim().length > 0)

                    .map((l, i) => ({ description: l, quantity: 1, is_visible_on_proposal: true, id: String(i) }));

            }

        }



        return {

            id: p.id,

            name: p.name,

            displayName,

            sku: p.sku || '',

            description: p.description || '',

            quantity: qty,

            unitPrice,

            unitPriceUSD,

            totalPrice,

            totalPriceUSD,

            category: p.category || '',

            categoryLabel: getClassificationLabel(p),

            pricingModel: p.pricing_model || 'one_time',

            billingType: p.billing_type || 'direct',

            distributorId: p.distributor_id || '',

            distributorName: p.distributor_name || '',

            distributorCnpj: p.distributor_cnpj || '',

            isOptional: !!p.is_optional,

            parentId: p.parent_id || null,

            duration: p.duration || null,

            durationUnit: p.duration_unit || null,

            isPresentInUSD,

            exchangeRate,

            techDetails,

            showSkuOnProposal: p.show_sku_on_proposal !== false,

            displayOrder: p.display_order || 0,

        };

    });



    const mainProducts = allMappedProducts.filter((p) => !p.isOptional);

    const optionalProducts = allMappedProducts.filter((p) => p.isOptional);



    // 3. Totals

    const totalBRL = mainProducts.reduce((sum, p) => p.isPresentInUSD ? sum : sum + p.totalPrice, 0);

    const totalUSD = mainProducts.reduce((sum, p) => p.isPresentInUSD ? sum + p.totalPriceUSD : sum, 0);



    // 4. Quote displays & Option blocks

    const quotes = (deal && deal.deal_quotes) || proposal.deal_quotes || [];

    const quoteDisplayMode = config.quoteDisplayMode || 'consolidated';

    const isMultiQuoteOptions = quoteDisplayMode === 'options' && quotes.length > 1;

    const isSingleQuoteOptions = quoteDisplayMode === 'options' && quotes.length <= 1;



    const optionBlocks: ExportOptionBlock[] = [];

    if (isMultiQuoteOptions) {

        quotes

            .filter((q: any) => mainProducts.some((p) => p.distributorId === q.id || (p as any).quote_id === q.id))

            .forEach((quote: any, qIdx: number) => {

                const prods = mainProducts.filter((p: any) => (p as any).quote_id === quote.id || p.distributorId === quote.id);

                optionBlocks.push({

                    id: quote.id,

                    label: `Opção ${String.fromCharCode(65 + qIdx)}`,

                    displayName: quote.title,

                    products: prods,

                    totalBRL: prods.reduce((sum, p) => p.isPresentInUSD ? sum : sum + p.totalPrice, 0),

                    totalUSD: prods.reduce((sum, p) => p.isPresentInUSD ? sum + p.totalPriceUSD : sum, 0),

                });

            });

    } else if (isSingleQuoteOptions) {

        const rootProducts = mainProducts.filter((p) => !p.parentId);

        rootProducts.forEach((rootProduct, pIdx) => {

            const children = mainProducts.filter((p) => p.parentId === rootProduct.id);

            const prods = [rootProduct, ...children];

            optionBlocks.push({

                id: rootProduct.id,

                label: `Opção ${String.fromCharCode(65 + pIdx)}`,

                displayName: rootProduct.displayName,

                products: prods,

                totalBRL: prods.reduce((sum, p) => p.isPresentInUSD ? sum : sum + p.totalPrice, 0),

                totalUSD: prods.reduce((sum, p) => p.isPresentInUSD ? sum + p.totalPriceUSD : sum, 0),

            });

        });

    }



    // 4.1 Consolidated fallback -- if no option blocks were built, create one with all mainProducts

    if (optionBlocks.length === 0 && mainProducts.length > 0) {

        optionBlocks.push({

            id: 'consolidated',

            label: 'Consolidado',

            displayName: 'TOTAL CONSOLIDADO',

            products: mainProducts,

            totalBRL,

            totalUSD,

        });

    }



    



    // 5. Billing groups

    const billingGroups: ExportBillingGroup[] = [];

    const showBillingInfo = config.showBillingInfo !== false;



    if (showBillingInfo) {

        const billingOverrides = config.billingOverrides || {};



        // 5.1 Reseller billing group

        const resellerProds = mainProducts.filter((p) => p.billingType === 'direct' || !p.billingType);

        if (resellerProds.length > 0) {

            const override = billingOverrides['infodive'] || {};

            const cnpjOverride = override.selectedCnpj || resellerProds.find((p) => p.distributorCnpj && p.distributorCnpj.length > 5)?.distributorCnpj;

            const termsOverride = override.paymentTerms || 'Até 10 dias, após a conclusão do serviço';



            billingGroups.push({

                id: 'infodive',

                type: 'reseller',

                title: 'Faturamento Revenda (Infodive)',

                companyName: override.selectedBranchName || 'Infodive Representações e Serviços Ltda',

                cnpj: cnpjOverride || '05.613.186/0001-78',

                paymentTerms: termsOverride,

                products: resellerProds,

            });

        }



        // 5.2 Direct billing groups

        const directProds = mainProducts.filter((p) => p.billingType === 'indirect');

        const directKeys = Array.from(new Set(directProds.map((p) => `${p.distributorId}|${p.distributorCnpj}`)));



        directKeys.forEach((key) => {

            const [dId, dCnpj] = key.split('|');

            const prodsInGroup = directProds.filter(

                (p) => p.distributorId === dId && p.distributorCnpj === dCnpj

            );



            if (prodsInGroup.length === 0) return;



            const dist = dId ? distributors.find((d) => d.id === dId) : undefined;

            const override = dist ? billingOverrides[dist.id] : undefined;



            const finalCnpj = dCnpj && dCnpj !== 'undefined' && dCnpj !== 'null' ? dCnpj : override?.selectedCnpj || dist?.cnpj || '';

            const branch = dist?.branches?.find((b: any) => b.cnpj === finalCnpj);

            

            const companyName = branch?.name || override?.selectedBranchName || dist?.name || 'Distribuidor';

            const paymentTerms = override?.paymentTerms || branch?.payment_terms || dist?.payment_terms || '';



            billingGroups.push({

                id: dId,

                type: 'direct',

                title: `Faturamento Direto (${dist?.name || 'Distribuidor'})`,

                companyName,

                cnpj: finalCnpj,

                paymentTerms,

                products: prodsInGroup,

            });

        });

    }



    // 6. Section active helper

    const isSectionActive = (id: string) => {

        if (activeSections.length > 0) return activeSections.includes(id);

        if (id === 'cover') return config.includeCover !== false;

        if (id === 'confidentiality') return config.includeConfidentiality;

        if (id === 'differentials') return config.includeDifferentials;

        if (id === 'overview') return config.includeOverview !== false;

        if (id === 'hardware') return config.includeHardware !== false;

        if (id === 'software') return config.includeSoftware !== false;

        if (id === 'investment') return config.includeInvestment !== false;

        if (id === 'custom_notes') return !!editableTexts.customNotesContent;

        return false;

    };



    return {

        proposalId: proposal.id || 'draft',

        title: proposal.title || (deal && deal.title) || 'Proposta de Solução',

        companyName: proposal.company_name || (deal && deal.company) || '',

        proposalNumber: proposal.number || '',

        date: new Date().toLocaleDateString('pt-BR'),

        sellerName: sellerName || '',

        clientLogo: clientLogo || config.clientLogo || null,

        themePrimary: primaryColor,

        themeAccent: accentColor,

        aiSummary: content.aiSummary || '',

        objectives: content.objectives || [],

        softwareHighlights: content.softwareHighlights || [],

        benefitTiles: content.benefitTiles || [],

        customNotesTitle: editableTexts.customNotesTitle || 'Notas Adicionais',

        customNotesContent: editableTexts.customNotesContent || '',

        confidentialityText: editableTexts.confidentialityText || '',

        layout: config.layout || 'portrait',

        differentials: editableTexts.differentials || [],

        activeSections,

        isSectionActive,

        allProducts: allMappedProducts,

        mainProducts,

        optionalProducts,

        quoteDisplayMode,

        isMultiQuoteOptions,

        isSingleQuoteOptions,

        optionBlocks,

        totalBRL,

        totalUSD,

        showBillingInfo,

        billingGroups,

        isPriceStudy: !!config.isPriceStudy,

        priceStudyValidity: editableTexts.priceStudyValidity || '',

    };

}

