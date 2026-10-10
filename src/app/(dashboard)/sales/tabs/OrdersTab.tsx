'use client';

import React, { useState } from 'react';
import { SalesOrder } from '@/hooks/useSalesOrders';
import { formatCurrency } from '@/utils/format';
import { processInvoiceAction, getSalesOrderDocuments, uploadSalesOrderDocument, getSalesDocumentSignedUrl, deleteSalesDocument } from '../actions';
import { DocumentsTab } from '@/components/shared/DocumentsTab';
import { toast } from 'sonner';
import {
    FileText,
    Truck,
    CheckCircle2,
    CreditCard,
    DollarSign,
    ChevronRight,
    MoreVertical,
    FileCheck,
    User,
    Loader2,
    Check,
    Sparkles,
    Eye,
    RotateCcw,
    Upload,
    ShoppingBag,
    Search,
    FolderOpen
} from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle
} from '@/components/ui/dialog';
import {
    Card,
    CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { FilterBar } from '@/components/layout/FilterBar';
import { ThemeInput } from '@/components/ui/theme/ThemeComponents';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';

const STATUS_CONFIG = {
    pedido_gerado: { label: 'Pedido Gerado', color: 'bg-blue-500/10 text-blue-500', icon: FileText },
    nf_emitida: { label: 'NF Emitida', color: 'bg-teal-500/10 text-teal-500', icon: FileCheck },
    entregue: { label: 'Entregue', color: 'bg-orange-500/10 text-orange-500', icon: Truck },
    cliente_pagou: { label: 'Cliente Pagou', color: 'bg-emerald-500/10 text-emerald-500', icon: CreditCard },
    distribuidor_pagou: { label: 'Distr. Pagou', color: 'bg-blue-500/10 text-blue-500', icon: DollarSign },
    comissao_paga: { label: 'Comissão Paga', color: 'bg-green-500/10 text-green-500', icon: CheckCircle2 },
};

interface OrdersTabProps {
    orders: SalesOrder[];
    onStatusUpdate: (id: string, status: SalesOrder['status']) => Promise<void>;
    onInstallmentUpdate: (id: string, status: string) => Promise<boolean>;
    onReload: () => Promise<void>;
    initialFilter?: string | null;
}

export function OrdersTab({ orders, onStatusUpdate, onInstallmentUpdate, onReload, initialFilter }: OrdersTabProps) {
    const [filterStatus, setFilterStatus] = useState<SalesOrder['status'] | 'active' | null>(
        (initialFilter as any) || null
    );
    const [searchTerm, setSearchTerm] = useState('');
    const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

    // Upload Modal State
    const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
    const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
    const [uploadingInvoice, setUploadingInvoice] = useState(false);
    const [invoiceFile, setInvoiceFile] = useState<File | null>(null);
    const [capturedData, setCapturedData] = useState<{
        number: string;
        date: string;
        total: number;
        issuer: string;
        boletos?: { dueDate: string; amount: number }[];
    } | null>(null);

    const filteredOrders = orders.filter(order => {
        const matchesStatus = !filterStatus || 
            (filterStatus === 'active' ? order.status !== 'comissao_paga' : order.status === filterStatus);
        
        const matchesSearch = !searchTerm || 
            order.deal?.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            order.deal?.customer?.name?.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesStatus && matchesSearch;
    });

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setInvoiceFile(file);
        setCapturedData(null);
        setUploadingInvoice(true);

        if (file.name.toLowerCase().endsWith('.xml')) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const text = event.target?.result as string;
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(text, "text/xml");

                    const findTag = (doc: Document | Element, tagName: string): string | null => {
                        const all = doc.querySelectorAll('*');
                        const tag = Array.from(all).find(el => el.localName.toLowerCase() === tagName.toLowerCase());
                        return tag ? tag.textContent : null;
                    };

                    const findInParent = (parentTag: string, childTag: string): string | null => {
                        const all = xmlDoc.querySelectorAll('*');
                        const parent = Array.from(all).find(el => el.localName.toLowerCase() === parentTag.toLowerCase());
                        if (parent) {
                            const children = parent.querySelectorAll('*');
                            const child = Array.from(children).find(el => el.localName.toLowerCase() === childTag.toLowerCase());
                            return child ? child.textContent : null;
                        }
                        return null;
                    };

                    let nNF = findTag(xmlDoc, 'nNF');
                    let dhEmi = findTag(xmlDoc, 'dhEmi') || findTag(xmlDoc, 'dEmi');
                    let vNF = findTag(xmlDoc, 'vNF');
                    let xNome = findInParent('emit', 'xNome') || findTag(xmlDoc, 'xNome');

                    const getRegex = (tag: string) => {
                        const regex = new RegExp(`<[^>:]*:?${tag}[^>]*>([^<]+)</[^>:]*:?${tag}>`, 'i');
                        return text.match(regex)?.[1] || null;
                    };

                    nNF = nNF || getRegex('nNF');
                    dhEmi = dhEmi || getRegex('dhEmi') || getRegex('dEmi');
                    vNF = vNF || getRegex('vNF');
                    xNome = xNome || getRegex('xNome');

                    if (!nNF) {
                        toast.error('Número da NF não encontrado no XML.');
                        setUploadingInvoice(false);
                        return;
                    }

                    let dateLabel = '---';
                    if (dhEmi) {
                        try {
                            const dateObj = new Date(dhEmi);
                            if (!isNaN(dateObj.getTime())) {
                                dateLabel = dateObj.toLocaleDateString('pt-BR');
                            } else {
                                dateLabel = dhEmi.substring(0, 10);
                            }
                        } catch {
                            dateLabel = dhEmi.substring(0, 10);
                        }
                    }

                    setCapturedData({
                        number: nNF || '',
                        date: dateLabel,
                        total: vNF ? parseFloat(vNF) : 0,
                        issuer: xNome || 'Não identificado'
                    });
                    toast.success('Leitura completa! Dados capturados.');
                } catch (err) {
                    toast.error('Falha técnica ao tentar ler o XML.');
                } finally {
                    setUploadingInvoice(false);
                }
            };
            reader.readAsText(file);
        } else {
            setUploadingInvoice(false);
            toast.info('PDF selecionado. Clique em Analisar para capturar dados.');
        }
    };

    const handleProcessInvoice = async (isConfirmation = false) => {
        if (!selectedOrderId || !invoiceFile) return;
        setUploadingInvoice(true);
        try {
            const formData = new FormData();
            formData.append('file', invoiceFile);
            formData.append('confirmSave', isConfirmation.toString());

            const result = await processInvoiceAction(selectedOrderId, formData);

            if (result.success) {
                if (isConfirmation) {
                    toast.success('Nota Fiscal salva e pedido atualizado!');
                    setIsUploadModalOpen(false);
                    setCapturedData(null);
                    setInvoiceFile(null);
                    await onReload();
                } else {
                    if (result.extractedData) {
                        setCapturedData(result.extractedData);
                        toast.success('Análise concluída! Verifique os dados.');
                    } else {
                        toast.warning('PDF analisado, mas não foi possível extrair dados automaticamente.');
                    }
                }
            } else if ('partialSuccess' in result && result.partialSuccess) {
                toast.warning(result.error || 'Nota fiscal registrada parcialmente. Verifique antes de reenviar.');
                setIsUploadModalOpen(false);
                setCapturedData(null);
                setInvoiceFile(null);
                await onReload();
            } else {
                toast.error('Erro ao processar NF: ' + result.error);
            }
        } catch (error: any) {
            toast.error('Erro de rede ao processar NF: ' + error.message);
        } finally {
            setUploadingInvoice(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Status Lifecycle Filter Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                    const isSelected = filterStatus === key;
                    const count = orders.filter(o => o.status === key).length;

                    return (
                        <div
                            key={key}
                            className={`border transition-all duration-300 cursor-pointer overflow-hidden group rounded-2xl p-3 flex flex-col items-center justify-center space-y-1.5 text-center relative ${isSelected
                                ? 'border-primary ring-2 ring-primary/20 bg-primary/5 shadow-lg shadow-primary/5'
                                : 'border-border bg-card hover:border-primary/30 hover:bg-muted/30 shadow-sm'
                                }`}
                            onClick={() => setFilterStatus(isSelected ? null : key as any)}
                        >
                            <div className={`p-1.5 rounded-xl transition-all ${isSelected ? 'bg-primary text-white scale-110' : config.color + ' group-hover:scale-110'}`}>
                                <config.icon className="w-3.5 h-3.5" />
                            </div>
                            <div className={`text-lg font-black tracking-tighter transition-colors ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                                {count}
                            </div>
                            <div className={`text-[8px] uppercase font-black tracking-[0.15em] leading-none ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                                {config.label}
                            </div>
                        </div>
                    );
                })}
            </div>

            <FilterBar>
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <ThemeInput
                        placeholder="Buscar por pedido ou cliente..."
                        className="pl-11 h-11 bg-muted/30 border-border focus:bg-background transition-all rounded-2xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </FilterBar>

            {/* Orders Table */}
            <div className="rounded-xl border border-border bg-card/30 overflow-hidden shadow-sm">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="bg-muted/50 text-muted-foreground text-left">
                            <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Pedido / Deal</th>
                            <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Responsável NF</th>
                            <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Valor</th>
                            <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Status Atual</th>
                            <th className="px-5 py-3 font-medium uppercase tracking-wider text-xs">Próxima Etapa</th>
                            <th className="px-5 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {filteredOrders.length > 0 ? filteredOrders.map((order) => {
                            const nextStatusList: SalesOrder['status'][] = [
                                'pedido_gerado', 'nf_emitida', 'entregue', 'cliente_pagou', 'distribuidor_pagou', 'comissao_paga'
                            ];
                            const statusMapper: Record<string, SalesOrder['status']> = {
                                'pending': 'pedido_gerado',
                                'approved': 'pedido_gerado',
                                'billed': 'nf_emitida',
                                'in_transit': 'entregue',
                                'delivered': 'entregue',
                                'cancelled': 'pedido_gerado'
                            };
                            const currentStatus = statusMapper[order.status] || order.status;
                            const config = STATUS_CONFIG[currentStatus as keyof typeof STATUS_CONFIG] || STATUS_CONFIG.pedido_gerado;
                            const currentIndex = nextStatusList.indexOf(currentStatus as any);
                            const nextStatus = nextStatusList[currentIndex + 1];

                            return (
                                <React.Fragment key={order.id}>
                                    <tr 
                                        className={`hover:bg-muted/30 transition-colors group cursor-pointer border-l-2 border-l-transparent hover:border-l-primary ${expandedOrderId === order.id ? 'bg-muted/20 border-l-primary' : ''}`}
                                        onClick={() => setExpandedOrderId(prev => prev === order.id ? null : order.id)}
                                    >
                                        <td className="px-5 py-3">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-foreground group-hover:text-primary transition-colors flex items-center gap-2">
                                                    {expandedOrderId === order.id ? (
                                                        <ChevronRight className="w-3.5 h-3.5 transition-transform rotate-90 text-primary" />
                                                    ) : (
                                                        <ChevronRight className="w-3.5 h-3.5 transition-transform text-muted-foreground" />
                                                    )}
                                                    {order.deal?.title || 'Pedido S/ N'}
                                                </span>
                                                <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5 ml-5 font-bold uppercase tracking-wider">
                                                    <User className="w-3 h-3" />
                                                    {order.deal?.customer?.name || 'Cliente final'}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            <Badge 
                                                variant="outline" 
                                                onClick={(e) => e.stopPropagation()}
                                                className={`text-xs uppercase font-black ${order.billing_entity === 'infodive' ? 'border-primary/50 text-primary bg-primary/5' : 'border-muted-foreground/30'}`}
                                            >
                                                {order.billing_entity === 'infodive' ? 'Infodive' : 'Distribuidor'}
                                            </Badge>
                                        </td>
                                        <td className="px-5 py-3 font-black text-sm tracking-tight">
                                            {formatCurrency(order.total_value)}
                                        </td>
                                        <td className="px-5 py-3">
                                            <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-black uppercase border border-white/5 shadow-sm ${config.color}`}>
                                                <config.icon className="w-3 h-3" />
                                                {config.label}
                                            </div>
                                        </td>
                                        <td className="px-5 py-3">
                                            {nextStatus ? (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (nextStatus === 'nf_emitida') {
                                                            setSelectedOrderId(order.id);
                                                            setIsUploadModalOpen(true);
                                                        } else {
                                                            onStatusUpdate(order.id, nextStatus);
                                                        }
                                                    }}
                                                    className="text-xs h-8 bg-primary/5 hover:bg-primary/10 text-primary uppercase font-black tracking-widest gap-1.5 rounded-xl border border-primary/10"
                                                >
                                                    Mudar para {STATUS_CONFIG[nextStatus].label}
                                                    <ChevronRight className="w-3 h-3" />
                                                </Button>
                                            ) : (
                                                <span className="text-xs text-muted-foreground uppercase font-black opacity-30 tracking-widest">Finalizado</span>
                                            )}
                                        </td>
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-all duration-300 translate-x-0 lg:translate-x-1 lg:group-hover:translate-x-0">
                                                <Button variant="ghost" size="icon" title="Ver Parcelas/Detalhes" className="h-8 w-8 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl" onClick={(e) => { e.stopPropagation(); setExpandedOrderId(prev => prev === order.id ? null : order.id); }}>
                                                    <Eye className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" title="Upload de NF" className="h-8 w-8 text-muted-foreground hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl" onClick={(e) => { e.stopPropagation(); setSelectedOrderId(order.id); setIsUploadModalOpen(true); }}>
                                                    <FileCheck className="w-4 h-4" />
                                                </Button>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted rounded-xl">
                                                            <MoreVertical className="w-4 h-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end" className="w-56 glass-card p-2 rounded-2xl border-white/10 shadow-2xl">
                                                        <div className="px-3 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground/50">Ações do Pedido</div>
                                                        <DropdownMenuItem className="gap-2 cursor-pointer text-xs font-bold p-3 rounded-xl" onClick={() => setExpandedOrderId(prev => prev === order.id ? null : order.id)}>
                                                            <FileText className="w-4 h-4" /> Ver Parcelas/Detalhes
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator className="bg-white/5 my-1" />
                                                        <div className="px-3 py-2 text-xs font-black uppercase tracking-widest text-muted-foreground/50 text-warning">Forçar Status</div>
                                                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                                                            <DropdownMenuItem key={key} onClick={() => onStatusUpdate(order.id, key as SalesOrder['status'])} className="gap-2 cursor-pointer text-xs uppercase font-bold hover:bg-primary/5 hover:text-primary p-3 rounded-xl">
                                                                <cfg.icon className="w-3 h-3" />
                                                                {cfg.label}
                                                            </DropdownMenuItem>
                                                        ))}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </td>
                                    </tr>

                                    {/* Expanded Installments View */}
                                    {expandedOrderId === order.id && (
                                        <tr>
                                            <td colSpan={6} className="bg-muted/10 p-0 overflow-hidden">
                                                <div className="p-6 border-y border-border space-y-4 shadow-inner">
                                                    <div className="flex items-center justify-between">
                                                        <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                                            <DollarSign className="w-4 h-4" /> Parcelas / Boletos do Pedido
                                                        </h4>
                                                    </div>

                                                    {order.installments && order.installments.length > 0 ? (
                                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                                            {order.installments.sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()).map((inst, index) => (
                                                                <div key={inst.id} className={`p-4 rounded-xl border flex flex-col justify-between space-y-3 transition-colors ${inst.status === 'paid' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-background border-border hover:border-primary/30'}`}>
                                                                    <div className="flex justify-between items-start">
                                                                        <Badge variant="outline" className={`text-xs font-bold ${inst.status === 'paid' ? 'bg-emerald-500/10 text-emerald-600 border-none' : 'bg-muted text-muted-foreground'}`}>
                                                                            PARCELA {index + 1}
                                                                        </Badge>
                                                                        <span className={`text-xs font-mono font-bold ${inst.status === 'paid' ? 'text-emerald-600' : 'text-primary'}`}>
                                                                            {new Date(inst.due_date).toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
                                                                        </span>
                                                                    </div>
                                                                    <div className="text-xl font-black text-foreground">
                                                                        {formatCurrency(inst.amount)}
                                                                    </div>
                                                                    <Button
                                                                        variant={inst.status === 'paid' ? "outline" : "default"}
                                                                        size="sm"
                                                                        className={`w-full text-xs h-8 uppercase font-bold tracking-widest ${inst.status === 'paid' ? 'text-muted-foreground border-dashed hover:text-orange-500' : 'bg-primary hover:bg-primary/90 shadow'} transition-all`}
                                                                        onClick={async () => {
                                                                            const newStatus = inst.status === 'paid' ? 'pending' : 'paid';
                                                                            const success = await onInstallmentUpdate(inst.id, newStatus);
                                                                            if (success) {
                                                                                toast.success(`Parcela marcada como ${newStatus === 'paid' ? 'Paga' : 'Pendente'}`);
                                                                                await onReload();
                                                                            }
                                                                        }}
                                                                    >
                                                                        {inst.status === 'paid' ? (
                                                                            <><RotateCcw className="w-3 h-3 mr-1" /> Reverter Status</>
                                                                        ) : (
                                                                            <><CheckCircle2 className="w-3 h-3 mr-1" /> Marcar como Pago</>
                                                                        )}
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="p-8 text-center text-muted-foreground rounded-lg border border-dashed border-border flex flex-col items-center">
                                                            <FileText className="w-8 h-8 opacity-20 mb-2" />
                                                            <p className="text-sm font-medium">Nenhuma parcela cadastrada</p>
                                                            <p className="text-xs opacity-70 mt-1">Faça o upload da Nota Fiscal para gerar as parcelas automaticamente.</p>
                                                        </div>
                                                    )}
                                                    {/* Documents Section */}
                                                    {order.deal_id && (
                                                        <div className="mt-4 border-t border-border pt-4">
                                                            <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2 mb-3">
                                                                <FolderOpen className="w-4 h-4" /> Documentos / Notas Fiscais
                                                            </h4>
                                                            <DocumentsTab
                                                                entityType="deal"
                                                                entityId={order.deal_id}
                                                                fetchDocuments={(id) => getSalesOrderDocuments(id)}
                                                                uploadDocument={(id, fd) => uploadSalesOrderDocument(id, fd)}
                                                                getSignedUrl={(docId) => getSalesDocumentSignedUrl(docId)}
                                                                deleteDocument={async (docId) => { await deleteSalesDocument(docId); return true; }}
                                                            />
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        }) : (
                            <tr>
                                <td colSpan={6} className="px-6 py-12">
                                    <PremiumEmptyState
                                        icon={ShoppingBag}
                                        title="Nenhum pedido encontrado"
                                        description={filterStatus || searchTerm
                                            ? "Não encontramos pedidos com os filtros aplicados." 
                                            : "Ainda não há pedidos registrados no sistema."
                                        }
                                        actionLabel={filterStatus || searchTerm ? "Limpar Filtros" : undefined}
                                        onAction={filterStatus || searchTerm ? () => { setFilterStatus(null); setSearchTerm(''); } : undefined}
                                        variant="compact"
                                    />
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Upload Invoice Modal */}
            <Dialog open={isUploadModalOpen} onOpenChange={setIsUploadModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Upload de Nota Fiscal (XML/PDF)</DialogTitle>
                        <DialogDescription>
                            Faça o upload da NF para atualizar o status do pedido. O sistema tentará capturar o número da nota automaticamente (XML NFe).
                        </DialogDescription>
                    </DialogHeader>

                    <div className={`py-8 flex flex-col items-center justify-center border-2 border-dashed rounded-xl transition-all relative ${invoiceFile ? 'border-emerald-500/50 bg-emerald-500/5' : 'border-border bg-muted/20 hover:border-primary/50'}`}>
                        {invoiceFile ? (
                            <div className="flex flex-col items-center">
                                <div className="bg-emerald-500 text-white p-2 rounded-full mb-2">
                                    <Check className="w-5 h-5" />
                                </div>
                                <p className="text-sm font-bold text-emerald-600">{invoiceFile.name}</p>
                                <button onClick={() => { setInvoiceFile(null); setCapturedData(null); }} className="text-xs uppercase font-bold text-muted-foreground hover:text-rose-500 mt-2">
                                    Trocar Arquivo
                                </button>
                            </div>
                        ) : (
                            <>
                                <Upload className="w-10 h-10 text-muted-foreground mb-2" />
                                <p className="text-sm font-medium">Selecione ou arraste o arquivo da NF</p>
                                <p className="text-xs text-muted-foreground mt-1 uppercase font-bold tracking-widest">Suporta XML e PDF</p>
                            </>
                        )}
                        <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" accept=".xml,.pdf" onChange={handleFileChange} />
                    </div>

                    {capturedData && (
                        <div className="mt-6 border-t pt-6">
                            <div className="rounded-xl border border-primary/20 bg-card p-5 space-y-4 shadow-sm ring-1 ring-primary/5">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-widest">
                                        <Sparkles className="w-3 h-3" />
                                        Review de Dados Capturados
                                    </div>
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-500 border-none text-xs">VALIDADO</Badge>
                                </div>
                                <div className="grid grid-cols-2 gap-y-4 gap-x-6">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Número da NF</p>
                                        <p className="text-sm font-semibold text-foreground">{capturedData.number}</p>
                                    </div>
                                    <div className="space-y-1 text-right">
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight">Data Emissão</p>
                                        <p className="text-sm font-semibold text-foreground">{capturedData.date}</p>
                                    </div>
                                    <div className="col-span-2 py-2 border-y border-border/50">
                                        <p className="text-xs text-muted-foreground uppercase font-bold tracking-tight mb-1 font-mono">Emitente / Fornecedor</p>
                                        <p className="text-sm font-medium text-foreground truncate">{capturedData.issuer}</p>
                                    </div>
                                    <div className="col-span-2 bg-muted/30 p-3 rounded-lg flex justify-between items-center">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Valor Total da NF</p>
                                        <p className="text-lg font-black text-primary">{formatCurrency(capturedData.total)}</p>
                                    </div>

                                    {capturedData.boletos && capturedData.boletos.length > 0 && (
                                        <div className="col-span-2 mt-2 border-t pt-4">
                                            <p className="text-xs text-primary uppercase font-bold tracking-widest mb-3 flex items-center gap-2">
                                                <FileText className="w-3 h-3" />
                                                Boletos / Parcelas ({capturedData.boletos.length})
                                            </p>
                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                {capturedData.boletos.map((boleto: any, idx: number) => (
                                                    <div key={idx} className="bg-background border border-primary/10 rounded-lg p-3 flex flex-col items-center justify-center text-center shadow-sm hover:border-primary/30 transition-colors">
                                                        <Badge variant="outline" className="mb-2 text-[8px] tracking-widest bg-primary/5 text-primary border-primary/20">PARCELA {idx + 1}</Badge>
                                                        <span className="text-sm font-black text-foreground">{formatCurrency(boleto.amount)}</span>
                                                        <span className="text-xs text-muted-foreground font-bold font-mono mt-1">Venc: <span className="text-primary">{boleto.dueDate}</span></span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter className="mt-8">
                        <Button variant="ghost" className="text-muted-foreground" onClick={() => { setIsUploadModalOpen(false); setCapturedData(null); setInvoiceFile(null); }}>
                            Cancelar
                        </Button>

                        {invoiceFile && !capturedData && invoiceFile.name.toLowerCase().endsWith('.pdf') && (
                            <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-lg shadow-primary/20" disabled={uploadingInvoice} onClick={() => handleProcessInvoice(false)}>
                                {uploadingInvoice ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analisando PDF...</>
                                ) : (
                                    <><Sparkles className="w-4 h-4 mr-2" />Analisar XML/PDF</>
                                )}
                            </Button>
                        )}

                        {capturedData && (
                            <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-8 shadow-lg shadow-blue-500/20" disabled={uploadingInvoice} onClick={() => handleProcessInvoice(true)}>
                                {uploadingInvoice ? (
                                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Gravando...</>
                                ) : (
                                    <><Check className="w-4 h-4 mr-2" />Confirmar e Salvar NF</>
                                )}
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
