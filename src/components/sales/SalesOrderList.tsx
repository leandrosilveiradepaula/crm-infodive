import React, { useEffect, useRef, useState } from 'react';
import { type SalesOrder } from '../../hooks/useSalesOrders';
import { getSalesOrders, getSignedUrlForRawPath } from '@/app/(dashboard)/sales/actions';
import { toast } from 'sonner';
import {
    Package,
    Calendar,
    DollarSign,
    Truck,
    CheckCircle2,
    Clock,
    AlertCircle,
    ChevronRight,
    FileText,
    Search,
    Filter
} from 'lucide-react';
import { SalesOrderDetails } from './SalesOrderDetails';
import { salesOrderMatchesFilter, validateSalesOrderList } from '../../lib/sales-order-list-integrity';

export const SalesOrderList: React.FC = () => {
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const loadVersion = useRef(0);
    const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        const version = ++loadVersion.current;
        setLoading(true);
        setError(null);
        try {
            const result = await getSalesOrders();
            if (!result.success) throw new Error('Não foi possível consultar pedidos de venda.');
            const rows = validateSalesOrderList(result.data);
            if (version === loadVersion.current) setOrders(rows);
        } catch {
            if (version === loadVersion.current) {
                // A failure is not a genuine empty list and must not leave stale totals.
                setOrders([]);
                setError('Falha ao carregar os pedidos. Tente novamente.');
            }
        } finally {
            if (version === loadVersion.current) setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'nf_emitida': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'entregue': return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
            case 'cliente_pagou': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
            case 'distribuidor_pagou': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
            case 'comissao_paga': return 'bg-gray-500/20 text-muted-foreground border-gray-500/50';
            case 'pedido_gerado': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
            default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'pedido_gerado': return 'Pedido Gerado';
            case 'nf_emitida': return 'NF Emitida';
            case 'entregue': return 'Entregue';
            case 'cliente_pagou': return 'Cliente Pagou';
            case 'distribuidor_pagou': return 'Distr. Pagou';
            case 'comissao_paga': return 'Comissão Paga';
            default: return 'Pedido Gerado';
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const filteredOrders = orders.filter(order =>
        salesOrderMatchesFilter(order, searchTerm, statusFilter));

    return (
        <div className="h-full flex flex-col bg-background text-foreground p-5 overflow-hidden">
            <div className="flex justify-between items-center mb-5">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">
                        Pedidos de Venda
                    </h1>
                    <p className="text-xs text-muted-foreground mt-0.5 font-medium uppercase tracking-wider">Gestão de entregas e faturamento</p>
                </div>
                <div className="flex gap-2">
                    <div className="bg-card border border-border rounded-xl p-2.5 flex items-center gap-2.5">
                        <div className="p-1.5 bg-primary/10 rounded-lg">
                            <Clock className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Pendentes</p>
                            <p className="text-base font-black leading-tight">
                                {error ? '—' : orders.filter(o => o.status === 'pedido_gerado').length}
                            </p>
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-2.5 flex items-center gap-2.5">
                        <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                            <DollarSign className="h-4 w-4 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Faturados</p>
                            <p className="text-base font-black leading-tight">
                                {error ? '—' : orders.filter(o => o.status === 'nf_emitida').length}
                            </p>
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-2.5 flex items-center gap-2.5">
                        <div className="p-1.5 bg-teal-500/20 rounded-lg">
                            <Truck className="h-4 w-4 text-teal-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Entregues</p>
                            <p className="text-base font-black leading-tight">
                                {error ? '—' : orders.filter(o => o.status === 'entregue').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-3 mb-4">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, deal ou ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium placeholder:text-muted-foreground shadow-sm"
                    />
                </div>
                <div className="relative min-w-[180px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl pl-9 pr-3 py-2 text-sm text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all appearance-none font-medium text-muted-foreground"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="pedido_gerado">Pedido Gerado</option>
                        <option value="nf_emitida">NF Emitida</option>
                        <option value="entregue">Entregue</option>
                        <option value="cliente_pagou">Cliente Pagou</option>
                        <option value="distribuidor_pagou">Distr. Pagou</option>
                        <option value="comissao_paga">Comissão Paga</option>
                    </select>
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="h-3 w-3 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-card border border-border rounded-2xl shadow-xl">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : error ? (
                    <div role="alert" className="flex min-h-64 flex-col items-center justify-center gap-3 px-6 text-center">
                        <AlertCircle className="h-10 w-10 text-destructive" aria-hidden="true" />
                        <p className="font-semibold text-foreground">{error}</p>
                        <button
                            type="button"
                            onClick={() => void loadOrders()}
                            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:bg-muted"
                        >
                            Tentar novamente
                        </button>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Package className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg">Nenhum pedido encontrado</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-muted sticky top-0 z-10">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-black text-muted-foreground uppercase tracking-widest">ID / Data</th>
                                <th className="px-4 py-3 text-left text-xs font-black text-muted-foreground uppercase tracking-widest">Cliente / Deal</th>
                                <th className="px-4 py-3 text-left text-xs font-black text-muted-foreground uppercase tracking-widest">Valor Total</th>
                                <th className="px-4 py-3 text-left text-xs font-black text-muted-foreground uppercase tracking-widest">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-black text-muted-foreground uppercase tracking-widest">NF-e</th>
                                <th className="px-4 py-3 text-right text-xs font-black text-muted-foreground uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredOrders.map(order => (
                                <tr
                                    key={order.id}
                                    className="hover:bg-muted/50 transition-colors cursor-pointer group"
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <td className="px-4 py-3 whitespace-nowrap border-r border-border/10">
                                        <div className="text-[13px] font-black text-foreground leading-none">#{order.id.slice(0, 8)}</div>
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-bold">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-[13px] font-bold text-primary border-b border-transparent group-hover:border-primary/50 inline-block transition-colors leading-none">
                                            {order.deal?.customer?.name || 'Cliente N/A'}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[250px] font-medium opacity-80">
                                            {order.deal?.title}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <div className="text-[14px] font-black text-emerald-500 tracking-tighter">
                                            {formatCurrency(Number(order.total_value))}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-lg text-xs font-black uppercase tracking-widest border ${getStatusColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {order.invoice_url ? (
                                            <button
                                                onClick={async (e) => {
                                                    e.stopPropagation();
                                                    const toastId = toast.loading('Gerando link seguro...');
                                                    try {
                                                        const signedUrl = await getSignedUrlForRawPath(order.invoice_url!);
                                                        toast.dismiss(toastId);
                                                        window.open(signedUrl, '_blank');
                                                    } catch (err: any) {
                                                        toast.dismiss(toastId);
                                                        toast.error(err.message || 'Erro ao abrir arquivo');
                                                    }
                                                }}
                                                className="text-primary hover:text-primary/80 flex items-center gap-1 text-xs font-bold uppercase tracking-wider transition-colors focus:outline-none"
                                            >
                                                <FileText className="h-3.5 w-3.5" />
                                                Visualizar
                                            </button>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic font-medium">Pendente</span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-right">
                                        <div className="text-muted-foreground group-hover:text-primary transition-all p-1 group-hover:translate-x-1">
                                            <ChevronRight className="h-4 w-4" />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {selectedOrder && (
                <SalesOrderDetails
                    order={selectedOrder}
                    onClose={() => setSelectedOrder(null)}
                    onUpdate={() => {
                        loadOrders();
                        // Also update selected order? Will be handled by next render if reference logic holds, 
                        // but better to reload or update local state.
                        setSelectedOrder(null); // Close for now or refetch
                    }}
                />
            )}
        </div>
    );
};
