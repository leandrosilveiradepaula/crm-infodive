import React, { useState } from 'react';
import { type SalesOrder } from '../../hooks/useSalesOrders';
import { updateSalesOrder } from '@/app/(dashboard)/sales/actions';
import {
    X,
    Package,
    Calendar,
    DollarSign,
    CheckCircle2,
    Truck,
    FileText,
    Upload,
    ArrowRight,
    Clock,
    MapPin,
    Building2,
    Save
} from 'lucide-react';
import { processInvoiceAction, getSalesDocumentSignedUrl, getSignedUrlForRawPath } from '@/app/(dashboard)/sales/actions';

interface SalesOrderDetailsProps {
    order: SalesOrder;
    onClose: () => void;
    onUpdate: () => void;
}

export const SalesOrderDetails: React.FC<SalesOrderDetailsProps> = ({ order, onClose, onUpdate }) => {
    const [loading, setLoading] = useState(false);
    const [invoiceUrl, setInvoiceUrl] = useState(order.invoice_url || '');
    const [uploading, setUploading] = useState(false);
    const [openingInvoice, setOpeningInvoice] = useState(false);

    const handleOpenInvoice = async (docPath: string) => {
        setOpeningInvoice(true);
        try {
            const signedUrl = await getSignedUrlForRawPath(docPath);
            window.open(signedUrl, '_blank');
        } catch (err: any) {
            alert(err.message || 'Não foi possível abrir o arquivo. Use a aba de Documentos.');
        } finally {
            setOpeningInvoice(false);
        }
    };

    const steps = [
        { id: 'pedido_gerado', label: 'Pedido Gerado', icon: Clock },
        { id: 'nf_emitida', label: 'NF Emitida', icon: FileText },
        { id: 'entregue', label: 'Entregue', icon: Truck },
        { id: 'cliente_pagou', label: 'Cliente Pagou', icon: CheckCircle2 },
        { id: 'distribuidor_pagou', label: 'Distr. Pagou', icon: DollarSign },
        { id: 'comissao_paga', label: 'Comissão Paga', icon: CheckCircle2 },
    ];

    const currentStepIndex = steps.findIndex(s => s.id === order.status);

    const handleStatusChange = async (newStatus: SalesOrder['status']) => {
        setLoading(true);
        try {
            const updates: Record<string, any> = { status: newStatus };
            const now = new Date().toISOString();

            if (newStatus === 'nf_emitida' && !order.billed_at) updates.billed_at = now;
            if (newStatus === 'entregue' && !order.delivered_at) updates.delivered_at = now;

            if (newStatus === 'nf_emitida' && invoiceUrl && invoiceUrl !== order.invoice_url) {
                updates.invoice_url = invoiceUrl;
            }

            await updateSalesOrder(order.id, updates);
            onUpdate();
        } finally {
            setLoading(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', file);
            formData.append('confirmSave', 'true');

            const result = await processInvoiceAction(order.id, formData);

            if (!result.success) throw new Error(result.error);

            setInvoiceUrl(result.fileUrl!);
            // updateSalesOrder already done inside processInvoiceAction when confirmSave is true
            onUpdate();

        } catch (err) {
            console.error('Error uploading invoice:', err);
            alert('Erro ao fazer upload da Nota Fiscal.');
        } finally {
            setUploading(false);
        }
    };

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-5xl h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Package className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-foreground">Pedido #{order.id.slice(0, 8)}</h2>
                            <p className="text-xs text-muted-foreground">
                                {order.deal?.customer?.name} • {new Date(order.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-hidden flex">
                    {/* Left Column: Details */}
                    <div className="flex-1 overflow-y-auto p-5 border-r border-border">
                        <div className="mb-6">
                            <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-emerald-500" />
                                Itens do Pedido
                            </h3>
                            <div className="bg-muted/10 rounded-xl border border-border overflow-hidden">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-muted text-muted-foreground uppercase text-xs">
                                        <tr>
                                            <th className="px-4 py-3">Produto</th>
                                            <th className="px-4 py-3 text-right">Qtd</th>
                                            <th className="px-4 py-3 text-right">Unitário</th>
                                            <th className="px-4 py-3 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-border text-foreground">
                                        {order.items?.map(item => (
                                            <tr key={item.id}>
                                                <td className="px-4 py-3">
                                                    <div className="font-medium text-foreground">{item.product_name}</div>
                                                    <div className="text-xs text-muted-foreground">{item.product_sku}</div>
                                                </td>
                                                <td className="px-4 py-3 text-right">{item.quantity}</td>
                                                <td className="px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                                                <td className="px-4 py-3 text-right font-medium text-foreground">
                                                    {formatCurrency(item.quantity * item.unit_price)}
                                                </td>
                                            </tr>
                                        ))}
                                        <tr className="bg-muted/20">
                                            <td colSpan={3} className="px-4 py-3 text-right font-medium text-muted-foreground">Total Geral</td>
                                            <td className="px-4 py-3 text-right font-bold text-emerald-500 text-base">
                                                {formatCurrency(Number(order.total_value))}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div>
                            <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                                <FileText className="h-4 w-4 text-primary" />
                                Nota Fiscal e Documentos
                            </h3>
                            <div className="bg-muted/10 rounded-xl border border-border p-4">
                                <div className="space-y-4">
                                    <label className="block text-sm font-medium text-muted-foreground">URL da Nota Fiscal (NF-e)</label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            value={invoiceUrl}
                                            onChange={e => setInvoiceUrl(e.target.value)}
                                            placeholder="https://..."
                                            className="flex-1 bg-background border border-border rounded-lg px-4 py-2 text-foreground focus:ring-2 focus:ring-primary/50 outline-none"
                                        />
                                        {invoiceUrl !== order.invoice_url && (
                                            <button
                                                onClick={() => handleStatusChange(order.status)} // Just save
                                                disabled={loading}
                                                className="px-4 py-2 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors"
                                            >
                                                <Save className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>

                                    <div className="relative border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-primary/50 transition-colors group">
                                        <input
                                            type="file"
                                            accept=".pdf,.xml"
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                            onChange={handleFileUpload}
                                            disabled={uploading}
                                        />
                                        <div className="flex flex-col items-center gap-2 text-muted-foreground group-hover:text-primary transition-colors">
                                            <Upload className={`h-8 w-8 ${uploading ? 'animate-bounce' : ''}`} />
                                            <span className="text-sm font-medium">
                                                {uploading ? 'Enviando...' : 'Clique ou arraste o arquivo da NF-e aqui'}
                                            </span>
                                        </div>
                                    </div>

                                    {order.invoice_url && (
                                        <button
                                            onClick={() => handleOpenInvoice(order.invoice_url!)}
                                            disabled={openingInvoice}
                                            className="block mt-2 text-xs text-primary hover:text-primary/80 underline text-center w-full disabled:opacity-50"
                                        >
                                            {openingInvoice ? 'Abrindo...' : 'Visualizar Nota Fiscal Atual'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Timeline & Actions */}
                    <div className="w-[350px] bg-muted/30 border-l border-border p-5 flex flex-col">
                        <h3 className="text-base font-semibold text-foreground mb-4">Status do Pedido</h3>

                        <div className="space-y-8 relative">
                            {/* Vertical Line */}
                            <div className="absolute left-6 top-4 bottom-4 w-0.5 bg-border"></div>

                            {steps.map((step, index) => {
                                const isCompleted = index <= currentStepIndex;
                                const isCurrent = index === currentStepIndex;
                                const isNext = index === currentStepIndex + 1;

                                return (
                                    <div key={step.id} className="relative flex items-start gap-4">
                                        <div className={`relative z-10 p-2 rounded-full border-2 transition-all duration-300 ${isCompleted
                                            ? 'bg-emerald-500 border-emerald-500 text-white'
                                            : isCurrent
                                                ? 'bg-blue-500 border-blue-500 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]'
                                                : 'bg-card border-border text-muted-foreground'
                                            }`}>
                                            <step.icon className="h-5 w-5" />
                                        </div>
                                        <div className="flex-1 pt-1">
                                            <div className="flex justify-between items-center">
                                                <h4 className={`font-semibold ${isCompleted ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                    {step.label}
                                                </h4>
                                                {isCurrent && (
                                                    <span className="text-xs uppercase font-bold text-primary bg-primary/10 px-2 py-0.5 rounded">
                                                        Atual
                                                    </span>
                                                )}
                                            </div>

                                            {/* Status specific timestamps */}
                                            {step.id === 'nf_emitida' && order.billed_at && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(order.billed_at).toLocaleDateString()}
                                                </p>
                                            )}
                                            {step.id === 'entregue' && order.delivered_at && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {new Date(order.delivered_at).toLocaleDateString()}
                                                </p>
                                            )}

                                            {/* Action Button */}
                                            {isNext && (
                                                <button
                                                    onClick={() => handleStatusChange(step.id as SalesOrder['status'])}
                                                    disabled={loading}
                                                    className="mt-3 w-full py-2 px-4 bg-muted hover:bg-muted/80 border border-border rounded-lg text-sm text-foreground hover:text-foreground transition-colors flex items-center justify-center gap-2 group"
                                                >
                                                    Avançar para {step.label}
                                                    <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-1" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {order.status === 'comissao_paga' && (
                            <div className="mt-8 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                                <CheckCircle2 className="h-8 w-8 text-emerald-500 mx-auto mb-2" />
                                <h4 className="text-emerald-600 font-bold">Comissão Recebida</h4>
                                <p className="text-sm text-emerald-600/70 mt-1">
                                    Ciclo da venda finalizado com sucesso.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
