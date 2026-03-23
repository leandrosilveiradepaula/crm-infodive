'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useSalesOrders, SalesOrder } from '@/hooks/useSalesOrders';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DashboardTab } from './tabs/DashboardTab';
import { OrdersTab } from './tabs/OrdersTab';
import { InstallmentsTab } from './tabs/InstallmentsTab';
import { CommissionsTab } from './tabs/CommissionsTab';
import { Activity, LayoutDashboard, Package, CreditCard, Coins } from 'lucide-react';

export default function SalesList() {
    const { fetchSalesOrders, updateSalesOrder, updateInstallment, loading } = useSalesOrders();
    const [orders, setOrders] = useState<SalesOrder[]>([]);
    const [activeTab, setActiveTab] = useState('dashboard');
    const [ordersFilter, setOrdersFilter] = useState<string | null>(null);

    const loadOrders = useCallback(async () => {
        const data = await fetchSalesOrders();
        setOrders(data);
    }, [fetchSalesOrders]);

    useEffect(() => {
        loadOrders();
    }, [loadOrders]);

    const handleStatusUpdate = async (id: string, newStatus: SalesOrder['status']) => {
        const updated = await updateSalesOrder(id, { status: newStatus });
        if (updated) {
            setOrders(prev => prev.map(o => o.id === id ? { ...o, status: newStatus } : o));
        }
    };

    const handleInstallmentUpdate = async (id: string, status: string) => {
        return await updateInstallment(id, status);
    };

    const handleCommissionUpdate = async (id: string, status: string) => {
        const updated = await updateSalesOrder(id, { commission_status: status as any });
        if (updated) {
            setOrders(prev => prev.map(o => o.id === id ? { ...o, commission_status: status as any } : o));
        }
        return !!updated;
    };

    const navigateToOrders = (filter?: string) => {
        setOrdersFilter(filter || null);
        setActiveTab('orders');
    };

    if (loading && orders.length === 0) {
        return (
            <div className="flex items-center justify-center p-12">
                <Activity className="animate-spin text-primary w-8 h-8" />
            </div>
        );
    }

    return (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList>
                <TabsTrigger value="dashboard" className="gap-2">
                    <LayoutDashboard className="w-4 h-4" />
                    Visão Geral
                </TabsTrigger>
                <TabsTrigger value="orders" className="gap-2">
                    <Package className="w-4 h-4" />
                    Pedidos
                    {orders.length > 0 && (
                        <span className="ml-1 px-1.5 py-0.5 rounded-md bg-primary/20 text-[9px] font-black">{orders.length}</span>
                    )}
                </TabsTrigger>
                <TabsTrigger value="installments" className="gap-2">
                    <CreditCard className="w-4 h-4" />
                    Financeiro
                </TabsTrigger>
                <TabsTrigger value="commissions" className="gap-2">
                    <Coins className="w-4 h-4" />
                    Comissões
                </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
                <DashboardTab
                    orders={orders}
                    onNavigateToOrders={navigateToOrders}
                />
            </TabsContent>

            <TabsContent value="orders">
                <OrdersTab
                    orders={orders}
                    onStatusUpdate={handleStatusUpdate}
                    onInstallmentUpdate={handleInstallmentUpdate}
                    onReload={loadOrders}
                    initialFilter={ordersFilter}
                />
            </TabsContent>

            <TabsContent value="installments">
                <InstallmentsTab 
                    orders={orders}
                    onUpdateStatus={handleInstallmentUpdate}
                />
            </TabsContent>

            <TabsContent value="commissions">
                <CommissionsTab
                    orders={orders}
                    onUpdateStatus={handleCommissionUpdate}
                />
            </TabsContent>
        </Tabs>
    );
}
