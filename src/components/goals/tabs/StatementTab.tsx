'use client';

import { useState, useMemo } from 'react';
import { UserGoalData } from '@/types/goal';
import { Deal } from '@/types/deal';
import { calculateDealCommission } from '@/utils/commissionCalculator';
import { updateDealCommissionStatus } from '@/app/(dashboard)/goals-commissions/actions';
import { Clock, CheckCircle2, User, Filter, Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeSelect, ThemeInput } from '@/components/ui/theme/ThemeComponents';
import { FilterBar } from '@/components/layout/FilterBar';

interface StatementTabProps {
    deals: Deal[];
    users: UserGoalData[];
}

export function StatementTab({ deals, users }: StatementTabProps) {
    const router = useRouter();
    const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'paid'>('all');
    const [filterMonth, setFilterMonth] = useState<string>('');
    const [selectedUserId, setSelectedUserId] = useState<string>('all');

    const handleTogglePayment = async (deal: Deal) => {
        // Assume deal has commission_status field. If not in type definition, we might need to cast or fix type.
        // The source code logic:
        const currentStatus = (deal as any).commission_status || 'pending';
        const newStatus = currentStatus === 'paid' ? 'pending' : 'paid';
        const paidAt = newStatus === 'paid' ? new Date().toISOString() : null;

        // Calculate final value to freeze it
        const dealOwner = users.find(u => u.user_id === deal.owner || u.user_id === deal.owner_id);
        const { commission } = calculateDealCommission(
            deal,
            dealOwner?.commission_rules,
            0 // Legacy rate logic if needed, passing 0 for now
        );

        const updateData = {
            commission_status: newStatus,
            commission_paid_at: paidAt || undefined,
            commission_value_final: newStatus === 'paid' ? commission : null // Unfreeze if unmarking? Source said undefined.
        };

        const result = await updateDealCommissionStatus(deal.id, updateData);
        if (result.success) {
            router.refresh();
        } else {
            alert('Erro ao atualizar pagamento: ' + result.error);
        }
    };

    const filteredDeals = useMemo(() => {
        return deals.filter(deal => {
            // const isWon = deal.stage === 'won'; // Assuming deals passed are already won as per server action
            const matchesUser = selectedUserId === 'all' ? true : (deal.owner === selectedUserId || deal.owner_id === selectedUserId);
            const status = (deal as any).commission_status || 'pending';
            const matchesStatus = filterStatus === 'all' ? true : status === filterStatus;

            // Month Filter
            const date = deal.won_at || deal.created_at;
            const matchesMonth = filterMonth ? date.startsWith(filterMonth) : true;

            return matchesUser && matchesStatus && matchesMonth;
        });
    }, [deals, selectedUserId, filterStatus, filterMonth]);

    return (
        <div className="space-y-6">
            {/* Standardized Filters */}
            <FilterBar>
                <div className="flex flex-wrap gap-3 flex-1">
                    <div className="relative group">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <ThemeSelect
                            aria-label="Filtrar comissões por vendedor"
                            className="bg-muted/30 border-border rounded-[var(--radius-panel)] pl-9 h-11 ds-type-metadata text-foreground focus:ring-1 focus:ring-primary outline-none min-w-[200px]"
                            value={selectedUserId}
                            onChange={e => setSelectedUserId(e.target.value)}
                        >
                            <option value="all">Todos os Vendedores</option>
                            {users.map(u => (
                                <option key={u.user_id} value={u.user_id}>{(u as any).name}</option>
                            ))}
                        </ThemeSelect>
                    </div>

                    <div className="relative group">
                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <ThemeSelect
                            aria-label="Filtrar comissões por status"
                            className="bg-muted/30 border-border rounded-[var(--radius-panel)] pl-9 h-11 ds-type-metadata text-foreground focus:ring-1 focus:ring-primary outline-none min-w-[160px]"
                            value={filterStatus}
                            onChange={e => setFilterStatus(e.target.value as any)}
                        >
                            <option value="all">Todos os Status</option>
                            <option value="pending">Pendente</option>
                            <option value="paid">Pago</option>
                        </ThemeSelect>
                    </div>

                    <div className="relative group">
                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <ThemeInput
                            type="month"
                            aria-label="Filtrar comissões por mês"
                            className="bg-muted/30 border-border rounded-[var(--radius-panel)] pl-9 h-11 ds-type-metadata text-foreground focus:ring-1 focus:ring-primary outline-none min-w-[160px]"
                            value={filterMonth}
                            onChange={e => setFilterMonth(e.target.value)}
                        />
                    </div>
                </div>
            </FilterBar>

            <div className="overflow-hidden rounded-[var(--radius-panel)] border border-border bg-card shadow-control-ui">
                <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="Tabela de comissões, rolável horizontalmente">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="ds-type-metadata font-[var(--ds-type-metric-weight)] text-muted-foreground uppercase tracking-widest border-b border-border bg-muted/10">
                                <th className="px-5 py-3">Oportunidade</th>
                                <th className="px-5 py-3">Vendedor</th>
                                <th className="px-5 py-3">Data Fechamento</th>
                                <th className="px-5 py-3 text-right">Base Líquida</th>
                                <th className="px-5 py-3 text-right">Comissão</th>
                                <th className="px-5 py-3 text-center">Status Pagto</th>
                                <th className="px-5 py-3 text-center">Ações</th>
                            </tr>
                        </thead>
                    <tbody className="divide-y divide-border">
                        {filteredDeals.length === 0 ? (
                            <tr>
                                <td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhuma comissão encontrada para os filtros selecionados.</td>
                            </tr>
                        ) : (
                            filteredDeals.map(deal => {
                                const dealOwner = users.find(u => u.user_id === deal.owner || u.user_id === deal.owner_id);
                                const commissionStatus = (deal as any).commission_status || 'pending';
                                const commissionValueFinal = (deal as any).commission_value_final;

                                // If paid, use frozen value, otherwise calculate dynamic
                                const dynamicCalc = calculateDealCommission(
                                    deal,
                                    dealOwner?.commission_rules,
                                    0
                                );

                                const displayCommission = commissionStatus === 'paid' && commissionValueFinal
                                    ? commissionValueFinal
                                    : dynamicCalc.commission;

                                const displayNetMargin = dynamicCalc.netMargin;

                                return (
                                    <tr key={deal.id} className="hover:bg-muted/30 transition-colors group">
                                        <td className="px-5 py-3">
                                            <p className="font-[var(--ds-type-metric-weight)] text-foreground ds-type-body tracking-tight">{deal.title}</p>
                                            <p className="ds-type-metadata font-[var(--ds-type-control-weight)] text-muted-foreground uppercase opacity-70 mt-0.5">{(deal as any).customer?.name || deal.company || 'Empresa não informada'}</p>
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 rounded-[var(--radius-panel)] bg-primary text-primary-foreground flex items-center justify-center ds-type-metadata font-[var(--ds-type-metric-weight)] shadow-card-ui">
                                                    {(dealOwner as any)?.avatar || (dealOwner as any)?.name?.charAt(0) || '?'}
                                                </div>
                                                <span className="ds-type-body font-[var(--ds-type-control-weight)] text-foreground">{(dealOwner as any)?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3 ds-type-metadata font-[var(--ds-type-control-weight)] text-muted-foreground">
                                            {deal.won_at ? new Date(deal.won_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="px-5 py-3 text-right font-[var(--ds-type-control-weight)] text-muted-foreground ds-type-body tabular-nums tracking-tighter">
                                            {displayNetMargin.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <span className="font-[var(--ds-type-metric-weight)] text-success-readable ds-type-body tabular-nums tracking-tighter">
                                                {displayCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full ds-type-metadata font-[var(--ds-type-metric-weight)] uppercase tracking-widest border shadow-control-ui ${commissionStatus === 'paid'
                                                ? 'bg-info-subtle text-primary border-info/20'
                                                : 'bg-warning-subtle text-warning-readable border-warning/20'
                                                }`}>
                                                {commissionStatus === 'paid' ? 'Pago' : 'Pendente'}
                                            </span>
                                        </td>
                                        <td className="px-5 py-3 text-center">
                                            <button
                                                onClick={() => handleTogglePayment(deal)}
                                                aria-label={commissionStatus === 'paid' ? "Marcar como Pendente" : "Marcar como Pago"}
                                                className={`p-2 rounded-[var(--radius-panel)] transition-all ${commissionStatus === 'paid'
                                                    ? 'text-muted-foreground hover:text-warning-readable hover:bg-warning-subtle'
                                                    : 'text-muted-foreground hover:text-primary hover:bg-info-subtle'
                                                    }`}
                                                title={commissionStatus === 'paid' ? "Marcar como Pendente" : "Marcar como Pago"}
                                            >
                                                {commissionStatus === 'paid' ? <Clock className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    );
}
