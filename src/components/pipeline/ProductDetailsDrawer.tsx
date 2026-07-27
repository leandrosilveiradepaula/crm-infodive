'use client';

import React from 'react';
import { toast } from 'sonner';
import {
    ChevronLeft, ChevronRight, X, DollarSign, FileSpreadsheet, Edit2,
    BarChart3, Tag, Layers, Package, Pencil, ArrowLeft, ArrowRight,
    Search, Sparkles, Building2, Check, AlertCircle
} from 'lucide-react';
import { useDraftForm, FloatingSaveBar, UnsavedChangesDialog } from '@/components/ui/floating-save-bar';

import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ThemeCurrencyInput } from '@/components/ui/theme/ThemeComponents';
import { TechnicalDetailsEditor } from './TechnicalDetailsEditor';
import { Switch } from '@/components/ui/switch';

import { calculateDealCommission } from '@/utils/commissionCalculator';
import { updateDeal } from '@/app/(dashboard)/pipeline/actions';
import type { ProductItem } from './SortableProductRow';
import type { Deal, DealProduct, ProductTechDetail } from '@/types/deal';
import type { Profile } from '@/types/profile';

// ---------------------------------------------------------------------------
// Types & Interfaces
// ---------------------------------------------------------------------------

export interface AccountBranch {
    id: string;
    name: string;
    cnpj: string;
}

export interface Distributor {
    id: string;
    name: string;
    cnpj?: string;
    account_branches?: AccountBranch[];
}

interface ProductDetailsDrawerProps {
    open: boolean;
    onClose: () => void;
    product: ProductItem | null;
    allProducts: ProductItem[];
    onNavigate: (productId: string) => void;
    isEditing: boolean;
    onEnableEdit: () => void;
    handleUpdateProduct: (prodId: string, field: keyof ProductItem, value: unknown) => void;
    editedDeal: Deal;
    setEditedDeal: React.Dispatch<React.SetStateAction<Deal>>;
    dealOwner: (Profile & { commission_rate?: number }) | null;
    distributors: Distributor[];
    setShowImportModal: (show: boolean) => void;
    setTargetImportProductId: (id: string | null) => void;
    details: ProductTechDetail[];
}

type DrawerTab = 'financeiro' | 'classificacao' | 'precificacao' | 'registros';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const formatCurrency = (val: number) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

const getOwnerFirstName = (owner: (Profile & { commission_rate?: number; name?: string }) | null | string): string => {
    if (!owner) return 'Vendedor';
    const nameStr = typeof owner === 'string' ? owner : (owner.full_name || owner.name);
    if (!nameStr) return 'Vendedor';
    return nameStr.split(' ')[0] || 'Vendedor';
};

// ---------------------------------------------------------------------------
// Tab components (separated for clarity)
// ---------------------------------------------------------------------------

