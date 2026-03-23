import { useState, useEffect, useMemo } from 'react';
import { getDealsForReports } from '@/app/(dashboard)/reports/actions';
import {
    calculateDealMetrics,
    calculateConversionFunnel,
    calculateSalesPerformance,
    calculateProductMetrics,
    calculateRevenueForecast,
    calculateLossReasonMetrics,
} from '@/utils/analytics';

export type ReportPeriod = '7d' | '30d' | '90d' | 'all';

export const useReports = () => {
    const [deals, setDeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [sellerFilter, setSellerFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');
    const [billingFilter, setBillingFilter] = useState('all');
    const [sourceFilter, setSourceFilter] = useState('all');
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedQuarters, setSelectedQuarters] = useState<string[]>([]); // 'YYYY-QX'

    useEffect(() => {
        const fetchDeals = async () => {
            try {
                setLoading(true);
                const data = await getDealsForReports();
                setDeals(data);
            } catch (err: any) {
                console.error(err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchDeals();
    }, []);

    const filteredDeals = useMemo(() => {
        return deals.filter(d => {
            const stageNames: Record<string, string> = {
                'qualification': 'Qualificação',
                'proposal': 'Proposta',
                'negotiation': 'Negociação',
                'won': 'Fechado Ganho',
                'lost': 'Fechado Perdido'
            };

            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = searchTerm === '' || 
                d.title?.toLowerCase().includes(searchLower) ||
                d.company?.toLowerCase().includes(searchLower) ||
                d.owner?.toLowerCase().includes(searchLower) ||
                (stageNames[d.stage] || d.stage)?.toLowerCase().includes(searchLower) ||
                d.loss_reason?.toLowerCase().includes(searchLower) ||
                (d.products || []).some((p: any) => p.name?.toLowerCase().includes(searchLower));
            
            // Filters
            const matchesSeller = sellerFilter === 'all' || d.owner === sellerFilter;
            const matchesStatus = statusFilter === 'all' || d.stage === statusFilter;
            const matchesBilling = billingFilter === 'all' || d.billing_type === billingFilter;
            const matchesSource = sourceFilter === 'all' || d.lead_source === sourceFilter;

            // Date/Quarter filter
            let matchesTime = true;
            if (selectedQuarters.length > 0) {
                const dateToUse = d.stage === 'won' ? (d.won_at || d.created_at) : 
                                 d.stage === 'lost' ? (d.lost_at || d.created_at) : 
                                 d.created_at;
                
                const date = new Date(dateToUse);
                const year = date.getUTCFullYear();
                const month = date.getUTCMonth();
                const quarter = Math.floor(month / 3) + 1;
                matchesTime = selectedQuarters.includes(`${year}-Q${quarter}`);
            }

            return matchesSearch && matchesSeller && matchesStatus && matchesBilling && matchesSource && matchesTime;
        });
    }, [deals, searchTerm, sellerFilter, statusFilter, billingFilter, sourceFilter, selectedQuarters]);

    const mappedDeals = useMemo(() => {
        return filteredDeals.map(d => ({
            ...d,
            value: Number(d.value || 0),
            probability: Number(d.probability || 0),
            products: (d.products || []).map((p: any) => ({
                id: p.id,
                name: p.name,
                quantity: Number(p.quantity || 0),
                unitPrice: Number(p.unitPrice || p.unit_price || 0)
            }))
        }));
    }, [filteredDeals]);

    const stats = useMemo(() => {
        if (loading) return null;

        return {
            dealMetrics: calculateDealMetrics(mappedDeals),
            funnelData: calculateConversionFunnel(mappedDeals),
            salesPerformance: calculateSalesPerformance(mappedDeals),
            productMetrics: calculateProductMetrics(mappedDeals),
            revenueForecast: calculateRevenueForecast(mappedDeals),
            lossReasons: calculateLossReasonMetrics(mappedDeals)
        };
    }, [mappedDeals, loading]);

    const allSellers = useMemo(() => Array.from(new Set(deals.map(d => d.owner))).sort(), [deals]);
    const allBillingTypes = useMemo(() => Array.from(new Set(deals.map((d: any) => d.billing_type).filter(Boolean))).sort(), [deals]);
    const allSources = useMemo(() => Array.from(new Set(deals.map((d: any) => d.lead_source).filter(Boolean))).sort(), [deals]);

    return {
        stats,
        mappedDeals,
        searchTerm,
        setSearchTerm,
        sellerFilter,
        setSellerFilter,
        statusFilter,
        setStatusFilter,
        billingFilter,
        setBillingFilter,
        sourceFilter,
        setSourceFilter,
        selectedYear,
        setSelectedYear,
        selectedQuarters,
        setSelectedQuarters,
        allSellers,
        allBillingTypes,
        allSources,
        loading,
        error
    };
};
