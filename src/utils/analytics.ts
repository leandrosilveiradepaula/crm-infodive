export interface DealMetrics {
    totalValue: number;
    weightedValue: number;
    pipelineValue: number;
    count: number;
    avgDealSize: number;
    conversionRate: number;
    avgCycleTime: number;
}

export interface SalesPerformance {
    seller: string;
    dealsWon: number;
    dealsLost: number;
    totalRevenue: number;
    conversionRate: number;
    avgDealSize: number;
    avgCycleTime: number;
}

export interface ConversionFunnelData {
    stage: string;
    stageCode?: string;
    count: number;
    value: number;
    conversionRate: number;
}

export interface ProductMetrics {
    productId: string;
    productName: string;
    quantitySold: number;
    revenue: number;
    avgPrice: number;
}

// Funções de cálculo de métricas
export const calculateDealMetrics = (deals: any[]): DealMetrics => {
    const openDeals = deals.filter(d => !['won', 'lost'].includes(d.stage));
    const closedWonDeals = deals.filter(d => d.stage === 'won');

    // Em relatórios, "Total de Vendas" deve ser o que foi GANHO (Receita Real)
    const totalRevenue = closedWonDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const pipelineValue = openDeals.reduce((sum, d) => sum + (d.value || 0), 0);
    const weightedValue = openDeals.reduce((sum, d) => sum + ((d.value || 0) * (d.probability || 0) / 100), 0);

    const avgDealSize = closedWonDeals.length > 0
        ? totalRevenue / closedWonDeals.length
        : 0;

    const lostDeals = deals.filter(d => d.stage === 'lost');
    const closedDeals = closedWonDeals.length + lostDeals.length;
    
    const conversionRate = closedDeals > 0
        ? (closedWonDeals.length / closedDeals) * 100
        : 0;

    // Calcular tempo médio de ciclo real (em dias)
    let totalCycleTime = 0;
    let countedDeals = 0;

    closedWonDeals.forEach(d => {
        if (d.won_at && d.created_at) {
            const start = new Date(d.created_at).getTime();
            const end = new Date(d.won_at).getTime();
            const diffDays = (end - start) / (1000 * 60 * 60 * 24);
            if (diffDays >= 0) {
                totalCycleTime += diffDays;
                countedDeals++;
            }
        }
    });

    const avgCycleTime = countedDeals > 0 ? totalCycleTime / countedDeals : 0;

    return {
        totalValue: totalRevenue, // Agora reflete o que foi GANHO
        weightedValue,
        pipelineValue,
        count: closedWonDeals.length, // Agora conta quantos fecharam
        avgDealSize,
        conversionRate,
        avgCycleTime
    };
};

export const calculateConversionFunnel = (deals: any[]): ConversionFunnelData[] => {
    const stages = ['qualification', 'proposal', 'negotiation', 'won'];
    const stageNames: Record<string, string> = {
        'qualification': 'Qualificação',
        'proposal': 'Proposta',
        'negotiation': 'Negociação',
        'won': 'Fechado Ganho'
    };

    const funnelData: ConversionFunnelData[] = [];
    let previousCount = 0;

    stages.forEach((stage, index) => {
        const stageWeight = stages.indexOf(stage);

        const stageDeals = deals.filter(d => {
            const currentStageWeight = stages.indexOf(d.stage);
            return currentStageWeight >= stageWeight;
        });

        const count = stageDeals.length;
        const value = stageDeals.reduce((sum, d) => sum + (d.value || 0), 0);
        const conversionRate = index > 0 && previousCount > 0
            ? (count / previousCount) * 100
            : 100;

        funnelData.push({
            stage: stageNames[stage] || stage,
            stageCode: stage,
            count,
            value,
            conversionRate
        });

        previousCount = count;
    });

    return funnelData;
};

export const calculateLossReasonMetrics = (deals: any[]) => {
    const lostDeals = deals.filter(d => d.stage === 'lost' && d.loss_reason);
    const reasonMap = new Map<string, number>();

    lostDeals.forEach(d => {
        const reason = d.loss_reason || 'Não especificado';
        reasonMap.set(reason, (reasonMap.get(reason) || 0) + 1);
    });

    return Array.from(reasonMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);
};

export const calculateSalesPerformance = (deals: any[]): SalesPerformance[] => {
    const sellers = Array.from(new Set(deals.map(d => d.owner)));

    return sellers.map(seller => {
        const sellerDeals = deals.filter(d => d.owner === seller);
        const wonDeals = sellerDeals.filter(d => d.stage === 'won');
        const lostDeals = sellerDeals.filter(d => d.stage === 'lost');

        const totalRevenue = wonDeals.reduce((sum, d) => sum + d.value, 0);
        const avgDealSize = wonDeals.length > 0
            ? totalRevenue / wonDeals.length
            : 0;

        const closedDeals = wonDeals.length + lostDeals.length;
        const conversionRate = closedDeals > 0
            ? (wonDeals.length / closedDeals) * 100
            : 0;

        return {
            seller,
            dealsWon: wonDeals.length,
            dealsLost: lostDeals.length,
            totalRevenue,
            conversionRate,
            avgDealSize,
            avgCycleTime: 0 // Simplificado
        };
    }).sort((a, b) => b.totalRevenue - a.totalRevenue);
};

export const calculateProductMetrics = (deals: any[]): ProductMetrics[] => {
    const productMap = new Map<string, { name: string; quantity: number; revenue: number }>();
    const wonDeals = deals.filter(d => d.stage === 'won');

    wonDeals.forEach(deal => {
        if (deal.products && deal.products.length > 0) {
            deal.products.forEach((product: any) => {
                const existing = productMap.get(product.id) || {
                    name: product.name,
                    quantity: 0,
                    revenue: 0
                };

                existing.quantity += product.quantity;
                existing.revenue += product.quantity * product.unitPrice;

                productMap.set(product.id, existing);
            });
        }
    });

    return Array.from(productMap.entries())
        .map(([id, data]) => ({
            productId: id,
            productName: data.name,
            quantitySold: data.quantity,
            revenue: data.revenue,
            avgPrice: data.quantity > 0 ? data.revenue / data.quantity : 0
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5); // Top 5
};

export const calculateRevenueForecast = (deals: any[], months: number = 3): number[] => {
    const currentMonthRevenue = deals
        .filter(d => d.stage === 'won')
        .reduce((sum, d) => sum + d.value, 0);

    const pipelineValue = deals
        .filter(d => !['won', 'lost'].includes(d.stage))
        .reduce((sum, d) => sum + (d.value * d.probability / 100), 0);

    const forecast: number[] = [];
    const growthRate = 1.1; // 10% de crescimento

    for (let i = 0; i < months; i++) {
        const projected = (currentMonthRevenue + pipelineValue * 0.3) * Math.pow(growthRate, i);
        forecast.push(projected);
    }

    return forecast;
};

export const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
    }).format(value);
};

export const formatCompact = (value: number): string => {
    return new Intl.NumberFormat('pt-BR', {
        notation: 'compact',
        style: 'currency',
        currency: 'BRL',
        minimumFractionDigits: 0,
        maximumFractionDigits: 1
    }).format(value);
};

export const formatPercentage = (value: number): string => {
    if (isNaN(value)) return '0.0%';
    return `${value.toFixed(1)}%`;
};

export const calculateGrowthRate = (current: number, previous: number): number => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
};
