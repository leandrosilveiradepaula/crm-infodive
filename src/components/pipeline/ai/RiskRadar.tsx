
import React from 'react';
import {
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Minus,
    ShieldCheck,
    Activity
} from 'lucide-react';
import { type Deal } from '@/types/deal';

interface RiskRadarProps {
    deal: Deal;
}

export const RiskRadar: React.FC<RiskRadarProps> = ({ deal }) => {
    // Fallback if data is missing (e.g. before migration runs on existing deals)
    // We will use mock data for now if props are missing
    const score = deal.health_score ?? 100;
    const trend = deal.health_trend ?? 'stable';
    const factors = deal.risk_factors ?? [];

    const getScoreColor = (s: number) => {
        if (s >= 80) return 'text-emerald-400';
        if (s >= 50) return 'text-yellow-400';
        return 'text-red-500';
    };

    const getScoreBg = (s: number) => {
        if (s >= 80) return 'bg-emerald-500';
        if (s >= 50) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    const getTrendIcon = () => {
        switch (trend) {
            case 'improving': return <TrendingUp className="h-4 w-4 text-emerald-400" />;
            case 'declining': return <TrendingDown className="h-4 w-4 text-red-400" />;
            default: return <Minus className="h-4 w-4 text-muted-foreground" />;
        }
    };

    return (
        <div className="bg-card border border-border rounded-2xl p-5 shadow-lg shadow-slate-200/50 relative overflow-hidden group hover:shadow-xl transition-shadow duration-500">
            {/* Background Effect */}
            <div className={`absolute top-0 right-0 p-24 rounded-full blur-3xl opacity-[0.08] translate-x-12 -translate-y-12 ${getScoreBg(score)} transition-colors duration-1000`} />

            <div className="flex items-center justify-between mb-6 relative z-10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted/50 rounded-xl border border-border shadow-sm">
                        <Activity className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-foreground leading-tight">Risk Radar</h3>
                        <p className="text-[10px] font-medium text-muted-foreground mt-0.5">Monitoramento Contínuo</p>
                    </div>
                </div>
                <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border ${trend === 'improving' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' :
                        trend === 'declining' ? 'bg-rose-50 border-rose-100 text-rose-700' :
                            'bg-muted/50 border-border text-muted-foreground'
                    }`}>
                    {getTrendIcon()}
                    <span className="text-[10px] font-bold uppercase tracking-wide">
                        {trend === 'improving' ? 'Melhorando' : trend === 'declining' ? 'Crítico' : 'Estável'}
                    </span>
                </div>
            </div>

            <div className="flex gap-6 relative z-10">
                {/* Score Gauge */}
                <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                    {/* Background Circle */}
                    <svg className="w-full h-full transform -rotate-90">
                        <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            className="text-border"
                        />
                        {/* Progress Circle */}
                        <circle
                            cx="40"
                            cy="40"
                            r="34"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="transparent"
                            strokeDasharray={213.6}
                            strokeDashoffset={213.6 - (213.6 * score) / 100}
                            className={`${getScoreColor(score)} transition-all duration-1000 ease-out`}
                            strokeLinecap="round"
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className={`text-2xl font-black ${getScoreColor(score)} tracking-tighter`}>{score}</span>
                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mt-[-2px]">Score</span>
                    </div>
                </div>

                {/* Factors List */}
                <div className="flex-1 min-w-0 py-1">
                    {factors.length > 0 ? (
                        <div className="animate-in fade-in slide-in-from-right-4 duration-500">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-3 flex items-center gap-1.5">
                                <AlertTriangle className="h-3 w-3" /> Pontos de Atenção
                            </p>
                            <ul className="space-y-2.5">
                                {factors.slice(0, 3).map((factor: string, idx: number) => (
                                    <li key={idx} className="flex gap-2.5 items-start text-xs text-muted-foreground font-medium leading-relaxed group/item">
                                        <div className={`mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0 ${getScoreBg(score)} opacity-60 group-hover/item:opacity-100 transition-opacity`} />
                                        <span className="line-clamp-2">{factor}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ) : (
                        <div className="flex flex-col justify-center h-full animate-in fade-in slide-in-from-right-4 duration-500">
                            <div className="flex items-center gap-2 text-emerald-600 mb-1">
                                <ShieldCheck className="h-4 w-4" />
                                <span className="font-bold text-sm">Deal Saudável</span>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                                Nenhuma anomalia detectada. O engajamento está positivo e dentro do esperado.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
