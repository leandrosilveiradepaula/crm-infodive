'use client';

import { useState, useEffect } from 'react';
import { Bot, Loader2, Sparkles, TrendingUp, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Deal } from '@/types/deal';

interface AIDealSummaryHeaderProps {
    deal: Deal;
}

export const AIDealSummaryHeader = ({ deal }: AIDealSummaryHeaderProps) => {
    const [summary, setSummary] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        generateSummary();
    }, [deal.id]);

    const generateSummary = async () => {
        setIsLoading(true);
        try {
            // Simulate AI generation (you can replace with actual Gemini API call)
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Generate contextual summary based on deal data
            const products = deal.deal_products || [];
            const productCount = products.length;
            const totalValue = deal.value || 0;
            const topProduct = products.length > 0 ? products[0].name : 'N/A';

            const insights: string[] = [];

            if (productCount > 0) {
                insights.push(`Mix de ${productCount} produto${productCount > 1 ? 's' : ''}`);
            }

            if (deal.probability && deal.probability >= 80) {
                insights.push('Alta probabilidade de conversão');
            } else if (deal.probability && deal.probability < 50) {
                insights.push('Requer atenção - baixa probabilidade');
            }

            if (deal.days_in_stage && deal.days_in_stage > 7) {
                insights.push(`⚠️ Estagnado há ${deal.days_in_stage} dias`);
            }

            if (deal.expected_close_date) {
                const daysUntilClose = Math.ceil((new Date(deal.expected_close_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                if (daysUntilClose < 0) {
                    insights.push(`🚨 Venceu há ${Math.abs(daysUntilClose)} dias`);
                } else if (daysUntilClose < 7) {
                    insights.push(`⏰ Fecha em ${daysUntilClose} dias`);
                }
            }

            setSummary(insights.join(' • '));
        } catch (error) {
            console.error('Error generating AI summary:', error);
            setSummary('Análise indisponível no momento');
        } finally {
            setIsLoading(false);
        }
    };

    if (!summary && !isLoading) return null;

    return (
        <AnimatePresence>
            {!collapsed && (
                <motion.div
                    initial={{ opacity: 0, y: -20, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    exit={{ opacity: 0, y: -20, height: 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="mb-6 overflow-hidden"
                >
                    <div className="relative bg-gradient-to-r from-teal-500/10 via-blue-500/10 to-cyan-500/10 border border-teal-500/20 rounded-2xl p-5 backdrop-blur-md shadow-2xl">
                        {/* Animated Gradient Border Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-teal-500/20 via-blue-500/20 to-cyan-500/20 rounded-2xl opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                        <div className="relative z-10 flex items-start gap-4">
                            {/* Icon */}
                            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center shadow-lg shadow-teal-500/30 shrink-0">
                                {isLoading ? (
                                    <Loader2 className="h-6 w-6 text-white animate-spin" />
                                ) : (
                                    <Bot className="h-6 w-6 text-white" />
                                )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <Sparkles className="h-3.5 w-3.5 text-teal-400" />
                                    <h3 className="text-xs font-black text-teal-300 uppercase tracking-widest">Análise Inteligente</h3>
                                </div>

                                {isLoading ? (
                                    <div className="space-y-2">
                                        <div className="h-3 bg-card/10 rounded-full w-3/4 animate-pulse" />
                                        <div className="h-3 bg-card/10 rounded-full w-1/2 animate-pulse" />
                                    </div>
                                ) : (
                                    <motion.p
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 }}
                                        className="text-sm font-bold text-white leading-relaxed"
                                    >
                                        {summary}
                                    </motion.p>
                                )}
                            </div>

                            {/* Collapse Button */}
                            <button
                                onClick={() => setCollapsed(true)}
                                className="p-2 hover:bg-card/10 rounded-lg transition-colors text-muted-foreground hover:text-white shrink-0"
                                title="Minimizar"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>
                        </div>

                        {/* Status Indicators */}
                        <div className="mt-4 flex items-center gap-3 pt-3 border-t border-white/10">
                            {deal.stage === 'won' && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded-lg">
                                    <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                                    <span className="text-xs font-black text-emerald-300 uppercase tracking-wider">Ganho</span>
                                </div>
                            )}
                            {deal.probability && deal.probability >= 80 && deal.stage !== 'won' && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg">
                                    <TrendingUp className="h-3 w-3 text-blue-400" />
                                    <span className="text-xs font-black text-blue-300 uppercase tracking-wider">Alta Chance</span>
                                </div>
                            )}
                            {deal.days_in_stage && deal.days_in_stage > 7 && (
                                <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500/20 border border-red-500/30 rounded-lg animate-pulse">
                                    <AlertTriangle className="h-3 w-3 text-red-400" />
                                    <span className="text-xs font-black text-red-300 uppercase tracking-wider">Atenção Necessária</span>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    // Collapsed state - floating badge
    return collapsed ? (
        <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setCollapsed(false)}
            className="mb-4 px-4 py-2 bg-gradient-to-r from-teal-500/20 to-blue-500/20 border border-teal-500/30 rounded-full text-xs font-bold text-teal-300 hover:bg-teal-500/30 transition-all shadow-lg flex items-center gap-2"
        >
            <Bot className="h-3.5 w-3.5" />
            Ver Análise AI
        </motion.button>
    ) : null;
};
