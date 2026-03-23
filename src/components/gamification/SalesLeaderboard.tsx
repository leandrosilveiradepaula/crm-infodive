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
        case 'Trophy': return <Trophy className="h-4 w-4 text-yellow-500" />;
        case 'Crown': return <Crown className="h-4 w-4 text-yellow-500" />;
        case 'Zap': return <Zap className="h-4 w-4 text-blue-400" />;
        case 'Share2': return <TrendingUp className="h-4 w-4 text-green-400" />;
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
                    <div className="p-3 bg-yellow-500/20 rounded-2xl backdrop-blur-md border border-yellow-500/30">
                        <Trophy className="h-8 w-8 text-yellow-500" />
                    </div>
                    <div>
                        <h1 className={`${isTvMode ? 'text-5xl' : 'text-3xl'} font-black italic tracking-tighter bg-clip-text text-transparent bg-gradient-to-r from-yellow-400 to-orange-500`}>
                            SALES LEADERBOARD
                        </h1>
                        <p className="text-muted-foreground font-medium tracking-widest text-sm uppercase">Performance em Tempo Real</p>
                    </div>
                </div>
                <button
                    onClick={toggleTvMode}
                    className="p-3 bg-muted hover:bg-muted/80 rounded-xl border border-border transition-colors text-muted-foreground hover:text-foreground"
                >
                    {isTvMode ? <Minimize2 className="h-6 w-6" /> : <Maximize2 className="h-6 w-6" />}
                </button>
            </div>

            {/* Podium (Top 3) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12 items-end max-w-5xl mx-auto">
                {/* 2nd Place */}
                <div className="order-2 lg:order-1 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border-4 border-muted-foreground/30 bg-muted flex items-center justify-center text-2xl font-bold text-muted-foreground relative mb-4 shadow-lg">
                        2
                        <div className="absolute -top-3 w-8 h-8 bg-muted-foreground rounded-full flex items-center justify-center border-2 border-background">
                            <Medal className="h-4 w-4 text-background" />
                        </div>
                    </div>
                    <div className="bg-card/80 backdrop-blur-md border border-border/50 w-full p-6 rounded-t-2xl text-center h-[200px] flex flex-col justify-end shadow-xl">
                        <h3 className="text-xl font-bold mb-1 text-foreground">{scores[1]?.user?.name || '---'}</h3>
                        <p className="text-3xl font-black text-muted-foreground">{scores[1]?.total_score || 0} pts</p>
                        <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wide font-bold">
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
                        <Crown className="h-12 w-12 text-yellow-500 fill-yellow-500/20" />
                    </motion.div>
                    <div className="w-32 h-32 rounded-full border-4 border-yellow-500 bg-yellow-500/10 flex items-center justify-center text-4xl font-bold text-yellow-500 relative mb-4 shadow-[0_0_50px_rgba(234,179,8,0.3)]">
                        1
                    </div>
                    <div className="bg-gradient-to-b from-yellow-500/10 to-card/90 backdrop-blur-md border border-yellow-500/30 w-full p-6 rounded-t-3xl text-center h-[260px] flex flex-col justify-end relative overflow-hidden shadow-2xl">
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-5 mix-blend-overlay"></div>
                        <h3 className="text-2xl font-black mb-1 text-foreground">{scores[0]?.user?.name || '---'}</h3>
                        <p className="text-5xl font-black text-yellow-500 mb-2">{scores[0]?.total_score || 0} pts</p>
                        <p className="text-sm text-yellow-600 dark:text-yellow-400 uppercase tracking-wide font-bold bg-yellow-500/10 py-1 rounded-lg">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(scores[0]?.revenue_generated || 0)}
                        </p>
                    </div>
                </div>

                {/* 3rd Place */}
                <div className="order-3 lg:order-3 flex flex-col items-center">
                    <div className="w-24 h-24 rounded-full border-4 border-orange-700 bg-orange-900/10 flex items-center justify-center text-2xl font-bold text-orange-700 relative mb-4 shadow-lg">
                        3
                        <div className="absolute -top-3 w-8 h-8 bg-orange-700 rounded-full flex items-center justify-center border-2 border-background">
                            <Medal className="h-4 w-4 text-background" />
                        </div>
                    </div>
                    <div className="bg-card/80 backdrop-blur-md border border-orange-700/30 w-full p-6 rounded-t-2xl text-center h-[180px] flex flex-col justify-end shadow-xl">
                        <h3 className="text-xl font-bold mb-1 text-foreground">{scores[2]?.user?.name || '---'}</h3>
                        <p className="text-3xl font-black text-orange-600 dark:text-orange-500">{scores[2]?.total_score || 0} pts</p>
                        <p className="text-xs text-muted-foreground mt-2 uppercase tracking-wide font-bold">
                            {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', notation: 'compact' }).format(scores[2]?.revenue_generated || 0)}
                        </p>
                    </div>
                </div>
            </div>

            {/* List for the rest */}
            <div className="max-w-4xl mx-auto bg-card/50 backdrop-blur border border-border rounded-2xl overflow-hidden shadow-lg">
                <table className="w-full">
                    <thead className="bg-muted/50">
                        <tr>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Posição</th>
                            <th className="px-6 py-4 text-left text-xs font-bold text-muted-foreground uppercase tracking-widest">Vendedor</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Badges</th>
                            <th className="px-6 py-4 text-center text-xs font-bold text-muted-foreground uppercase tracking-widest">Streak</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Deals</th>
                            <th className="px-6 py-4 text-right text-xs font-bold text-muted-foreground uppercase tracking-widest">Pontuação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {scores.slice(3).map((score, idx) => (
                            <tr key={idx} className="hover:bg-muted/50 transition-colors">
                                <td className="px-6 py-4 font-bold text-muted-foreground">#{idx + 4}</td>
                                <td className="px-6 py-4 font-bold text-foreground flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs text-foreground">
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
                                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-500/10 text-orange-500 rounded text-xs font-bold border border-orange-500/20">
                                            <Flame className="h-3 w-3 fill-orange-500" />
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
