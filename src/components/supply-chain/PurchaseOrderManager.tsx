import React, { useEffect, useState } from 'react';
import { usePurchaseOrders, type PurchaseOrder } from '../../hooks/usePurchaseOrders';
import {
    ShoppingBag,
    Calendar,
    Truck,
    CheckCircle2,
    Clock,
    AlertCircle,
    Search,
    Filter,
    TrendingUp,
    DollarSign,
    AlertTriangle
} from 'lucide-react';
import { ORDER_STATUS } from '@/lib/constants';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    Cell
} from 'recharts';

export const PurchaseOrderManager: React.FC = () => {
    const { fetchPurchaseOrders, updatePurchaseOrder, loading } = usePurchaseOrders();
    const [orders, setOrders] = useState<PurchaseOrder[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('all');
    const [showDashboard, setShowDashboard] = useState(true);

    useEffect(() => {
        loadOrders();
    }, []);

    const loadOrders = async () => {
        const data = await fetchPurchaseOrders();
        setOrders(data);
    };

    const handleStatusChange = async (id: string, newStatus: PurchaseOrder['status']) => {
        await updatePurchaseOrder(id, { status: newStatus });
        loadOrders();
    };

    const filteredOrders = orders.filter(order => {
        const matchesSearch =
            order.distributor?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.sales_order?.deal?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.id.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    // --- KPI CALCULATIONS ---
    const backlogOrders = orders.filter(o => [ORDER_STATUS.PENDING, 'sent', 'confirmed'].includes(o.status));
    const backlogValue = backlogOrders.reduce((sum, o) => sum + (o.sales_order?.total_value || 0), 0);

    // Alert logic: confirmed but past delivery date
    const overdueOrders = orders.filter(o => {
        if (o.status === ORDER_STATUS.DELIVERED || o.status === ORDER_STATUS.CANCELLED) return false;
        if (!o.expected_delivery_date) return false;
        return new Date(o.expected_delivery_date) < new Date();
    });

    const statusDistribution = [
        { name: 'Rascunho', value: orders.filter(o => o.status === 'draft').length, color: '#6b7280' },
        { name: 'Enviado', value: orders.filter(o => o.status === 'sent').length, color: '#3b82f6' },
        { name: 'Confirmado', value: orders.filter(o => o.status === 'confirmed').length, color: '#8b5cf6' },
        { name: 'Entregue', value: orders.filter(o => o.status === ORDER_STATUS.DELIVERED).length, color: '#10b981' },
    ].filter(i => i.value > 0);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'sent': return 'bg-blue-500/20 text-blue-400 border-blue-500/50';
            case 'confirmed': return 'bg-teal-500/20 text-teal-400 border-teal-500/50';
            case ORDER_STATUS.DELIVERED: return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
            case ORDER_STATUS.CANCELLED: return 'bg-red-500/20 text-red-400 border-red-500/50';
            default: return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/50';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'sent': return 'Enviado';
            case 'confirmed': return 'Confirmado';
            case ORDER_STATUS.DELIVERED: return 'Entregue';
            case ORDER_STATUS.CANCELLED: return 'Cancelado';
            default: return 'Rascunho';
        }
    };

    return (
        <div className="h-full flex flex-col bg-background text-foreground p-6 overflow-hidden">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-teal-400 to-pink-400">
                        Supply Chain Control Tower
                    </h1>
                    <p className="text-muted-foreground mt-1">Gestão inteligente de compras e entregas</p>
                </div>
                <button
                    onClick={() => setShowDashboard(!showDashboard)}
                    className="px-4 py-2 bg-card border border-border rounded-xl hover:bg-muted/50 transition-colors flex items-center gap-2"
                >
                    <TrendingUp className="h-4 w-4 text-teal-500" />
                    {showDashboard ? 'Ocultar KPIs' : 'Ver KPIs'}
                </button>
            </div>

            {showDashboard && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8 animate-in slide-in-from-top-4 duration-500">
                    {/* KPI 1: Total Backlog Value */}
                    <div className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <DollarSign className="h-24 w-24 text-teal-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-teal-500/20 rounded-lg">
                                    <ShoppingBag className="h-5 w-5 text-teal-500" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">Valor em Backlog</span>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground tracking-tight">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(backlogValue)}
                            </h3>
                            <p className="text-xs text-teal-500 mt-1 font-medium">
                                {backlogOrders.length} pedidos pendentes
                            </p>
                        </div>
                    </div>

                    {/* KPI 2: Overdue Orders */}
                    <div className="bg-card border border-border p-6 rounded-2xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                            <AlertCircle className="h-24 w-24 text-red-500" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-2 bg-red-500/20 rounded-lg">
                                    <Clock className="h-5 w-5 text-red-500" />
                                </div>
                                <span className="text-sm font-medium text-muted-foreground">Pedidos em Atraso</span>
                            </div>
                            <h3 className="text-2xl font-bold text-foreground tracking-tight">
                                {overdueOrders.length}
                            </h3>
                            {overdueOrders.length > 0 ? (
                                <p className="text-xs text-red-500 mt-1 font-medium bg-red-500/10 inline-block px-2 py-0.5 rounded-full animate-pulse">
                                    Ação Necessária
                                </p>
                            ) : (
                                <p className="text-xs text-emerald-500 mt-1 font-medium">Tudo em dia!</p>
                            )}
                        </div>
                    </div>

                    {/* KPI 3: Status Distribution Chart */}
                    <div className="col-span-2 bg-card border border-border p-4 rounded-2xl flex items-center justify-between">
                        <div className="h-full w-full min-h-[100px]">
                            <ResponsiveContainer width="100%" height={100}>
                                <BarChart data={statusDistribution} layout="vertical" margin={{ left: 20 }}>
                                    <XAxis type="number" hide />
                                    <YAxis dataKey="name" type="category" width={80} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{ backgroundColor: 'hsl(var(--popover))', borderColor: 'hsl(var(--border))', color: 'hsl(var(--popover-foreground))' }}
                                        cursor={{ fill: 'hsl(var(--muted)/0.5)' }}
                                    />
                                    <Bar dataKey="value" radius={[0, 4, 4, 0]} barSize={16}>
                                        {statusDistribution.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                        <div className="ml-4 min-w-[120px]">
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Resumo</p>
                            {statusDistribution.map(item => (
                                <div key={item.name} className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-muted-foreground flex items-center gap-2">
                                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                        {item.name}
                                    </span>
                                    <span className="font-bold text-foreground">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Main Content Area */}
            <div className="flex gap-4 mb-6">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Buscar por distribuidor, deal, SKU ou ID..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all font-medium placeholder:text-muted-foreground shadow-sm"
                    />
                </div>
                <div className="relative min-w-[200px]">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                    <select
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value)}
                        className="w-full bg-card border border-border rounded-xl pl-10 pr-4 py-3 text-foreground focus:ring-2 focus:ring-teal-500/50 focus:border-teal-500/50 transition-all appearance-none font-medium text-muted-foreground"
                    >
                        <option value="all">Todos os Status</option>
                        <option value="draft">Rascunho</option>
                        <option value="sent">Enviado</option>
                        <option value="confirmed">Confirmado</option>
                        <option value="delivered">Entregue</option>
                        <option value="cancelled">Cancelado</option>
                    </select>
                </div>
            </div>

            <div className="flex-1 overflow-auto bg-card border border-border rounded-2xl shadow-xl">
                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                    </div>
                ) : filteredOrders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <ShoppingBag className="h-16 w-16 mb-4 opacity-20" />
                        <p className="text-lg">Nenhum pedido de compra encontrado</p>
                    </div>
                ) : (
                    <table className="w-full">
                        <thead className="bg-muted sticky top-0 z-10">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">ID / Data</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Distribuidor</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Venda Relacionada</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Previsão Entrega</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredOrders.map(order => {
                                const isLate = order.expected_delivery_date && new Date(order.expected_delivery_date) < new Date() && order.status !== 'delivered' && order.status !== 'cancelled';
                                return (
                                    <tr
                                        key={order.id}
                                        className="hover:bg-muted/50 transition-colors cursor-pointer group"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-foreground">#{order.id.slice(0, 8)}</div>
                                            <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                {new Date(order.created_at).toLocaleDateString()}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm font-medium text-foreground">
                                                {order.distributor?.name || 'N/A'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="text-sm text-muted-foreground">
                                                {order.sales_order?.deal?.title || 'N/A'}
                                            </div>
                                            <div className="text-xs text-blue-500 mt-1">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(order.sales_order?.total_value || 0)}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(order.status)}`}>
                                                {getStatusLabel(order.status)}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {order.expected_delivery_date ? (
                                                <div className={`text-sm flex items-center gap-2 ${isLate ? 'text-red-500 font-bold' : 'text-foreground'}`}>
                                                    {isLate ? <AlertTriangle className="h-4 w-4" /> : <Calendar className="h-4 w-4 text-muted-foreground" />}
                                                    {new Date(order.expected_delivery_date).toLocaleDateString()}
                                                </div>
                                            ) : (
                                                <span className="text-xs text-muted-foreground italic">Não informada</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            <div className="flex justify-end gap-2">
                                                {order.status === 'draft' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'sent'); }}
                                                        className="p-1 px-2 bg-blue-500/10 text-blue-500 rounded text-xs hover:bg-blue-500/20"
                                                    >
                                                        Enviar
                                                    </button>
                                                )}
                                                {order.status === 'sent' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'confirmed'); }}
                                                        className="p-1 px-2 bg-teal-500/10 text-teal-500 rounded text-xs hover:bg-teal-500/20"
                                                    >
                                                        Confirmar
                                                    </button>
                                                )}
                                                {order.status === 'confirmed' && (
                                                    <button
                                                        onClick={(e) => { e.stopPropagation(); handleStatusChange(order.id, 'delivered'); }}
                                                        className="p-1 px-2 bg-emerald-500/10 text-emerald-500 rounded text-xs hover:bg-emerald-500/20"
                                                    >
                                                        Receber
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
