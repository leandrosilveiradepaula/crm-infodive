import React, { useEffect, useState } from 'react';
import { getLeaderboard, UserScore } from '@/app/(dashboard)/gamification/actions';
import {
    Trophy,
    Zap,
    Crown,
    Flame,
    TrendingUp,
    Maximize2,
    Minimize2,
    Medal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Helper to map icon string to Component
const getBadgeIcon = (iconName: string) => {
    switch (iconName) {
        case 'Trophy': return <Trophy className="h-4 w-4 text-warning-readable" />;
        case 'Crown': return <Crown className="h-4 w-4 text-warning-readable" />;
        case 'Zap': return <Zap className="h-4 w-4 text-primary" />;
        case 'Share2': return <TrendingUp className="h-4 w-4 text-success-readable" />;
        default: return <Medal className="h-4 w-4 text-muted-foreground" />;
    }
};

export const SalesLeaderboard: React.FC = () => {
    const [scores, setScores] = useState<UserScore[]>([]);
    const [isTvMode, setIsTvMode] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchScores();
        // Removed real-time gamification loop due to server-side only proxy strategy
    }, []);

    const fetchScores = async () => {
        try {
            setLoading(true);
            const enriched = await getLeaderboard();
            setScores(enriched);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleTvMode = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsTvMode(true);
        } else {
            document.exitFullscreen();
            setIsTvMode(false);
        }
    };

    return (
        <div className={`
            ${isTvMode ? 'fixed inset-0 z-[100] p-12' : 'h-full p-6'}
            bg-background text-foreground overflow-hidden transition-all duration-500
            ${isTvMode ? 'bg-[url("https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop")] bg-cover bg-center bg-blend-overlay bg-background/80' : ''}
        `}>
            {/* Header */}
            <div className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-warning/20 rounded-[var(--radius-panel)] backdrop-blur-md border border-warning/30">
                        <Trophy className="h-8 w-8 text-warning-readable" />
                    </div>
                    <div>
                        <h1 className={`${isTvMode ? 'text-metric-ui' : 'text-metric-ui'} font-black italic tracking-tighter text-foreground`}>
                            SALES LEADERBOARD
                        </h1>
                        <p className="text-muted-foreground font-medium tracking-widest text-body-ui uppercase">Performance em Tempo Real</p>
                    </div>
                </div>
                <button
                    onClick={toggleTvMode}
                    className="p-3 bg-muted hover:bg-muted/80 rounded-[var(--radius-panel)] border border-border transition-colors text-muted-foreground hover:text-foreground"
                >
                    {isTvMode ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
                </button>
            </div>

            {/* Podium (Top 3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 items-end max-w-5xl mx-auto">
                {/* 2nd Place */}
                <div className="order-2 lg:order-1 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border-4 border-muted-foreground/30 bg-muted flex items-center justify-center text-page-title font-bold text-muted-foreground relative mb-4 shadow-card-ui">
                        2
                        <div className="absolute -top-3 w-8 h-8 bg-muted-foreground rounded-full flex items-center justify-center border-2 border-background">
                            <Medal className="h-4 w-4 text-background" />
                        </div>
                    </div>
                    <div className="bg-card/80 backdrop-blur-md border border-border/50 w-full p-6 rounded-t-2xl text-center h-[200px] flex flex-col justify-end shadow-card-ui">
                        <h3 className="text-section-title font-bold mb-1 text-foreground">{scores[1]?.user?.name || '---'}</h3>
                        <p className="text-metric-ui font-black text-muted-foreground">{scores[1]?.total_score || 0} pts</p>
                        <p className="text-metadata-ui text-muted-foreground mt-2 uppercase tracking-wide font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(scores[1]?.revenue_generated || 0)}
                        </p>
                    </div>
                </div>

                {/* 1st Place */}
                <div className="order-1 lg:order-2 flex flex-col items-center -mt-8 relative z-10">
                    <motion.div
                        initial={{ scale: 0.9 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.5, repeat: Infinity, repeatType: "reverse" }}
                        className="absolute -top-16"
                    >
                        <Crown className="h-12 w-12 text-warning-readable fill-warning/20" />
                    </motion.div>
                    <div className="w-32 h-32 rounded-full border-4 border-warning bg-warning/10 flex items-center justify-center text-metric-ui font-bold text-warning-readable relative mb-4 shadow-overlay-ui">
                        1
                    </div>
                    <div className="bg-surface-subtle backdrop-blur-md border border-warning/30 w-full p-6 rounded-t-3xl text-center h-[260px] flex flex-col justify-end relative overflow-hidden shadow-card-ui">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay"></div>
                        <h3 className="text-page-title font-black mb-1 text-foreground">{scores[0]?.user?.name || '---'}</h3>
                        <p className="text-metric-ui font-black text-warning-readable mb-2">{scores[0]?.total_score || 0} pts</p>
                        <p className="text-body-ui text-warning-readable dark:text-warning-readable uppercase tracking-wide font-bold bg-warning/10 py-1 rounded-[var(--radius-control)]">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(scores[0]?.revenue_generated || 0)}
                        </p>
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="order-3 lg:order-3 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border-4 border-warning bg-warning/10 flex items-center justify-center text-page-title font-bold text-warning-readable relative mb-4 shadow-card-ui">
                        3
                        <div className="absolute -top-3 w-8 h-8 bg-warning rounded-full flex items-center justify-center border-2 border-background">
                            <Medal className="h-4 w-4 text-background" />
                        </div>
                    </div>
                    <div className="bg-card/80 backdrop-blur-md border border-warning/30 w-full p-6 rounded-t-2xl text-center h-[180px] flex flex-col justify-end shadow-card-ui">
                        <h3 className="text-section-title font-bold mb-1 text-foreground">{scores[2]?.user?.name || '---'}</h3>
                        <p className="text-metric-ui font-black text-warning-readable dark:text-warning-readable">{scores[2]?.total_score || 0} pts</p>
                        <p className="text-metadata-ui text-muted-foreground mt-2 uppercase tracking-wide font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(scores[2]?.revenue_generated || 0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* List for the rest */}
            <div className="max-w-4xl mx-auto bg-card/50 backdrop-blur border border-border rounded-[var(--radius-panel)] overflow-hidden shadow-card-ui">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-metadata-ui font-bold text-muted-foreground uppercase tracking-widest">Posição</th>
                            <th className="px-6 py-4 text-left text-metadata-ui font-bold text-muted-foreground uppercase tracking-widest">Vendedor</th>
                            <th className="px-6 py-4 text-center text-metadata-ui font-bold text-muted-foreground uppercase tracking-widest">Badges</th>
                            <th className="px-6 py-4 text-center text-metadata-ui font-bold text-muted-foreground uppercase tracking-widest">Streak</th>
                            <th className="px-6 py-4 text-right text-metadata-ui font-bold text-muted-foreground uppercase tracking-widest">Deals</th>
                            <th className="px-6 py-4 text-right text-metadata-ui font-bold text-muted-foreground uppercase tracking-widest">Pontuação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {scores.slice(3).map((score, idx) => (
                            <tr key={idx} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-muted-foreground">#{idx + 4}</td>
                                <td className="px-6 py-4 font-bold text-foreground flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-metadata-ui text-foreground">
                                        {score.user?.name.charAt(0)}
                                    </div>
                                    {score.user?.name}
                                </td>
                                <td className="px-6 py-4 flex justify-center gap-1">
                                    {score.badges?.map((b, i) => (
                                        <div key={i} title={b.name} className="p-1 rounded bg-muted border border-border">
                                            {getBadgeIcon(b.icon)}
                                        </div>
                                    ))}
                                </td>
                                <td className="px-6 py-4 text-center">
                                    {score.current_streak > 2 && (
                                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-warning/10 text-warning-readable rounded text-metadata-ui font-bold border border-warning/20">
                                            <Flame className="h-3 w-3 fill-warning" />
                                            {score.current_streak} dias
                                        </div>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-right font-medium text-muted-foreground">{score.deals_won_count}</td>
                                <td className="px-6 py-4 text-right font-black text-foreground">{score.total_score}</td>
                            </tr>
                        ))}
                        {scores.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-8 text-center text-muted-foreground">
                                    Ainda não há pontuações registradas. Feche deals para aparecer aqui!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};
