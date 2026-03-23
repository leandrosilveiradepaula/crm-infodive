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
}

interface CommissionsTabProps {
    orders: SalesOrder[];
    onUpdateStatus: (id: string, status: string) => Promise<boolean>;
}

export function CommissionsTab({ orders, onUpdateStatus }: CommissionsTabProps) {
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid'>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const allCommissions = useMemo(() => {
        return orders.flatMap(order => (order.commissions || []).map(comm => ({
            ...comm,
            orderId: order.id,
            customerName: order.deal?.customer?.name || 'Cliente Desconhecido',
            dealTitle: order.deal?.title,
            userName: order.user?.name || 'Vendedor'
        })));
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
                <div className="rounded-xl border border-border bg-card/50 p-5 group hover:border-primary/30 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-xl bg-primary/10 group-hover:scale-110 transition-transform"><TrendingUp className="w-4 h-4 text-primary" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Total Gerado</span>
                    </div>
                    <div className="text-2xl font-black text-foreground">{formatCurrency(totalInvoiced)}</div>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-5 group hover:border-amber-500/30 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-xl bg-amber-500/10 group-hover:scale-110 transition-transform"><Clock className="w-4 h-4 text-amber-500" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Aguardando Pagto</span>
                    </div>
                    <div className="text-2xl font-black text-foreground">{formatCurrency(totalPending)}</div>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-5 group hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 group-hover:scale-110 transition-transform"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Pago ao Vendedor</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-500">{formatCurrency(totalPaid)}</div>
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
                
                <div className="flex bg-muted/50 p-1 rounded-xl border border-border overflow-hidden">
                    {(['all', 'pending', 'paid'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${filter === f
                                ? 'bg-background text-primary shadow-sm border border-border'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`}
                        >
                            {f === 'all' ? 'Tudo' : f === 'pending' ? 'Pendentes' : 'Pagos'}
                        </button>
                    ))}
                </div>
            </FilterBar>

            {/* Table */}
            <div className="border border-border rounded-2xl bg-card/30 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-border hover:bg-transparent text-[10px] font-black uppercase tracking-widest">
                            <TableHead className="py-5">Status</TableHead>
                            <TableHead className="py-5">Vendedor</TableHead>
                            <TableHead className="py-5">Cliente / Negócio</TableHead>
                            <TableHead className="py-5 text-right">Valor</TableHead>
                            <TableHead className="py-5">Previsão</TableHead>
                            <TableHead className="py-5 text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-20">
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
                                            className={`text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                                                c.status === 'paid' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 
                                                'bg-amber-500/5 text-amber-500 border-amber-500/20'
                                            }`}
                                        >
                                            {c.status === 'paid' ? 'Liquidado' : 'Pendente'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="flex items-center gap-2">
                                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-black text-primary border border-primary/20">
                                                {c.userName.substring(0, 2).toUpperCase()}
                                            </div>
                                            <span className="text-sm font-black text-foreground tracking-tight">{c.userName}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="flex flex-col">
                                            <span className="text-[11px] font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{c.customerName}</span>
                                            <span className="text-[9px] text-muted-foreground font-black uppercase mt-0.5">{c.dealTitle}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="py-5 text-right">
                                        <span className="text-sm font-black text-foreground tracking-tighter">{formatCurrency(c.amount)}</span>
                                    </TableCell>
                                    <TableCell className="py-5">
                                        <div className="flex items-center gap-2 text-[10px] font-black tracking-tighter uppercase text-muted-foreground">
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
                                                    className="h-8 gap-1.5 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-xl px-3"
                                                    onClick={() => onUpdateStatus(c.id, 'paid')}
                                                >
                                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase">Liquidar</span>
                                                </Button>
                                            ) : (
                                                <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-8 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl px-3"
                                                    onClick={() => onUpdateStatus(c.id, 'pending')}
                                                >
                                                    <Undo2 className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase">Reverter</span>
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
