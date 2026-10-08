import { createAdminClient } from '../lib/supabase/admin';
import { calculateDealMetrics, calculateSalesPerformance, calculateRevenueForecast } from '../utils/analytics';

export class DashboardService {
    static async getDashboardMetrics(userId: string, organizationId: string) {
        const supabase = createAdminClient();

        // 1. Fetch Deals – explicit org filter (admin client bypasses RLS)
        const { data: deals, error } = await supabase
            .from('deals')
            .select('*')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('[DashboardService] dashboard metrics fetch failed');
            return {
                totalPipeline: 0,
                weightedForecast: 0,
                wonThisMonth: 0,
                winRate: 0,
                avgDealSize: 0,
                stagnantDeals: 0,
                totalDeals: 0,
                wonDeals: 0,
                lostDeals: 0,
                healthScore: 0,
                dealsByStage: [],
                dealsByOwner: [],
                monthlyRevenue: []
            };
        }

        // 2. Fetch Owners manually
        const ownerIds = Array.from(new Set(deals.map((d: any) => d.owner_id).filter(Boolean)));
        const profilesMap = new Map();

        if (ownerIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', ownerIds)
                .eq('organization_id', organizationId);

            profiles?.forEach((p: any) => profilesMap.set(p.id, p.full_name));
        }

        // 3. Map Owner Names
        const mappedDeals = deals.map((d: any) => {
            const ownerName = profilesMap.get(d.owner_id);
            return {
                ...d,
                owner: ownerName || d.owner || 'Desconhecido'
            };
        });

        // 4. Calculate Metrics
        const metrics = calculateDealMetrics(mappedDeals || []);
        const performance = calculateSalesPerformance(mappedDeals || []);
        const forecast = calculateRevenueForecast(mappedDeals || [], 6);

        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        const activeDeals = mappedDeals?.filter(d => d.stage !== 'won' && d.stage !== 'lost') || [];
        const wonDeals = mappedDeals?.filter(d => d.stage === 'won') || [];
        const lostDeals = mappedDeals?.filter(d => d.stage === 'lost') || [];

        // Won this month
        const wonThisMonth = wonDeals
            .filter(d => {
                const date = d.won_at ? new Date(d.won_at) : new Date(d.created_at);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            })
            .reduce((sum, d) => sum + Number(d.value || 0), 0);

        // Stagnant Deals
        const stagnantDeals = activeDeals.filter((d: any) => {
            if (!d.created_at) return false;
            const days = (new Date().getTime() - new Date(d.created_at).getTime()) / (1000 * 60 * 60 * 24);
            return days > 14;
        }).length;

        // Pipeline Health Calculation
        const winRateFactor = Math.min((metrics.conversionRate / 30) * 10, 10);
        const cycleTimeFactor = Math.max(10 - (metrics.avgCycleTime / 10), 0);
        const stagnantFactor = Math.max(10 - (stagnantDeals / (activeDeals.length || 1) * 20), 0);
        const healthScore = (winRateFactor * 0.4) + (cycleTimeFactor * 0.3) + (stagnantFactor * 0.3);

        // Deals by Stage
        const stageMap = new Map<string, { count: number; value: number }>();
        activeDeals.forEach(d => {
            const existing = stageMap.get(d.stage) || { count: 0, value: 0 };
            stageMap.set(d.stage, {
                count: existing.count + 1,
                value: existing.value + Number(d.value || 0)
            });
        });

        const dealsByStage = Array.from(stageMap.entries()).map(([stage, data]) => ({
            stage,
            ...data
        }));

        // Monthly Revenue Mapping
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const monthlyRevenue = forecast.map((value, i) => {
            const targetDate = new Date();
            targetDate.setMonth(currentMonth + i);
            return {
                name: months[targetDate.getMonth()],
                revenue: value,
                deals: Math.round(value / (metrics.avgDealSize || 1))
            };
        });

