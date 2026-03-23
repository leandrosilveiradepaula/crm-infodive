'use client';

import { useState, useMemo, useEffect } from 'react';
import { UserGoalData } from '@/types/goal';
import { Deal } from '@/types/deal';
import { updateUserGoals } from '@/app/(dashboard)/goals/actions';
import { GoalInput } from '../GoalInput';
import { StatsCard } from '../StatsCard';
import { EnhancedProgressBar } from '../EnhancedProgressBar';
import { PerformanceBadge } from '../PerformanceBadge';
import { Target, TrendingUp, Award, Calendar, DollarSign, Filter, ChevronRight, Calculator, FileText } from 'lucide-react';
import { ThemeSelect, ThemeLabel } from '@/components/ui/theme/ThemeComponents';
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
        <div className="space-y-8">
            {/* Header / Filters */}
            <div className="flex justify-between items-center flex-wrap gap-4">
                <div>
                    <h2 className="text-lg font-bold text-foreground">Visão Geral de Metas</h2>
                    <p className="text-xs text-muted-foreground">Acompanhe o desempenho do time ({getPeriodLabel()})</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground ml-2" />
                        <ThemeSelect
                            className="bg-card w-[180px] h-[34px] border-border text-xs focus:ring-1 focus:ring-blue-500 rounded-xl"
                            value={selectedPeriod}
                            onChange={(e) => setSelectedPeriod(e.target.value as any)}
                        >
                            <option value="all">Ano Completo</option>
                            <option value="q1">1º Trimestre (Jan-Mar)</option>
                            <option value="q2">2º Trimestre (Abr-Jun)</option>
                            <option value="q3">3º Trimestre (Jul-Set)</option>
                            <option value="q4">4º Trimestre (Out-Dez)</option>
                        </ThemeSelect>
                    </div>

                    {/* Year Selector */}
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground ml-2" />
                        <ThemeSelect
                            className="bg-card w-[100px] h-[34px] border-border text-xs focus:ring-1 focus:ring-blue-500 rounded-xl"
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(Number(e.target.value))}
                        >
                            <option value={2024}>2024</option>
                            <option value={2025}>2025</option>
                            <option value={2026}>2026</option>
                        </ThemeSelect>
                    </div>
                </div>
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <StatsCard
                    title={`Meta (${getPeriodLabel()})`}
                    value={formatCurrency(stats.totalGoal)}
                    icon={Target}
                    color="blue"
                    subtitle={`${users.length} vendedores`}
                />
                <StatsCard
                    title="Realizado Total"
                    value={formatCurrency(stats.totalSoldAll)}
                    icon={TrendingUp}
                    color="emerald"
                    trend={{ value: stats.avgProgress, isPositive: true }}
                    subtitle={`${stats.avgProgress.toFixed(1)}% da meta`}
                />
                <StatsCard
                    title="Top Performer"
                    value={stats.topPerformer?.name || 'N/A'}
                    icon={Award}
                    color="violet"
                    subtitle={`${formatCurrency(stats.topPerformer?.totalSold || 0)} vendido`}
                />
                {/* Mini Chart Card */}
                <div className="bg-card border border-border rounded-2xl p-4 shadow-sm flex flex-col justify-between relative overflow-hidden">
                    <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest z-10">Meta vs Realizado</h3>
                    <div className="h-20 mt-2 z-10">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={[{ name: 'Total', Meta: stats.totalGoal, Realizado: stats.totalSoldAll }]}>
                                <Bar dataKey="Meta" fill="var(--muted)" radius={[4, 4, 4, 4]} barSize={20} />
                                <Bar dataKey="Realizado" fill="var(--primary)" radius={[4, 4, 4, 4]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Enhanced Table */}
                <div className="lg:col-span-2 overflow-x-auto rounded-2xl border border-border bg-card shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700">
                    <table className="w-full">
                        <thead className="bg-muted/10 border-b border-border">
                            <tr>
                                <th className="text-left py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest">Usuário</th>
                                <th className="text-center py-4 px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest min-w-[100px]">
                                    {selectedPeriod === 'all' ? 'Meta Anual' : `Meta ${selectedPeriod.toUpperCase()}`}
                                </th>
                                <th className="text-center py-4 px-3 text-[10px] font-black text-muted-foreground uppercase tracking-widest text-[#10b981] min-w-[100px]">
                                    Realizado
                                </th>
                                <th className="text-right py-4 px-6 text-[10px] font-black text-muted-foreground uppercase tracking-widest min-w-[150px]">Progresso</th>
                                {selectedPeriod === 'all' && (
                                    <>
                                        <th className="text-center py-5 px-2 text-[9px] font-bold text-muted-foreground">Q1</th>
                                        <th className="text-center py-5 px-2 text-[9px] font-bold text-muted-foreground">Q2</th>
                                        <th className="text-center py-5 px-2 text-[9px] font-bold text-muted-foreground">Q3</th>
                                        <th className="text-center py-5 px-2 text-[9px] font-bold text-muted-foreground">Q4</th>
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
                                        <td className="py-4 px-6">
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
                                        <td className="py-4 px-3 text-center">
                                            {selectedPeriod === 'all' ? (
                                                <div className="flex flex-col items-center gap-1">
                                                    <GoalInput
                                                        value={user.yearly_goal ?? 0}
                                                        onSave={(val) => handleUpdate(user.user_id, { yearly_goal: val })}
                                                        hasError={hasError}
                                                    />
                                                    {hasError && <span className="text-[9px] text-red-500 font-bold">≠ Soma Qs</span>}
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

                                        <td className="py-4 px-3 text-center">
                                            <span className="font-black text-emerald-600 text-sm">
                                                {formatCurrency(user.totalSold)}
                                            </span>
                                        </td>
                                        <td className="py-4 px-6">
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

                {/* Main Comparison Chart */}
                <div className="lg:col-span-1 bg-card border border-border rounded-2xl p-6 shadow-sm flex flex-col">
                    <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest mb-6">Performance {getPeriodLabel()}</h3>
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
