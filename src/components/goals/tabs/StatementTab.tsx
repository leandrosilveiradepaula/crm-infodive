'use client';

import { useState, useMemo } from 'react';
import { UserGoalData } from '@/types/goal';
import { Deal } from '@/types/deal';
import { calculateDealCommission } from '@/utils/commissionCalculator';
import { updateDealCommissionStatus } from '@/app/(dashboard)/goals-commissions/actions';
import { Clock, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ThemeSelect, ThemeInput } from '@/components/ui/theme/ThemeComponents';

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
        <div>
            {/* Filters */}
            <div className="flex gap-4 mb-6 sticky top-0 bg-background p-4 z-10 border-b border-border">
                <ThemeSelect
                    className="bg-background border border-border rounded-xl px-3 h-10 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none min-w-[150px]"
                    value={selectedUserId}
                    onChange={e => setSelectedUserId(e.target.value)}
                >
                    <option value="all">Todos os Vendedores</option>
                    {users.map(u => (
                        <option key={u.user_id} value={u.user_id}>{(u as any).name}</option>
                    ))}
                </ThemeSelect>

                <ThemeSelect
                    className="bg-background border border-border rounded-xl px-3 h-10 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none min-w-[150px]"
                    value={filterStatus}
                    onChange={e => setFilterStatus(e.target.value as any)}
                >
                    <option value="all">Todos os Status</option>
                    <option value="pending">Pendente</option>
                    <option value="paid">Pago</option>
                </ThemeSelect>

                <ThemeInput
                    type="month"
                    className="bg-background border border-border rounded-xl px-3 h-10 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                    value={filterMonth}
                    onChange={e => setFilterMonth(e.target.value)}
                />
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="text-[10px] font-black text-muted-foreground uppercase tracking-widest border-b border-border">
                            <th className="p-4">Oportunidade</th>
                            <th className="p-4">Vendedor</th>
                            <th className="p-4">Data Fechamento</th>
                            <th className="p-4 text-right">Base Líquida</th>
                            <th className="p-4 text-right">Comissão</th>
                            <th className="p-4 text-center">Status Pagto</th>
                            <th className="p-4 text-center">Ações</th>
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
                                    <tr key={deal.id} className="hover:bg-muted/50 transition-colors group">
                                        <td className="p-4">
                                            <p className="font-bold text-foreground text-sm">{deal.title}</p>
                                            <p className="text-xs text-muted-foreground">{(deal as any).customer?.name || deal.company || 'Empresa não informada'}</p>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center text-[10px] font-bold">
                                                    {(dealOwner as any)?.avatar || (dealOwner as any)?.name?.charAt(0) || '?'}
                                                </div>
                                                <span className="text-sm text-foreground">{(dealOwner as any)?.name || 'Unknown'}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 text-sm text-muted-foreground">
                                            {deal.won_at ? new Date(deal.won_at).toLocaleDateString() : '-'}
                                        </td>
                                        <td className="p-4 text-right font-medium text-muted-foreground">
                                            {displayNetMargin.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                        </td>
                                        <td className="p-4 text-right">
                                            <span className="font-black text-emerald-400 text-sm">
                                                {displayCommission.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${commissionStatus === 'paid'
                                                ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                                                }`}>
                                                {commissionStatus === 'paid' ? 'Pago' : 'Pendente'}
                                            </span>
                                        </td>
                                        <td className="p-4 text-center">
                                            <button
                                                onClick={() => handleTogglePayment(deal)}
                                                className={`p-2 rounded-lg transition-all ${commissionStatus === 'paid'
                                                    ? 'text-muted-foreground hover:text-yellow-500 hover:bg-yellow-500/10'
                                                    : 'text-muted-foreground hover:text-blue-500 hover:bg-blue-500/10'
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
    );
}
