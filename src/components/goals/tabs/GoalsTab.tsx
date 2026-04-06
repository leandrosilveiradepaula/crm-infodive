'use client';

import { useState, useMemo, useEffect } from 'react';
import { UserGoalData } from '@/types/goal';
import { Deal } from '@/types/deal';
import { updateUserGoals } from '@/app/(dashboard)/goals/actions';
import { GoalInput } from '../GoalInput';
import { StatsCard } from '../StatsCard';
import { EnhancedProgressBar } from '../EnhancedProgressBar';
import { PerformanceBadge } from '../PerformanceBadge';
import { Target, TrendingUp, Award, Calendar, DollarSign, Filter, ChevronRight, Calculator, FileText, CalendarDays } from 'lucide-react';
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface GoalsTabProps {
    users: UserGoalData[];
    deals?: Deal[] | null;
}

export function GoalsTab({ users: initialUsers, deals = [] }: GoalsTabProps) {
    const [users, setUsers] = useState(initialUsers);
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedPeriod, setSelectedPeriod] = useState<'all' | 'q1' | 'q2' | 'q3' | 'q4'>('all');

    // Sync when props change from server action revalidation
    useEffect(() => {
        setUsers(initialUsers);
    }, [initialUsers]);

    // --- CALCULATIONS ---
    const stats = useMemo(() => {
        const safeDeals = deals || [];

        // Helper to check if a deal falls into the selected period
        const isDealInPeriod = (dealDate: Date) => {
            const month = dealDate.getMonth(); // 0-11
            if (selectedPeriod === 'all') return true;
            if (selectedPeriod === 'q1') return month >= 0 && month <= 2;
            if (selectedPeriod === 'q2') return month >= 3 && month <= 5;
            if (selectedPeriod === 'q3') return month >= 6 && month <= 8;
            if (selectedPeriod === 'q4') return month >= 9 && month <= 11;
            return false;
        };

        const userPerformance = users.map(user => {
            // Filter deals by User, Year and Period
            const userDeals = safeDeals.filter(d => {
                if (!d.won_at) return false;
                const date = new Date(d.won_at);
                const isOwner = d.owner === user.user_id || d.owner_id === user.user_id;
                const isYear = date.getFullYear() === selectedYear;
                return isOwner && isYear && isDealInPeriod(date);
            });

            // Calculate Target Goal based on selection
            let targetGoal = user.yearly_goal || 0;
            if (selectedPeriod !== 'all') {
                targetGoal = user.quarterly_goals?.[selectedPeriod] || 0;
            }

            const totalSold = userDeals.reduce((sum, d) => sum + Number(d.value || 0), 0);
            const progress = targetGoal > 0 ? (totalSold / targetGoal) * 100 : 0;

            return {
                ...user,
                totalSold,
                progress,
                targetGoal,
                dealCount: userDeals.length
            };
        });

        const totalGoal = userPerformance.reduce((sum, u) => sum + u.targetGoal, 0);
        const totalSoldAll = userPerformance.reduce((sum, u) => sum + u.totalSold, 0);
        const avgProgress = totalGoal > 0 ? (totalSoldAll / totalGoal) * 100 : 0;
        const topPerformer = [...userPerformance].sort((a, b) => b.totalSold - a.totalSold)[0];

        return {
            userPerformance,
            totalGoal,
            totalSoldAll,
            avgProgress,
            topPerformer
        };
    }, [users, deals, selectedYear, selectedPeriod]);

    // Data for Bar Chart
    const chartData = stats.userPerformance.map(u => ({
        name: (u.name || 'User').split(' ')[0],
        Meta: u.targetGoal,
        Realizado: u.totalSold
    }));

    const handleUpdate = async (userId: string, data: Partial<UserGoalData>) => {
        setUsers(prev => prev.map(u => u.user_id === userId ? { ...u, ...data } : u));
        await updateUserGoals(userId, data);
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            notation: 'compact',
            maximumFractionDigits: 1,
        }).format(value);
    };

    const getPeriodLabel = () => {
        switch (selectedPeriod) {
            case 'q1': return '1º Trimestre';
            case 'q2': return '2º Trimestre';
            case 'q3': return '3º Trimestre';
            case 'q4': return '4º Trimestre';
            default: return 'Ano Completo';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header / Standardized Navigation Filter */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-lg font-black text-foreground uppercase tracking-tight">Visão Geral de Metas</h2>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase opacity-70 tracking-widest leading-none mt-1">Acompanhe o desempenho do time ({getPeriodLabel()})</p>
                </div>
                
                {/* Advanced Multi-Year Pill Selector */}
                <div className="flex flex-col sm:flex-row gap-2 bg-muted/20 p-1 rounded-xl border border-border w-full sm:w-auto h-auto sm:h-[38px] items-center">
                    {/* View Year Selector */}
                    <div className="flex items-center gap-1 px-3 border-r border-border shrink-0 h-full">
                        <CalendarDays className="h-4 w-4 text-primary opacity-50" />
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                            aria-label="Selecionar ano"
                            className="bg-transparent text-[10px] font-black uppercase tracking-widest text-foreground outline-none cursor-pointer appearance-none py-1 pl-1 pr-4 min-h-[36px]"
                        >
                            {[selectedYear - 1, selectedYear, selectedYear + 1].map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                        <svg className="h-3 w-3 text-muted-foreground -ml-4 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M19 9l-7 7-7-7"></path></svg>
                    </div>

                    <div className="flex gap-1 items-center px-1">
                        <button
                            onClick={() => setSelectedPeriod('all')}
                            className={`px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap h-full ${selectedPeriod === 'all' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'}`}
                        >
                            Tempo Todo
                        </button>
                        {[
                            { id: 'q1', label: 'Q1' },
                            { id: 'q2', label: 'Q2' },
                            { id: 'q3', label: 'Q3' },
                            { id: 'q4', label: 'Q4' },
                        ].map((tab) => {
                            const isSelected = selectedPeriod === tab.id;
                            return (
                                <button
                                    key={tab.id}
                                    aria-label={`Filtrar por ${tab.label}`}
                                    onClick={() => setSelectedPeriod(tab.id as any)}
                                    className={`relative px-4 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap h-full ${isSelected
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                        }`}
                                >
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Stats Dashboard */}
            <StatsGrid items={[
                {
                    label: `Meta (${getPeriodLabel()})`,
                    value: formatCurrency(stats.totalGoal),
                    description: `${users.length} vendedores`,
                    icon: Target,
                    color: "text-blue-600 dark:text-blue-400",
                    gradient: "from-blue-50 to-white dark:from-blue-950/20",
                    border: "border-blue-100 dark:border-blue-900/50"
                },
                {
                    label: "Realizado Total",
                    value: formatCurrency(stats.totalSoldAll),
                    description: `${stats.avgProgress.toFixed(1)}% da meta`,
                    icon: TrendingUp,
                    color: "text-emerald-600 dark:text-emerald-400",
                    gradient: "from-emerald-50 to-white dark:from-emerald-950/20",
                    border: "border-emerald-100 dark:border-emerald-900/50"
                },
                {
                    label: "Top Performer",
                    value: (stats.topPerformer?.name || 'N/A').split(' ')[0],
                    description: `${formatCurrency(stats.topPerformer?.totalSold || 0)} vendido`,
                    icon: Award,
                    color: "text-violet-600 dark:text-violet-400",
                    gradient: "from-violet-50 to-white dark:from-violet-950/20",
                    border: "border-violet-100 dark:border-violet-900/50"
                },
                {
                    label: "Faturamento vs Meta",
                    value: `${stats.avgProgress.toFixed(1)}%`,
                    description: "Progresso global do time",
                    icon: Calculator,
                    color: "text-amber-600 dark:text-amber-400",
                    gradient: "from-amber-50 to-white dark:from-amber-950/20",
                    border: "border-amber-100 dark:border-amber-900/50"
                }
            ]} />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Enhanced Table */}
                <div className="lg:col-span-2 overflow-hidden rounded-2xl border border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 h-fit">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/10 border-b border-border">
                                <tr>
                                    <th className="text-left py-3 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Usuário</th>
                                    <th className="text-center py-3 px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest min-w-[140px]">
                                        {selectedPeriod === 'all' ? 'Meta Anual' : `Meta ${selectedPeriod.toUpperCase()}`}
                                    </th>
                                    <th className="text-center py-3 px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-[#10b981] min-w-[140px]">
                                        Realizado
                                    </th>
                                    <th className="text-right py-3 px-4 text-[10px] font-black text-muted-foreground uppercase tracking-widest min-w-[160px]">Progresso</th>
                                    {selectedPeriod === 'all' && (
                                        <>
                                            <th className="text-center py-3 px-2 text-[9px] font-bold text-muted-foreground">Q1</th>
                                            <th className="text-center py-3 px-2 text-[9px] font-bold text-muted-foreground">Q2</th>
                                            <th className="text-center py-3 px-2 text-[9px] font-bold text-muted-foreground">Q3</th>
                                            <th className="text-center py-3 px-2 text-[9px] font-bold text-muted-foreground">Q4</th>
                                        </>
                                    )}
                                </tr>
                            </thead>
                        <tbody className="divide-y divide-border">
                            {stats.userPerformance.map((user, index) => {
                                const quarterlyTotal = (user.quarterly_goals?.q1 || 0) + (user.quarterly_goals?.q2 || 0) + (user.quarterly_goals?.q3 || 0) + (user.quarterly_goals?.q4 || 0);
                                const hasError = Math.abs((user.yearly_goal || 0) - quarterlyTotal) > 0.01;

                                return (
                                    <tr key={user.user_id} className="group hover:bg-muted/30 transition-all duration-200">
                                        <td className="py-2.5 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-primary to-blue-600 text-white flex items-center justify-center text-xs font-black shadow-md">
                                                    {(user as any).avatar || (user as any).name?.charAt(0) || 'U'}
                                                </div>
                                                <div>
                                                    <p className="font-bold text-foreground text-sm">{(user as any).name || 'Usuário'}</p>
                                                    <p className="text-[10px] text-muted-foreground font-medium uppercase">{user.dealCount} Vendas</p>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Dynamic Target Input */}
                                        <td className="py-2.5 px-3 text-center">
                                    {selectedPeriod === 'all' ? (
                                        <div className="flex flex-col items-center gap-1">
                                            <GoalInput
                                                value={user.yearly_goal ?? 0}
                                                onSave={(val) => handleUpdate(user.user_id, { yearly_goal: val })}
                                                hasError={hasError}
                                            />
                                            {hasError && (
                                                <span className="text-[9px] text-red-500 font-bold whitespace-nowrap">
                                                    {((user.yearly_goal || 0) - quarterlyTotal) > 0 
                                                        ? `Faltam ${formatCurrency((user.yearly_goal || 0) - quarterlyTotal)}`
                                                        : `Sobram ${formatCurrency(Math.abs((user.yearly_goal || 0) - quarterlyTotal))}`
                                                    }
                                                </span>
                                            )}
                                        </div>
                                            ) : (
                                                <GoalInput
                                                    value={user.quarterly_goals?.[selectedPeriod] ?? 0}
                                                    onSave={(val) => handleUpdate(user.user_id, {
                                                        quarterly_goals: { ...user.quarterly_goals, [selectedPeriod]: val }
                                                    })}
                                                />
                                            )}
                                        </td>

                                        <td className="py-2.5 px-3 text-center">
                                            <span className="font-black text-emerald-600 text-sm">
                                                {formatCurrency(user.totalSold)}
                                            </span>
                                        </td>
                                        <td className="py-2.5 px-4">
                                            <EnhancedProgressBar value={user.progress} size="md" />
                                        </td>

                                        {/* Quarterly breakdown (only in All view) */}
                                        {selectedPeriod === 'all' && (
                                            <>
                                                <td className="px-2 text-center">
                                                    <GoalInput className="w-16 text-[10px]" value={user.quarterly_goals?.q1 ?? 0} onSave={(val) => handleUpdate(user.user_id, { quarterly_goals: { ...user.quarterly_goals, q1: val } })} />
                                                </td>
                                                <td className="px-2 text-center">
                                                    <GoalInput className="w-16 text-[10px]" value={user.quarterly_goals?.q2 ?? 0} onSave={(val) => handleUpdate(user.user_id, { quarterly_goals: { ...user.quarterly_goals, q2: val } })} />
                                                </td>
                                                <td className="px-2 text-center">
                                                    <GoalInput className="w-16 text-[10px]" value={user.quarterly_goals?.q3 ?? 0} onSave={(val) => handleUpdate(user.user_id, { quarterly_goals: { ...user.quarterly_goals, q3: val } })} />
                                                </td>
                                                <td className="px-2 text-center">
                                                    <GoalInput className="w-16 text-[10px]" value={user.quarterly_goals?.q4 ?? 0} onSave={(val) => handleUpdate(user.user_id, { quarterly_goals: { ...user.quarterly_goals, q4: val } })} />
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

                {/* Main Comparison Chart */}
                <div className="lg:col-span-1 bg-card border border-border rounded-xl p-4 shadow-sm flex flex-col">
                    <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-4">Performance {getPeriodLabel()}</h3>
                    <div className="flex-1 min-h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }} width={60} />
                                <Tooltip
                                    cursor={{ fill: 'var(--muted-foreground)', opacity: 0.1 }}
                                    contentStyle={{ borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'var(--popover)', color: 'var(--foreground)' }}
                                    formatter={(value: any) => formatCurrency(Number(value) || 0)}
                                />
                                <Bar dataKey="Meta" fill="var(--muted)" radius={[0, 4, 4, 0]} barSize={10} name="Meta" />
                                <Bar dataKey="Realizado" radius={[0, 4, 4, 0]} barSize={10} name="Realizado">
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.Realizado >= entry.Meta ? 'var(--success)' : 'var(--primary)'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
}
