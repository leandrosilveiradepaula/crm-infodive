'use client';

import React, { useState, useMemo } from 'react';
import { SalesOrder } from '@/hooks/useSalesOrders';
import { formatCurrency } from '@/utils/format';
import {
    DollarSign,
    Calendar,
    CheckCircle2,
    Clock,
    User,
    ArrowUpRight,
    TrendingUp,
    Search,
    Undo2
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';
import { FilterBar } from '@/components/layout/FilterBar';
import { ThemeInput } from '@/components/ui/theme/ThemeComponents';

interface CommissionItem {
    id: string;
    amount: number;
    due_date: string;
    status: string;
    orderId: string;
    customerName: string;
    dealTitle?: string;
    userName: string;
    seller_commission: number;
    seller_rate: number;
}

interface CommissionsTabProps {
    orders: SalesOrder[];
    onUpdateStatus: (id: string, status: string) => Promise<boolean>;
}

export function CommissionsTab({ orders, onUpdateStatus }: CommissionsTabProps) {
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const allCommissions = useMemo(() => {
        return orders.map(order => {
            const deductionRate = (order.deal as any)?.commission_deduction || 18; // Default to 18 se não encontrar
            // Margem da Empresa
            const companyMargin = order.total_value * (deductionRate / 100);

            // Comissão do Vendedor
            const rules = order.user?.commission_rules;
            let sellerRate = 0;
            if (rules) {
                sellerRate = Number(rules?.hardware?.base || rules?.software?.base || rules?.services?.base || 0);
            }
            const sellerCommission = companyMargin * (sellerRate / 100);

            return {
                id: order.id,
                amount: companyMargin, // A "amount" principal vira a Margem da Empresa para os KPIs
                seller_commission: sellerCommission,
                seller_rate: sellerRate,
                due_date: order.updated_at || order.created_at,
                // Assume pago se marcado ou se o pedido concluiu
                status: order.commission_status === 'paid' || order.status === 'comissao_paga' ? 'paid' : 'pending',
                orderId: order.id,
                customerName: order.deal?.customer?.name || 'Cliente Desconhecido',
                dealTitle: order.deal?.title || 'Pedido Vazio',
                userName: order.user?.name || 'Vendedor'
            };
        });
    }, [orders]);

    const filtered = useMemo(() => {
        return allCommissions.filter(c => {
            const matchesFilter = filter === 'all' || c.status === filter;
            const matchesSearch = !searchTerm ||
                c.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.dealTitle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                c.userName.toLowerCase().includes(searchTerm.toLowerCase());

            return matchesFilter && matchesSearch;
        }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime());
    }, [allCommissions, filter, searchTerm]);

    const totalInvoiced = allCommissions.reduce((acc, curr) => acc + curr.amount, 0);
    const totalPaid = allCommissions.filter(c => c.status === 'paid').reduce((acc, curr) => acc + curr.amount, 0);
    const totalPending = allCommissions.filter(c => c.status !== 'paid').reduce((acc, curr) => acc + curr.amount, 0);

    return (
        <div className="space-y-6">
            {/* KPI Section */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-[var(--radius-panel)] border border-border bg-card/50 p-5 group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-[var(--radius-panel)] bg-primary/10 group-hover:scale-110 transition-transform"><TrendingUp className="w-4 h-4 text-primary" /></div>
                        <span className="text-metadata-ui font-black uppercase tracking-widest text-muted-foreground">Margem (Empresa)</span>
                    </div>
                    <div className="text-page-title font-black text-foreground">{formatCurrency(totalInvoiced)}</div>
                </div>
                <div className="rounded-[var(--radius-panel)] border border-border bg-card/50 p-5 group hover:border-warning/30 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-[var(--radius-panel)] bg-warning/10 group-hover:scale-110 transition-transform"><Clock className="w-4 h-4 text-warning-readable" /></div>
                        <span className="text-metadata-ui font-black uppercase tracking-widest text-muted-foreground">Aguardando (Distribuidor)</span>
                    </div>
                    <div className="text-page-title font-black text-foreground">{formatCurrency(totalPending)}</div>
                </div>
                <div className="rounded-[var(--radius-panel)] border border-border bg-card/50 p-5 group hover:border-success/30 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-[var(--radius-panel)] bg-success/10 group-hover:scale-110 transition-transform"><CheckCircle2 className="w-4 h-4 text-success-readable" /></div>
                        <span className="text-metadata-ui font-black uppercase tracking-widest text-muted-foreground">Recebido (Empresa)</span>
                    </div>
                    <div className="text-page-title font-black text-success-readable">{formatCurrency(totalPaid)}</div>
                </div>
            </div>

            {/* Filter Bar */}
            <FilterBar>
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <ThemeInput
                        placeholder="Buscar por vendedor ou negócio..."
                        className="pl-11 bg-background/50 border-border focus:bg-background transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex bg-muted/50 p-1 rounded-[var(--radius-panel)] border border-border overflow-hidden">
                    {(['all', 'pending', 'paid'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-[var(--radius-control)] text-metadata-ui font-black uppercase tracking-widest transition-all ${filter === f
                                ? 'bg-background text-primary shadow-control-ui border border-border'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`}
                        >
                            {f === 'all' ? 'Tudo' : f === 'pending' ? 'Pendentes' : 'Pagos'}
                        </button>
                    ))}
                </div>
            </FilterBar>

            {/* Table */}
            <div className="border border-border rounded-[var(--radius-panel)] bg-card/30 overflow-hidden shadow-control-ui">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-border hover:bg-transparent text-metadata-ui font-black uppercase tracking-widest">
                            <TableHead className="py-5">Status</TableHead>
                            <TableHead className="py-5">Vendedor</TableHead>
                            <TableHead className="py-5">Cliente / Negócio</TableHead>
                            <TableHead className="py-5 text-right">Margem (Empresa)</TableHead>
                            <TableHead className="py-5 text-right">Comissão (Vendedor)</TableHead>
                            <TableHead className="py-5">Previsão</TableHead>
                            <TableHead className="py-5 text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={7} className="py-20">
                                    <PremiumEmptyState
                                        icon={DollarSign}
                                        title="Nenhuma comissão encontrada"
                                        description={searchTerm || filter !== 'all'
                                            ? "Não encontramos comissões com os filtros aplicados."
                                            : "Ainda não há comissões geradas para este período."
                                        }
                                        variant="compact"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((c) => (
                                <TableRow key={c.id} className="border-border/50 hover:bg-primary/[0.02] transition-colors group">
                                    <TableCell className="py-5">
                                        <Badge
                                            variant="outline"
                                            className={`text-metadata-ui font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                                                c.status === 'paid' ? 'bg-success/5 text-success-readable border-success/20' :
                                                'bg-warning/5 text-warning-readable border-warning/20'
                                            }`}
                                        >
                                            {c.status === 'paid' ? 'Liquidado' : 'Pendente'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-metadata-ui font-black text-primary border border-primary/20">
                                                {c.userName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-body-ui font-black text-foreground tracking-tight">{c.userName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="flex flex-col">
                                            <span className="text-metadata-ui font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{c.customerName}</span>
                                            <span className="text-metadata-ui text-muted-foreground font-black uppercase mt-0.5">{c.dealTitle}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-body-ui font-black text-foreground tracking-tighter">{formatCurrency(c.amount)}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 text-right">
                                        <div className="flex flex-col items-end">
                                            <span className="text-body-ui font-black text-success-readable tracking-tighter">{formatCurrency(c.seller_commission)}</span>
                                            {c.seller_rate > 0 && <span className="text-metadata-ui text-muted-foreground font-black opacity-80 mt-0.5 uppercase">Aprox {c.seller_rate.toFixed(1)}%</span>}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="flex items-center gap-2 text-metadata-ui font-black tracking-tighter uppercase text-muted-foreground">
                                            <Calendar className="w-4 h-4 opacity-50" />
                                            {new Date(c.due_date).toLocaleDateString()}
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 text-right">
                                        <div className="flex justify-end gap-1 translate-x-1 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                            {c.status !== 'paid' ? (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 gap-1.5 text-success-readable hover:text-success-readable hover:bg-success/10 rounded-[var(--radius-panel)] px-3"
                                                    onClick={() => onUpdateStatus(c.id, 'paid')}
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span className="text-metadata-ui font-black uppercase">Liquidar</span>
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-[var(--radius-panel)] px-3"
                                                    onClick={() => onUpdateStatus(c.id, 'pending')}
                                                >
                                                    <Undo2 className="w-3.5 h-3.5" />
                                                    <span className="text-metadata-ui font-black uppercase">Reverter</span>
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
