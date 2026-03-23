import { useMemo } from 'react';
import type { Deal } from './useDeals';
import {
    calculateDealMetrics,
    calculateSalesPerformance,
    calculateRevenueForecast
} from '../utils/analytics';

export interface DashboardMetrics {
    totalPipeline: number;
    weightedForecast: number;
    wonThisMonth: number;
    winRate: number;
    avgDealSize: number;
    stagnantDeals: number;
    totalDeals: number;
    wonDeals: number;
    lostDeals: number;
    healthScore: number;
    dealsByStage: { stage: string; count: number; value: number }[];
    dealsByOwner: { owner: string; count: number; value: number; won: number }[];
    monthlyRevenue: { name: string; revenue: number; deals: number }[];
}

export const useDashboardMetrics = (deals: Deal[]): DashboardMetrics => {
    return useMemo(() => {
        const now = new Date();
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();

        // 1. Use Analytics Utility for core metrics
        const metrics = calculateDealMetrics(deals);
        const performance = calculateSalesPerformance(deals);
        const forecast = calculateRevenueForecast(deals, 6);

        const activeDeals = deals.filter(d => d.stage !== 'won' && d.stage !== 'lost');
        const wonDeals = deals.filter(d => d.stage === 'won');
        const lostDeals = deals.filter(d => d.stage === 'lost');

        // Won this month
        const wonThisMonth = wonDeals
            .filter(d => {
                const date = d.won_at ? new Date(d.won_at) : new Date(d.created_at);
                return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
            })
            .reduce((sum, d) => sum + Number(d.value || 0), 0);

        // Stagnant Deals
        const stagnantDeals = activeDeals.filter(d => d.days_in_stage > 14).length;

        // Pipeline Health Calculation (0-10)
        // Factors: Win Rate (40%), Avg Cycle Time (30%), Stagnation (30%)
        const winRateFactor = Math.min((metrics.conversionRate / 30) * 10, 10); // 30% win rate = 10 points
        const cycleTimeFactor = Math.max(10 - (metrics.avgCycleTime / 10), 0); // 100 days = 0 points
        const stagnantFactor = Math.max(10 - (stagnantDeals / (activeDeals.length || 1) * 20), 0); // 50% stagnant = 0 points
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
            const targetDate = new Date(currentYear, currentMonth - (5 - i), 1);
            return {
                name: months[targetDate.getMonth()],
                revenue: i === 5 ? (wonThisMonth || value) : value, // Simplified for demo
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
            totalDeals: deals.length,
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
    }, [deals]);
};
