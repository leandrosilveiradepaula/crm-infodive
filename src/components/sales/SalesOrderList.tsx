import React, { useEffect, useState } from 'react';
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

export const SalesOrderList: React.FC = () => {
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedOrder, setSelectedOrder] = useState<SalesOrder | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        setLoading(true);
        try {
            const result = await getSalesOrders();
            if (result.success && result.data) {
                setOrders(result.data as SalesOrder[]);
            }
        } finally {
            setLoading(false);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'nf_emitida': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'entregue': return 'bg-purple-500/20 text-purple-400 border-purple-500/50';
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

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.deal?.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.deal?.customer?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">
                        Pedidos de Venda
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestão de entregas e faturamento</p>
                </div>
                <div className="flex gap-3">
                    <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <Clock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">Pendentes</p>
                            <p className="text-lg font-bold">
                                {orders.filter(o => o.status === 'pedido_gerado').length}
                            </p>
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                        <div className="p-2 bg-emerald-500/20 rounded-lg">
                            <DollarSign className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">Faturados</p>
                            <p className="text-lg font-bold">
                                {orders.filter(o => o.status === 'nf_emitida').length}
                            </p>
                        </div>
                    </div>
                    <div className="bg-card border border-border rounded-xl p-3 flex items-center gap-3">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Truck className="h-5 w-5 text-purple-500" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground uppercase">Entregues</p>
                            <p className="text-lg font-bold">
                                {orders.filter(o => o.status === 'entregue').length}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por cliente, deal ou ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all font-medium placeholder:text-muted-foreground shadow-sm"
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all appearance-none font-medium text-muted-foreground"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="pedido_gerado">Pedido Gerado</option>
                        <option value="nf_emitida">NF Emitida</option>
                        <option value="entregue">Entregue</option>
                        <option value="cliente_pagou">Cliente Pagou</option>
                        <option value="distribuidor_pagou">Distr. Pagou</option>
                        <option value="comissao_paga">Comissão Paga</option>
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                        <svg className="h-4 w-4 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <Package className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg">Nenhum pedido encontrado</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-muted sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID / Data</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cliente / Deal</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Valor Total</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">NF-e</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredOrders.map(order => (
                                <tr
                                    key={order.id}
                                    className="hover:bg-muted/50 transition-colors cursor-pointer group"
                                    onClick={() => setSelectedOrder(order)}
                                >
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-foreground">#{order.id.slice(0, 8)}</div>
                                        <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                            <Calendar className="h-3 w-3" />
                                            {new Date(order.created_at).toLocaleDateString('pt-BR')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-primary border-b border-transparent group-hover:border-primary/50 inline-block transition-colors">
                                            {order.deal?.customer?.name || 'Cliente N/A'}
                                        </div>
                                        <div className="text-xs text-muted-foreground mt-1 truncate max-w-[250px]">
                                            {order.deal?.title}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-bold text-emerald-500">
                                            {formatCurrency(Number(order.total_value))}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                            {getStatusLabel(order.status)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
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
                                                className="text-primary hover:text-primary/80 flex items-center gap-1 text-sm transition-colors focus:outline-none"
                                            >
                                                <FileText className="h-4 w-4" />
                                                Visualizar
                                            </button>
                                        ) : (
                                            <span className="text-xs text-muted-foreground italic">Pendente</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted rounded-lg">
                                            <ChevronRight className="h-5 w-5" />
                                        </button>
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