function FinanceiroTab({
    product, isEditing, editedDeal, setEditedDeal, dealOwner, localDeduction, setLocalDeduction
}: {
    product: ProductItem;
    isEditing: boolean;
    editedDeal: Deal;
    setEditedDeal: React.Dispatch<React.SetStateAction<Deal>>;
    dealOwner: (Profile & { commission_rate?: number }) | null;
    localDeduction: number;
    setLocalDeduction: (v: number) => void;
}) {
    const ownerName = getOwnerFirstName(dealOwner);
    const costValue = product.cost || 0;
    const priceValue = product.unit_price || 0;
    const qtyValue = product.quantity || 0;
    const totalCost = costValue * qtyValue;
    const grossMargin = (priceValue - costValue) * qtyValue;
    const totalSales = priceValue * qtyValue;

    const commissionData = calculateDealCommission(
        {
            ...editedDeal,
            commission_deduction: localDeduction,
            deal_products: [{
                id: product.id,
                organization_id: editedDeal.organization_id,
                deal_id: editedDeal.id,
                name: product.name,
                quantity: qtyValue,
                unit_price: priceValue,
                cost: costValue,
                margin: product.margin || 0,
                category: product.category,
            } as DealProduct]
        },
        dealOwner?.commission_rules,
        dealOwner?.commission_rate || 0
    );

    return (
        <div className="space-y-5">
            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-muted/60 border border-border rounded-xl p-3 text-center">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Custo Total</p>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(totalCost)}</p>
                </div>
                <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 text-center">
                    <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-wide mb-1">Margem Bruta</p>
                    <div className="flex flex-col items-center gap-0.5">
                        <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(grossMargin)}</p>
                        <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground bg-background h-4 px-1">
                            {product.margin?.toFixed(2)}%
                        </Badge>
                    </div>
                </div>
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-center">
                    <p className="text-[9px] font-bold text-primary/70 uppercase tracking-wide mb-1">Total Venda</p>
                    <p className="text-lg font-bold text-primary">{formatCurrency(totalSales)}</p>
                </div>
            </div>

            {/* Commission Block */}
            <div className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-xl p-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-[40px] rounded-full pointer-events-none" />
                <div className="relative z-10 space-y-3">
                    <p className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-wide">Comissão Estimada</p>
                    <div className="flex items-start gap-6">
                        {/* Deduction Input */}
                        <div className="w-28 shrink-0">
                            <label className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-wide mb-1 block">Dedução (%)</label>
                            {isEditing ? (
                                <div className="relative">
                                    <Input
                                        type="number"
                                        className="w-full bg-background border-emerald-500/30 rounded-lg px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 text-right pr-6 h-8"
                                        value={localDeduction}
                                        onChange={e => setLocalDeduction(Number(e.target.value))}
                                        onBlur={async e => {
                                            const val = Number(e.target.value);
                                            setEditedDeal(prev => ({ ...prev, commission_deduction: val }));
                                            try {
                                                await updateDeal(editedDeal.id, { commission_deduction: val });
                                                toast.success(`Dedução atualizada para ${val}%`);
                                            } catch {
                                                toast.error('Erro ao salvar dedução');
                                            }
                                        }}
                                    />
                                    <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-emerald-600 font-bold">%</span>
                                </div>
                            ) : (
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">{localDeduction.toFixed(1)}%</p>
                            )}
                        </div>
                        {/* Commission Value */}
                        <div className="flex-1 border-l border-emerald-500/20 pl-5">
                            <div className="flex items-center gap-2 mb-1">
                                <label className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-wide">
                                    {ownerName}
                                </label>
                                {commissionData.appliedRate !== undefined && (
                                    <Badge variant="outline" className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 border-emerald-500/20 h-4 px-1.5">
                                        {commissionData.appliedRate}%
                                    </Badge>
                                )}
                            </div>
                            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(commissionData.commission)}
                            </p>
                            <p className="text-[10px] text-emerald-600/70 font-bold mt-1">
                                Base líquida: <span className="text-emerald-600 dark:text-emerald-400 border-b border-emerald-500/30">{formatCurrency(commissionData.netMargin)}</span>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ClassificacaoTab({
    product, isEditing, handleUpdateProduct, distributors
}: {
    product: ProductItem;
    isEditing: boolean;
    handleUpdateProduct: (id: string, field: keyof ProductItem, value: unknown) => void;
    distributors: Distributor[];
}) {
    const selectedDist = distributors.find((d: Distributor) => d.id === product.distributor_id);

    const cnpjOptions: { label: string; value: string }[] = [];
    if (selectedDist?.cnpj) cnpjOptions.push({ label: `Matriz - ${selectedDist.cnpj}`, value: selectedDist.cnpj });
    selectedDist?.account_branches?.forEach((b: AccountBranch) => {
        if (b.cnpj) cnpjOptions.push({ label: `${b.name} - ${b.cnpj}`, value: b.cnpj });
    });

    const fieldClass = "w-full bg-background border border-input rounded-lg px-2 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none h-8";
    const readClass = "w-full bg-background border border-input rounded-lg px-2 py-1.5 text-xs font-bold text-muted-foreground h-8 flex items-center";

    return (
        <div className="space-y-4">
            {/* Categoria */}
            <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Categoria</p>
                {isEditing ? (
                    <select className={fieldClass} value={product.category || ''} onChange={e => handleUpdateProduct(product.id, 'category', e.target.value)}>
                        <option value="">Selecione...</option>
                        {['Hardware', 'Software', 'Licenciamento', 'Serviço', 'Produto']
                            .concat(product.category && !['Hardware', 'Software', 'Licenciamento', 'Serviço', 'Produto'].includes(product.category) ? [product.category] : [])
                            .map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                ) : (
                    <span className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border block w-full h-8 flex items-center ${product.category ? 'bg-background text-foreground border-input' : 'bg-amber-500/10 text-amber-600 border-amber-500/20'}`}>
                        {product.category || 'Indefinida'}
                    </span>
                )}
            </div>

            {/* Distribuidor */}
            <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Distribuidor</p>
                {isEditing ? (
                    <select className={fieldClass} value={product.distributor_id || ''} onChange={e => handleUpdateProduct(product.id, 'distributor_id', e.target.value)}>
                        <option value="">Selecione...</option>
                        {distributors.map((d: Distributor) => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                ) : (
                    <div className={readClass}>{distributors.find((d: Distributor) => d.id === product.distributor_id)?.name || '---'}</div>
                )}
            </div>

            {/* CNPJ de Faturamento */}
            {product.distributor_id && (
                <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                    <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">CNPJ de Faturamento</p>
                    {isEditing ? (
                        <select className={fieldClass} value={product.distributor_cnpj || ''} onChange={e => handleUpdateProduct(product.id, 'distributor_cnpj', e.target.value)}>
                            <option value="">Selecione o CNPJ...</option>
                            {cnpjOptions.map((opt, idx) => <option key={idx} value={opt.value}>{opt.label}</option>)}
                        </select>
                    ) : (
                        <div className={readClass}>{product.distributor_cnpj || '---'}</div>
                    )}
                </div>
            )}

            <Separator />

            {/* Tipo de Faturamento */}
            <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Tipo de Faturamento</p>
                {isEditing ? (
                    <select className={fieldClass} value={product.billing_type || 'indirect'} onChange={e => handleUpdateProduct(product.id, 'billing_type', e.target.value)}>
                        <option value="direct">Revenda (Infodive)</option>
                        <option value="indirect">Direto (Distribuidor)</option>
                    </select>
                ) : (
                    <div className={readClass}>{product.billing_type === 'indirect' ? 'Direto (Distribuidor)' : 'Revenda (Infodive)'}</div>
                )}
            </div>

        </div>
    );
}

function PrecificacaoTab({
    product, isEditing, handleUpdateProduct, setShowImportModal, setTargetImportProductId
}: {
    product: ProductItem;
    isEditing: boolean;
    handleUpdateProduct: (id: string, field: keyof ProductItem, value: unknown) => void;
    setShowImportModal: (v: boolean) => void;
    setTargetImportProductId: (id: string | null) => void;
}) {
    const readClass = "w-full bg-background border border-input rounded-lg px-2 py-1.5 text-xs font-bold text-foreground h-8 flex items-center";

    return (
        <div className="space-y-5">
            {/* Import Button */}
            {isEditing && (
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setTargetImportProductId(product.id); setShowImportModal(true); }}
                    className="w-full gap-1.5 h-8 text-[10px] uppercase font-bold text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground"
                >
                    <FileSpreadsheet className="h-3 w-3" />
                    Importar Planilha de Preços
                </Button>
            )}

            {/* USD Mode */}
            <div className="bg-emerald-500/5 border border-emerald-500/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <label htmlFor={`drawer-usd-${product.id}`} className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wide cursor-pointer flex items-center gap-2 select-none">
                        Custo em Dólar (USD) <DollarSign className="h-3 w-3" />
                    </label>
                    <Switch
                        id={`drawer-usd-${product.id}`}
                        checked={product.is_usd || false}
                        disabled={!isEditing}
                        onCheckedChange={checked => handleUpdateProduct(product.id, 'is_usd', checked)}
                        className="scale-[0.65] data-[state=checked]:bg-emerald-500"
                    />
                </div>

                {product.is_usd && (
                    <div className="animate-in fade-in slide-in-from-top-1 space-y-3 pl-1">
                        <div className="flex items-center justify-between gap-2">
                            <label htmlFor={`drawer-present-usd-${product.id}`} className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-wide cursor-pointer select-none">
                                Apresentar em Dólar no PDF
                            </label>
                            <Switch
                                id={`drawer-present-usd-${product.id}`}
                                checked={product.present_in_usd || false}
                                disabled={!isEditing}
                                onCheckedChange={checked => handleUpdateProduct(product.id, 'present_in_usd', checked)}
                                className="scale-[0.65] data-[state=checked]:bg-emerald-500"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] font-bold text-emerald-600 uppercase block mb-1">Custo USD</label>
                                {isEditing ? (
                                    <Input
                                        type="number"
                                        className="h-8 text-xs border-emerald-500/30 font-bold"
                                        value={product.usd_cost ?? ''}
                                        onChange={e => handleUpdateProduct(product.id, 'usd_cost', Number(e.target.value))}
                                        onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                                    />
                                ) : (
                                    <div className={readClass}>US$ {product.usd_cost?.toLocaleString('en-US')}</div>
                                )}
                            </div>
                            <div>
                                <label className="text-[9px] font-bold text-emerald-600 uppercase block mb-1">PTAX</label>
                                {isEditing ? (
                                    <Input
                                        type="number"
                                        step="0.0001"
                                        className="h-8 text-xs border-emerald-500/30 font-bold"
                                        value={product.exchange_rate ?? ''}
                                        onChange={e => handleUpdateProduct(product.id, 'exchange_rate', Number(e.target.value))}
                                        onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                                    />
                                ) : (
                                    <div className={readClass}>{product.exchange_rate?.toFixed(4)}</div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <Separator />

            {/* Cost & Margin */}
            <div className="grid grid-cols-3 gap-3">
                <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Quantidade</label>
                    {isEditing ? (
                        <Input
                            type="number"
                            min="1"
                            className="h-8 text-xs font-bold"
                            value={product.quantity ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateProduct(product.id, 'quantity', e.target.value === '' ? undefined : parseInt(e.target.value))}
                            onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                        />
                    ) : (
                        <div className={readClass}>{product.quantity}</div>
                    )}
                </div>
                <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">
                        {product.is_usd ? 'Custo (R$)' : product.is_bid ? 'Preço Venda (R$)' : 'Custo (R$)'}
                    </label>
                    {isEditing ? (
                        <ThemeCurrencyInput
                            className={`w-full bg-background border ${product.is_usd ? 'border-emerald-500/30' : 'border-input'} rounded-lg px-2 py-1.5 text-xs font-bold h-8 pl-8 focus:ring-1 focus:ring-primary outline-none disabled:opacity-70`}
                            value={(product.is_bid ? product.unit_price : product.cost) || 0}
                            onChange={(e: { target: { value: string } }) => handleUpdateProduct(product.id, product.is_bid ? 'unit_price' : 'cost', Number(e.target.value))}
                            disabled={product.is_usd || false}
                        />
                    ) : (
                        <div className={readClass}>R$ {product.is_bid ? product.unit_price?.toLocaleString('pt-BR') : product.cost?.toLocaleString('pt-BR')}</div>
                    )}
                </div>
                <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Margem (%)</label>
                    {isEditing ? (
                        <Input
                            type="number"
                            className="h-8 text-xs font-bold text-primary"
                            value={product.margin ?? ''}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateProduct(product.id, 'margin', e.target.value === '' ? undefined : Number(e.target.value))}
                            onFocus={(e: React.FocusEvent<HTMLInputElement>) => e.target.select()}
                        />
                    ) : (
                        <div className="w-full bg-background border border-input rounded-lg px-2 py-1.5 text-xs font-black text-primary h-8 flex items-center">{product.margin || 0}%</div>
                    )}
                </div>
            </div>

            {/* Calculated Selling Prices */}
            <div className="grid grid-cols-2 gap-3 mt-3.5 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-xl p-3">
                <div>
                    <span className="text-[9px] font-bold text-primary/80 uppercase tracking-wider block mb-1">Preço Unitário de Venda</span>
                    <span className="text-sm font-extrabold text-foreground">{formatCurrency(product.unit_price || 0)}</span>
                </div>
                <div className="border-l border-primary/20 pl-3">
                    <span className="text-[9px] font-bold text-primary/80 uppercase tracking-wider block mb-1">Valor Total de Venda</span>
                    <span className="text-base font-black text-primary">{formatCurrency((product.unit_price || 0) * (product.quantity || 1))}</span>
                </div>
            </div>

            <Separator />

            {/* Pricing Model */}
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    <p className="text-[9px] font-bold text-amber-600 uppercase tracking-wide">Modelo de Precificação</p>
                </div>
                <div>
                    <label className="text-[9px] font-bold text-amber-600/70 uppercase block mb-1">Tipo de Cobrança</label>
                    {isEditing ? (
                        <select
                            className="w-full bg-background border-amber-500/20 rounded-lg px-2 py-0 text-xs font-bold text-foreground focus:ring-1 focus:ring-amber-500 outline-none h-8"
                            value={product.pricing_model || 'one_time'}
                            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => {
                                const model = e.target.value;
                                handleUpdateProduct(product.id, 'pricing_model', model);
                                if (model === 'monthly' && !product.duration_unit) handleUpdateProduct(product.id, 'duration_unit', 'meses');
                                else if (model === 'annual' && !product.duration_unit) handleUpdateProduct(product.id, 'duration_unit', 'anos');
                            }}
                        >
                            <option value="one_time">💰 Pagamento Único</option>
                            <option value="monthly">🔄 Mensal (SaaS)</option>
                            <option value="annual">📅 Anual (Subscrição)</option>
                        </select>
                    ) : (
                        <div className="w-full bg-background border-amber-500/10 rounded-lg px-2 py-1.5 text-xs font-bold text-foreground h-8 flex items-center">
                            {product.pricing_model === 'monthly' ? '🔄 Mensal (SaaS)' : product.pricing_model === 'annual' ? '📅 Anual (Subscrição)' : '💰 Pagamento Único'}
                        </div>
                    )}
                </div>
                {(product.pricing_model === 'monthly' || product.pricing_model === 'annual' || product.duration) && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200">
                        <div>
                            <label className="text-[9px] font-bold text-amber-600/70 uppercase block mb-1">Duração (Qtd)</label>
                            {isEditing ? (
                                <Input
                                    type="number"
                                    className="h-8 text-xs border-amber-500/20"
                                    value={product.duration ?? ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUpdateProduct(product.id, 'duration', e.target.value === '' ? null : Number(e.target.value))}
                                    placeholder="Ex: 36"
                                />
                            ) : (
                                <div className="w-full bg-background border-amber-500/10 rounded-lg px-2 py-1.5 text-xs font-bold text-foreground h-8 flex items-center">{product.duration || '---'}</div>
                            )}
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-amber-600/70 uppercase block mb-1">Período</label>
                            {isEditing ? (
                                <select
                                    className="w-full bg-background border-amber-500/20 rounded-lg px-2 py-0 text-xs font-bold text-foreground focus:ring-1 focus:ring-amber-500 outline-none h-8"
                                    value={product.duration_unit || ''}
                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleUpdateProduct(product.id, 'duration_unit', e.target.value || null)}
                                >
                                    <option value="">Nenhum</option>
                                    <option value="meses">Meses</option>
                                    <option value="anos">Anos</option>
                                </select>
                            ) : (
                                <div className="w-full bg-background border-amber-500/10 rounded-lg px-2 py-1.5 text-xs font-bold text-foreground h-8 flex items-center capitalize">{product.duration_unit || '---'}</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <Separator />

            {/* BID Mode */}
            <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                    <label htmlFor={`drawer-bid-${product.id}`} className="text-[10px] font-bold text-primary uppercase tracking-wide cursor-pointer select-none">
                        Modo BID (Preço Fixo)
                    </label>
                    <Switch
                        id={`drawer-bid-${product.id}`}
                        checked={product.is_bid || false}
                        disabled={!isEditing}
                        onCheckedChange={checked => handleUpdateProduct(product.id, 'is_bid', checked)}
                        className="scale-[0.65]"
                    />
                </div>

                {product.is_bid && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in duration-200 pl-1">
                        <div>
                            <label className="text-[9px] font-bold text-blue-500/70 uppercase block mb-1">Número BID</label>
                            {isEditing ? (
                                <Input type="text" className="h-8 text-xs border-blue-500/20" placeholder="BID-001" value={product.bid_number || ''} onChange={e => handleUpdateProduct(product.id, 'bid_number', e.target.value)} />
                            ) : (
                                <div className={readClass}>{product.bid_number || '---'}</div>
                            )}
                        </div>
                        <div>
                            <label className="text-[9px] font-bold text-blue-500/70 uppercase block mb-1">Validade</label>
                            {isEditing ? (
                                <Input type="date" className="h-8 text-xs border-blue-500/20" value={product.bid_validity || ''} onChange={e => handleUpdateProduct(product.id, 'bid_validity', e.target.value)} />
                            ) : (
                                <div className={readClass}>{product.bid_validity ? new Date(product.bid_validity).toLocaleDateString('pt-BR') : '---'}</div>
                            )}
                        </div>
                    </div>
                )}
                {!product.is_bid && (
                    <p className="text-[10px] text-muted-foreground italic px-1">Preço de Venda calculated via Margem.</p>
                )}
            </div>
        </div>
    );
}

function RegistrosTab({
    product, isEditing, handleUpdateProduct, details
}: {
    product: ProductItem;
    isEditing: boolean;
    handleUpdateProduct: (id: string, field: keyof ProductItem, value: unknown) => void;
    details: ProductTechDetail[];
}) {
    const readClass = "w-full bg-background border border-input rounded-lg px-2 py-1.5 text-xs font-bold text-foreground h-8 flex items-center";

    return (
        <div className="space-y-5">
            {/* Registration IDs */}
            <div className="grid grid-cols-2 gap-3">
                <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">ID Oportunidade</label>
                    {isEditing ? (
                        <Input type="text" className="h-8 text-xs" placeholder="Ex: 12345678" value={product.external_id || ''} onChange={e => handleUpdateProduct(product.id, 'external_id', e.target.value)} />
                    ) : (
                        <div className={readClass}>{product.external_id || '---'}</div>
                    )}
                </div>
                <div>
                    <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Validade Reg.</label>
                    {isEditing ? (
                        <Input type="date" className="h-8 text-xs" value={product.expiration_date || ''} onChange={e => handleUpdateProduct(product.id, 'expiration_date', e.target.value)} />
                    ) : (
                        <div className={readClass}>{product.expiration_date ? new Date(product.expiration_date).toLocaleDateString('pt-BR') : '---'}</div>
                    )}
                </div>
            </div>

            <Separator />

            {/* Technical Details */}
            <div>
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide mb-3">Composição Técnica</p>
                {isEditing ? (
                    <TechnicalDetailsEditor
                        details={details}
                        parentQuantity={product.quantity || 1}
                        onChange={(newDetails: ProductTechDetail[]) => handleUpdateProduct(product.id, 'description', JSON.stringify(newDetails))}
                    />
                ) : (
                    <div className="bg-card border border-border rounded-xl p-4">
                        {details.length === 0 ? (
                            <p className="text-sm text-muted-foreground">Nenhum detalhe técnico.</p>
                        ) : (
                            <ul className="space-y-1.5">
                                {details.filter((d: ProductTechDetail) => d.is_visible_on_proposal !== false).map((d: ProductTechDetail, i: number) => (
                                    <li key={i} className="text-sm text-foreground flex items-center justify-between">
                                        <span><span className="text-muted-foreground mr-2">{d.quantity}x</span>{d.description}</span>
                                        {d.is_highlighted_on_grid && (
                                            <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20 uppercase">{d.grid_label || 'Destaque'}</Badge>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ---------------------------------------------------------------------------
// Main Drawer
// ---------------------------------------------------------------------------

const TABS: { id: DrawerTab; label: string; icon: React.ReactNode }[] = [
    { id: 'financeiro', label: 'Financeiro', icon: <BarChart3 className="h-3.5 w-3.5" /> },
    { id: 'classificacao', label: 'Classificação', icon: <Tag className="h-3.5 w-3.5" /> },
    { id: 'precificacao', label: 'Precificação', icon: <DollarSign className="h-3.5 w-3.5" /> },
    { id: 'registros', label: 'Registros', icon: <Layers className="h-3.5 w-3.5" /> },
];

export function ProductDetailsDrawer({
    open,
    onClose,
    product,
    allProducts,
    onNavigate,
    isEditing,
    onEnableEdit,
    handleUpdateProduct,
    editedDeal,
    setEditedDeal,
    dealOwner,
    distributors,
    setShowImportModal,
    setTargetImportProductId,
    details,
}: ProductDetailsDrawerProps) {
    const initialProductData = React.useMemo(() => ({
        name: product?.name || '',
        sku: product?.sku || '',
        quantity: product?.quantity || 1,
        unit_price: product?.unit_price || 0,
        cost: product?.cost || 0,
        margin: product?.margin || 20,
        category: product?.category || ''
    }), [product]);

    const {
        formData,
        setFormData,
        updateField,
        isDirty,
        changedCount,
        isSaving,
        saveChanges,
        discardChanges,
        safeExecute,
        showUnsavedModal,
        setShowUnsavedModal
    } = useDraftForm({
        initialData: initialProductData,
        onSave: async (updated) => {
            if (!product?.id) return;
            (Object.keys(updated) as Array<keyof typeof updated>).forEach(key => {
                handleUpdateProduct(product.id, key as keyof ProductItem, updated[key]);
            });
        }
    });

    const [activeTab, setActiveTab] = React.useState<DrawerTab>('financeiro');

    const [localDeduction, setLocalDeduction] = React.useState<number>(editedDeal?.commission_deduction ?? 21);
    const lastDealId = React.useRef<string>(editedDeal?.id);

    React.useEffect(() => {
        if (lastDealId.current !== editedDeal?.id) {
            setLocalDeduction(editedDeal?.commission_deduction ?? 21);
            lastDealId.current = editedDeal?.id;
        }
    }, [editedDeal?.id, editedDeal?.commission_deduction]);

    // Reset to Financeiro tab when switching products
    React.useEffect(() => {
        if (open) setActiveTab('financeiro');
    }, [product?.id, open]);

    if (!product) return null;

    const currentIndex = allProducts.findIndex(p => p.id === product.id);
    const hasPrev = currentIndex > 0;
    const hasNext = currentIndex < allProducts.length - 1;

    const categoryColors: Record<string, string> = {
        Hardware: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
        Software: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
        Licenciamento: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
        Serviço: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
    };
    const catClass = product.category ? (categoryColors[product.category] || 'bg-muted text-foreground border-border') : 'bg-amber-500/10 text-amber-600 border-amber-500/20';

    return (
        <Sheet open={open} onOpenChange={v => { if (!v) safeExecute(onClose); }}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="w-full sm:max-w-[720px] flex flex-col p-0 gap-0"
                onPointerDownOutside={(e) => {
                    if (e.target instanceof Element && e.target.closest('.floating-save-bar')) {
                        e.preventDefault();
                    }
                }}
            >
                {/* ── Header ── */}
                <div className="border-b border-border px-5 pt-4 pb-3 shrink-0">
                    {/* Top row: nav + close */}
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={!hasPrev}
                                onClick={() => onNavigate(allProducts[currentIndex - 1].id)}
                                title="Produto anterior"
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <span className="text-[10px] font-bold text-muted-foreground tabular-nums">
                                {currentIndex + 1} / {allProducts.length}
                            </span>
                            <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                disabled={!hasNext}
                                onClick={() => onNavigate(allProducts[currentIndex + 1].id)}
                                title="Próximo produto"
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                        <div className="flex items-center gap-2">
                            {!isEditing && (
                                <Button variant="ghost" size="sm" onClick={onEnableEdit} className="h-7 px-2 text-[10px] font-bold uppercase tracking-wide text-primary hover:bg-primary/10">
                                    <Edit2 className="h-3 w-3 mr-1" /> Editar
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Product Name */}
                    <div className="flex items-start gap-2">
                        <div className="flex-1 min-w-0">
                            <SheetTitle className="font-bold text-foreground text-sm uppercase tracking-tight leading-tight truncate">{product.name}</SheetTitle>
                            <SheetDescription className="sr-only">Detalhes do produto {product.name}</SheetDescription>
                            {product.sku && <p className="text-[10px] font-mono text-muted-foreground/60 mt-0.5">{product.sku}</p>}
                        </div>
                        {product.category && (
                            <Badge variant="outline" className={`text-[9px] font-bold uppercase shrink-0 ${catClass}`}>
                                {product.category}
                            </Badge>
                        )}
                    </div>
                </div>

                {/* ── Tabs Bar ── */}
                <div className="border-b border-border bg-muted/20 px-4 shrink-0">
                    <div className="flex gap-0">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                    }`}
                            >
                                {tab.icon}
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Tab Content (scrollable) ── */}
                <div className="flex-1 overflow-y-auto px-5 py-5 custom-scrollbar">
                    {activeTab === 'financeiro' && (
                        <FinanceiroTab
                            product={product}
                            isEditing={isEditing}
                            editedDeal={editedDeal}
                            setEditedDeal={setEditedDeal}
                            dealOwner={dealOwner}
                            localDeduction={localDeduction}
                            setLocalDeduction={setLocalDeduction}
                        />
                    )}
                    {activeTab === 'classificacao' && (
                        <ClassificacaoTab
                            product={product}
                            isEditing={isEditing}
                            handleUpdateProduct={handleUpdateProduct}
                            distributors={distributors}
                        />
                    )}
                    {activeTab === 'precificacao' && (
                        <PrecificacaoTab
                            product={product}
                            isEditing={isEditing}
                            handleUpdateProduct={handleUpdateProduct}
                            setShowImportModal={setShowImportModal}
                            setTargetImportProductId={setTargetImportProductId}
                        />
                    )}
                    {activeTab === 'registros' && (
                        <RegistrosTab
                            product={product}
                            isEditing={isEditing}
                            handleUpdateProduct={handleUpdateProduct}
                            details={details}
                        />
                    )}
                </div>

                {/* ── Footer ── */}
                <div className="border-t border-border px-5 py-3 bg-muted/10 shrink-0">
                    <p className="text-[9px] text-muted-foreground text-center">
                        {isEditing ? 'As alterações são salvas automaticamente ao confirmar a edição.' : 'Clique em Editar para modificar os dados deste produto.'}
                    </p>
                </div>

                <FloatingSaveBar
                    isDirty={isDirty && !showUnsavedModal}
                    changedCount={changedCount}
                    isSaving={isSaving}
                    onSave={saveChanges}
                    onDiscard={discardChanges}
                />

                <UnsavedChangesDialog
                    open={showUnsavedModal}
                    onOpenChange={setShowUnsavedModal}
                    onSave={saveChanges}
                    onDiscard={discardChanges}
                    isSaving={isSaving}
                />
            </SheetContent>
        </Sheet>
    );
}