        return {
            totalPipeline: metrics.totalValue,
            weightedForecast: metrics.weightedValue,
            wonThisMonth,
            winRate: metrics.conversionRate,
            avgDealSize: metrics.avgDealSize,
            stagnantDeals,
            totalDeals: mappedDeals?.length || 0,
            wonDeals: wonDeals.length,
            lostDeals: lostDeals.length,
            healthScore: Number(healthScore.toFixed(1)),
            dealsByStage,
            dealsByOwner: performance.map(p => ({
                owner: p.seller,
                count: p.dealsWon + p.dealsLost,
                value: p.totalRevenue,
                won: p.dealsWon
            })),
            monthlyRevenue
        };
    }

    static async getRecentDeals(userId: string, organizationId: string) {
        const supabase = createAdminClient();

        const { data: deals, error } = await supabase
            .from('deals')
            .select('id, title, value, stage, created_at, owner_id, account_id')
            .eq('organization_id', organizationId)
            .order('created_at', { ascending: false })
            .limit(5);

        if (error) {
            console.error('[DashboardService] recent deals fetch failed');
            return [];
        }

        // Fetch Owners and Accounts manually
        const ownerIds = Array.from(new Set(deals.map((d: any) => d.owner_id).filter(Boolean)));
        const accountIds = Array.from(new Set(deals.map((d: any) => d.account_id).filter(Boolean)));

        const profilesMap = new Map();
        const accountsMap = new Map();

        if (ownerIds.length > 0) {
            const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name')
                .in('id', ownerIds)
                .eq('organization_id', organizationId);
            profiles?.forEach((p: any) => profilesMap.set(p.id, p.full_name));
        }

        if (accountIds.length > 0) {
            const { data: accounts } = await supabase
                .from('accounts')
                .select('id, name')
                .in('id', accountIds)
                .eq('organization_id', organizationId);
            accounts?.forEach((a: any) => accountsMap.set(a.id, a.name));
        }

        return deals.map((d: any) => ({
            id: d.id,
            name: d.title,
            value: d.value,
            stage: d.stage,
            owner_name: profilesMap.get(d.owner_id) || 'N/A',
            account_name: accountsMap.get(d.account_id) || 'N/A'
        }));
    }

    static async searchGlobal(userId: string, organizationId: string, query: string) {
        const supabase = createAdminClient();
        const normalized = typeof query === 'string' ? query.trim().slice(0, 80) : '';
        if (normalized.length < 2) return { deals: [], customers: [] };

        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('role, roles')
            .eq('id', userId)
            .eq('organization_id', organizationId)
            .maybeSingle();
        if (profileError || !profile) throw new Error('Não foi possível validar a permissão de busca.');
        const roles = Array.isArray(profile.roles) ? profile.roles : [];
        const canViewAll = profile.role === 'admin' || profile.role === 'manager' ||
            roles.some((role: unknown) => role === 'admin' || role === 'manager');

        const searchTerm = `%${normalized}%`;
        // The .or() grammar accepts raw PostgREST syntax and must not interpolate
        // arbitrary user search text. Use separate parameterized ilike filters.
        let titleQuery = supabase.from('deals')
            .select('id, title, company, stage, value')
            .eq('organization_id', organizationId);
        let companyQuery = supabase.from('deals')
            .select('id, title, company, stage, value')
            .eq('organization_id', organizationId);
        if (!canViewAll) {
            titleQuery = titleQuery.eq('owner_id', userId);
            companyQuery = companyQuery.eq('owner_id', userId);
        }
        const [titleRes, companyRes, customersRes] = await Promise.all([
            titleQuery.ilike('title', searchTerm).limit(5),
            companyQuery.ilike('company', searchTerm).limit(5),
            supabase.from('accounts')
                .select('id, name, segment, status')
                .eq('organization_id', organizationId)
                .ilike('name', searchTerm)
                .limit(5),
        ]);

        if (titleRes.error || companyRes.error || customersRes.error) {
            console.error('[DashboardService] global search failed');
            throw new Error('Não foi possível concluir a busca.');
        }

        const matches = [...(titleRes.data || []), ...(companyRes.data || [])];
        const deals = matches
            .filter((deal, index) => matches.findIndex(other => other.id === deal.id) === index)
            .slice(0, 5);

        return { deals, customers: customersRes.data || [] };
    }
}
