import React from 'react';
import { toast } from 'sonner';

import { DollarSign, FileSpreadsheet, Edit2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TechnicalDetailsEditor } from '../TechnicalDetailsEditor';
import { ThemeCurrencyInput } from '@/components/ui/theme/ThemeComponents';
import { Switch } from '@/components/ui/switch';

import { calculateDealCommission } from '@/utils/commissionCalculator';
import { updateDeal } from '@/app/(dashboard)/pipeline/actions';
import type { ProductItem } from '../SortableProductRow';

interface ProductFinancialDetailsProps {
    product: ProductItem;
    isEditing: boolean;
    handleUpdateProduct: (prodId: string, field: keyof ProductItem, value: any) => void;
    handleInputKeyDown: (e: React.KeyboardEvent) => void;
    editedDeal: any;
    setEditedDeal: (deal: any) => void;
    dealOwner: any;
    setShowImportModal: (show: boolean) => void;
    setTargetImportProductId: (id: string | null) => void;
    distributors: any[];
    onEnableEdit: () => void;
    details: any[];
}

export function ProductFinancialDetails({
    product,
    isEditing,
    handleUpdateProduct,
    handleInputKeyDown,
    editedDeal,
    setEditedDeal,
    dealOwner,
    setShowImportModal,
    setTargetImportProductId,
    distributors,
    onEnableEdit,
    details
}: ProductFinancialDetailsProps) {
    // Law of Demeter: Avoid chaining deep object props in render
    const getOwnerFirstName = (owner: any) => {
        if (!owner) return 'Vendedor';
        const nameStr = typeof owner === 'string' ? owner : (owner.full_name || owner.name);
        if (!nameStr) return 'Vendedor';
        const parts = nameStr.split(' ');
        return parts[0] || 'Vendedor';
    };

    const ownerName = getOwnerFirstName(dealOwner);

    // Local state for commission_deduction — completely isolated from parent re-renders.
    // This prevents the value from being reset by revalidatePath cycles.
    // Syncs from editedDeal when the deal changes (different deal.id) or when entering edit mode.
    const [localDeduction, setLocalDeduction] = React.useState<number>(
        editedDeal.commission_deduction ?? 21
    );
    const lastDealId = React.useRef<string>(editedDeal.id);
    const lastEditingState = React.useRef<boolean>(isEditing);

    React.useEffect(() => {
        const dealChanged = lastDealId.current !== editedDeal.id;
        const justEnteredEditMode = isEditing && !lastEditingState.current;

        // Only sync from parent when navigating to a different deal
        // or when entering edit mode for the first time (pick up current DB value)
        if (dealChanged || justEnteredEditMode) {
            setLocalDeduction(editedDeal.commission_deduction ?? 21);
        }

        lastDealId.current = editedDeal.id;
        lastEditingState.current = isEditing;
    }, [editedDeal.id, editedDeal.commission_deduction, isEditing]);

    // Helper functions and derived state
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

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
                unit_price: priceValue,
                cost: costValue,
                quantity: qtyValue,
                category: product.category,
            }]
        },
        dealOwner?.commission_rules,
        dealOwner?.commission_rate || 0
    );

    return (
        <tr className="bg-primary/5 animate-in fade-in slide-in-from-top-2 duration-200">
            <td colSpan={7} className="px-12 py-6 border-b border-border">

                <div className="space-y-8">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Detalhes Financeiros</p>
                        {isEditing && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setTargetImportProductId(product.id);
                                    setShowImportModal(true);
                                }}
                                className="gap-1.5 h-8 text-[10px] uppercase font-bold text-primary border-primary/20 hover:bg-primary hover:text-primary-foreground"
                            >
                                <FileSpreadsheet className="h-3 w-3" />
                                Importar Planilha
                            </Button>
                        )}
                    </div>

                    {/* Financial Summary Row */}
                    <div className="flex items-center gap-4 bg-muted/60 border border-border rounded-2xl p-4 mb-6">
                        <div className="flex-1">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Custo Total</p>
                            <p className="text-sm font-bold text-foreground">
                                {formatCurrency(totalCost)}
                            </p>
                        </div>
                        <div className="flex-1 border-l border-border pl-4">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Margem Bruta</p>
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                                    {formatCurrency(grossMargin)}
                                </p>
                                <Badge variant="outline" className="text-[9px] font-mono text-muted-foreground bg-background">
                                    {product.margin?.toFixed(2)}%
                                </Badge>
                            </div>
                        </div>
                        <div className="flex-1 border-l border-border pl-4">
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1">Total Venda</p>
                            <p className="text-lg font-bold text-primary">
                                {formatCurrency(totalSales)}
                            </p>
                        </div>
                    </div>

                    {/* Commission & Deduction Block */}
                    <div className="bg-gradient-to-r from-emerald-500/10 to-transparent border border-emerald-500/20 rounded-2xl p-4 mb-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full pointer-events-none"></div>

                        <div className="flex items-center gap-6 relative z-10">
                            {/* Deduction Input */}
                            <div className="w-32">
                                <label className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wide mb-1 block">Dedução (%)</label>
                                {isEditing ? (
                                    <div className="relative">
                                        <Input
                                            type="number"
                                            className="w-full bg-background border-emerald-500/30 rounded-xl px-3 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 focus:ring-emerald-500 outline-none text-right pr-6"
                                            value={localDeduction}
                                            onChange={e => setLocalDeduction(Number(e.target.value))}
                                            onBlur={async e => {
                                                const val = Number(e.target.value);
                                                // Sync to parent state so commission calculation updates live
                                                setEditedDeal({ ...editedDeal, commission_deduction: val });
                                                try {
                                                    await updateDeal(editedDeal.id, { commission_deduction: val });
                                                    toast.success(`Dedução atualizada para ${val}%`);
                                                } catch (err) {
                                                    console.error('Erro ao salvar dedução:', err);
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

                            {/* Commission Display */}
                            <div className="flex-1 border-l border-emerald-500/20 pl-6">
                                <label className="text-[10px] font-bold text-emerald-600/70 uppercase tracking-wide mb-1 flex items-center gap-2">
                                    Comissão Estimada ({ownerName})
                                    {commissionData.appliedRate !== undefined && (
                                        <Badge variant="outline" className="text-[9px] font-black text-emerald-600 bg-emerald-500/10 border-emerald-500/20 h-4 px-1.5">
                                            {commissionData.appliedRate}%
                                        </Badge>
                                    )}
                                </label>
                                <div className="flex items-end gap-3">
                                    <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 drop-shadow-sm">
                                        {formatCurrency(commissionData.commission)}
                                    </p>
                                    <p className="text-[10px] text-emerald-600/70 mb-1.5 font-bold flex items-center gap-1">
                                        Base Líquida:
                                        <span className="text-emerald-600 dark:text-emerald-400 border-b border-emerald-500/30">
                                            {formatCurrency(commissionData.netMargin)}
                                        </span>
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main 3-column grid */}
                    <div className="grid grid-cols-3 gap-8 animate-in fade-in slide-in-from-top-1 duration-300">
                        {/* Column 1: Sourcing & Classification */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between h-6 mb-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                    <span className="w-1 h-1 bg-primary rounded-full"></span>
                                    Origem e Classificação
                                </p>
                            </div>

                            <div className="space-y-4 bg-muted/30 p-4 rounded-2xl border border-border">
                                {/* Category Badge */}
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Categoria</p>
                                    {isEditing ? (
                                        <select
                                            className="w-full bg-background border border-input rounded-xl px-2 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none h-8"
                                            value={product.category || ''}
                                            onChange={e => handleUpdateProduct(product.id, 'category', e.target.value)}
                                        >
                                            <option value="">Selecione...</option>
                                            {['Hardware', 'Software', 'Licenciamento', 'Serviço', 'Produto']
                                                .concat(product.category && !['Hardware', 'Software', 'Licenciamento', 'Serviço', 'Produto'].includes(product.category) ? [product.category] : [])
                                                .map(cat => (
                                                    <option key={cat} value={cat}>{cat}</option>
                                                ))
                                            }
                                        </select>
                                    ) : (
                                        <span className={`px-2 py-1.5 rounded-lg text-[10px] font-bold border block w-full truncate h-8 flex items-center ${product.category
                                            ? 'bg-background text-foreground border-input'
                                            : 'bg-amber-500/10 text-amber-600 border-amber-500/20'
                                            }`}>
                                            {product.category || 'Indefinida'}
                                        </span>
                                    )}
                                </div>


                                {/* Distributor Selector */}
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Distribuidor</p>
                                    {isEditing ? (
                                        <select
                                            className="w-full bg-background border border-input rounded-xl px-2 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none truncate h-8"
                                            value={product.distributor_id || ''}
                                            onChange={e => handleUpdateProduct(product.id, 'distributor_id', e.target.value)}
                                        >
                                            <option value="">Selecione...</option>
                                            {distributors.map((d: any) => (
                                                <option key={d.id} value={d.id}>{d.name}</option>
                                            ))}
                                        </select>
                                    ) : (
                                        <div className="w-full bg-background border border-input rounded-xl px-2 py-1.5 text-xs font-bold text-muted-foreground truncate h-8 flex items-center">
                                            {distributors.find((d: any) => d.id === product.distributor_id)?.name || '---'}
                                        </div>
                                    )}
                                </div>

                                {/* Distributor CNPJ Selector */}
                                {product.distributor_id && (
                                    <div className="animate-in fade-in slide-in-from-top-1 duration-200">
                                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">CNPJ de Faturamento</p>
                                        {isEditing ? (
                                            <select
                                                className="w-full bg-background border border-input rounded-xl px-2 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none truncate h-8"
                                                value={product.distributor_cnpj || ''}
                                                onChange={e => handleUpdateProduct(product.id, 'distributor_cnpj', e.target.value)}
                                            >
                                                <option value="">Selecione o CNPJ...</option>
                                                {(() => {
                                                    const selectedDist = distributors.find((d: any) => d.id === product.distributor_id);
                                                    if (!selectedDist) return null;

                                                    const options = [];
                                                    if (selectedDist.cnpj) options.push({ label: `Matriz - ${selectedDist.cnpj}`, value: selectedDist.cnpj });
                                                    if (selectedDist.account_branches?.length > 0) {
                                                        selectedDist.account_branches.forEach((b: any) => {
                                                            if (b.cnpj) options.push({ label: `${b.name} - ${b.cnpj}`, value: b.cnpj });
                                                        });
                                                    }
                                                    return options.map((opt, idx) => (
                                                        <option key={idx} value={opt.value}>{opt.label}</option>
                                                    ));
                                                })()}
                                            </select>
                                        ) : (
                                            <div className="w-full bg-background border border-input rounded-xl px-2 py-1.5 text-xs font-bold text-muted-foreground truncate h-8 flex items-center">
                                                {product.distributor_cnpj || '---'}
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Billing Type Selector */}
                                <div>
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Tipo de Faturamento</p>
                                    {isEditing ? (
                                        <select
                                            className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none h-[34px]"
                                            value={product.billing_type || 'indirect'}
                                            onChange={e => handleUpdateProduct(product.id, 'billing_type', e.target.value)}
                                        >
                                            <option value="direct">Revenda (Infodive)</option>
                                            <option value="indirect">Direto (Distribuidor)</option>
                                        </select>
                                    ) : (
                                        <div className="w-full bg-background border border-input rounded-xl px-3 py-2 text-xs font-bold text-muted-foreground h-[34px] flex items-center">
                                            {product.billing_type === 'indirect' ? 'Direto (Distribuidor)' : 'Revenda (Infodive)'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Column 2: Pricing & Costs */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between h-6 mb-2">
                                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-wide flex items-center gap-2">
                                    <span className="w-1 h-1 bg-emerald-500 rounded-full"></span>
                                    Precificação e Custos
                                </p>
                                {!isEditing && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={onEnableEdit}
                                        className="h-6 px-2 text-[9px] font-bold uppercase tracking-wide text-primary hover:text-primary-foreground hover:bg-primary"
                                    >
                                        <Edit2 className="h-3 w-3 mr-1" />
                                        Editar
                                    </Button>
                                )}
                            </div>

                            <div className="space-y-4 bg-emerald-500/5 p-4 rounded-2xl border border-emerald-500/10 relative overflow-hidden">
                                <div className="flex flex-col gap-2 mb-3">
                                    <div className="flex items-center justify-between gap-2">
                                        <label htmlFor={`usd-mode-${product.id}`} className="text-[10px] font-bold text-emerald-600/80 uppercase tracking-wide cursor-pointer flex items-center gap-2 select-none">
                                            Custo em Dólar (USD)
                                            <DollarSign className="h-3 w-3" />
                                        </label>
                                        <Switch
                                            id={`usd-mode-${product.id}`}
                                            checked={product.is_usd || false}
                                            disabled={!isEditing}
                                            onCheckedChange={checked => handleUpdateProduct(product.id, 'is_usd', checked)}
                                            className="scale-[0.65] data-[state=checked]:bg-emerald-500"
                                        />
                                    </div>
                                    
                                    {product.is_usd && (
                                        <div className="flex items-center justify-between gap-2 pl-5 animate-in fade-in slide-in-from-top-1">
                                            <label htmlFor={`present-usd-${product.id}`} className="text-[9px] font-bold text-emerald-600/70 uppercase tracking-wide cursor-pointer flex items-center select-none">
                                                Apresentar este produto em Dólar na Proposta (PDF)
                                            </label>
                                            <Switch
                                                id={`present-usd-${product.id}`}
                                                checked={product.present_in_usd || false}
                                                disabled={!isEditing}
                                                onCheckedChange={checked => handleUpdateProduct(product.id, 'present_in_usd', checked)}
                                                className="scale-[0.65] data-[state=checked]:bg-emerald-500"
                                            />
                                        </div>
                                    )}
                                </div>

                                {/* USD Inputs */}
                                {product.is_usd && (
                                    <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                        <div>
                                            <label className="text-[9px] font-bold text-emerald-600 uppercase block mb-1">Custo USD</label>
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    className="w-full bg-background border border-emerald-500/30 rounded-xl px-2 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-emerald-500 outline-none h-8"
                                                    value={product.usd_cost ?? ''}
                                                    onChange={e => handleUpdateProduct(product.id, 'usd_cost', Number(e.target.value))}
                                                    onFocus={(e: any) => e.target.select()}
                                                />
                                            ) : (
                                                <div className="w-full bg-background/50 border border-emerald-500/10 rounded-xl px-2 py-1.5 text-xs font-bold text-emerald-600 h-8 flex items-center">
                                                    US$ {product.usd_cost?.toLocaleString('en-US')}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-emerald-600 uppercase block mb-1">PTAX</label>
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    step="0.0001"
                                                    className="w-full bg-background border border-emerald-500/30 rounded-xl px-2 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-emerald-500 outline-none h-8"
                                                    value={product.exchange_rate ?? ''}
                                                    onChange={e => handleUpdateProduct(product.id, 'exchange_rate', Number(e.target.value))}
                                                    onFocus={(e: any) => e.target.select()}
                                                />
                                            ) : (
                                                <div className="w-full bg-background/50 border border-emerald-500/10 rounded-xl px-2 py-1.5 text-xs font-bold text-emerald-600 h-8 flex items-center">
                                                    {product.exchange_rate?.toFixed(4)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <Separator className="bg-emerald-500/10 my-2" />

                                {/* Cost & Margin Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-bold text-emerald-600 uppercase block mb-1">
                                            {product.is_usd ? 'Custo (R$)' : (product.is_bid ? 'Preço Venda (R$)' : 'Custo (R$)')}
                                        </label>
                                        {isEditing ? (
                                            <ThemeCurrencyInput
                                                className={`w-full bg-background border ${product.is_usd ? 'border-emerald-500/30 text-emerald-600' : 'border-input text-foreground'} rounded-xl px-2 py-1.5 text-xs font-bold focus:ring-1 focus:ring-primary outline-none disabled:opacity-70 disabled:cursor-not-allowed h-8 pl-8 text-left`}
                                                value={(product.is_bid ? product.unit_price : product.cost) || 0}
                                                onChange={(e: any) => {
                                                    // Update local state immediately for reactive display
                                                    handleUpdateProduct(product.id, product.is_bid ? 'unit_price' : 'cost', Number(e.target.value));
                                                }}
                                                onKeyDown={handleInputKeyDown}
                                                disabled={product.is_usd || false}
                                            />
                                        ) : (
                                            <div className="w-full bg-background border border-input rounded-xl px-2 py-1.5 text-xs font-bold text-foreground h-8 flex items-center">
                                                R$ {product.is_bid ? product.unit_price?.toLocaleString('pt-BR') : product.cost?.toLocaleString('pt-BR')}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-emerald-600 uppercase block mb-1">Margem (%)</label>
                                        {isEditing ? (
                                            <Input
                                                type="number"
                                                className="w-full bg-background border border-input rounded-xl px-2 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-primary outline-none h-8"
                                                value={product.margin ?? ''}
                                                onChange={(e: any) => handleUpdateProduct(product.id, 'margin', e.target.value === '' ? undefined : Number(e.target.value))}
                                                onKeyDown={handleInputKeyDown}
                                                onFocus={(e: any) => e.target.select()}
                                            />
                                        ) : (
                                            <div className="w-full bg-background border border-input rounded-xl px-2 py-1.5 text-xs font-black text-primary h-8 flex items-center">
                                                {product.margin || 0}%
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Separator className="bg-emerald-500/10 my-2" />

                                {/* Duração e Contrato - Enhanced Visibility */}
                                <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3 space-y-3">
                                    <div className="flex items-center gap-2 mb-1">
                                        <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></div>
                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-wide">Modelo de Precificação</p>
                                    </div>

                                    {/* Pricing Model Selector */}
                                    <div>
                                        <label className="text-[9px] font-bold text-amber-600/70 uppercase block mb-1">Tipo de Cobrança</label>
                                        {isEditing ? (
                                            <select
                                                className="w-full bg-background border-amber-500/20 rounded-xl px-2 py-0 text-xs font-bold text-foreground focus:ring-1 focus:ring-amber-500 outline-none h-8"
                                                value={product.pricing_model || 'one_time'}
                                                onChange={(e: any) => {
                                                    const model = e.target.value;
                                                    handleUpdateProduct(product.id, 'pricing_model', model);
                                                    if (model === 'monthly' && !product.duration_unit) {
                                                        handleUpdateProduct(product.id, 'duration_unit', 'meses');
                                                    } else if (model === 'annual' && !product.duration_unit) {
                                                        handleUpdateProduct(product.id, 'duration_unit', 'anos');
                                                    }
                                                }}
                                            >
                                                <option value="one_time">💰 Pagamento Único</option>
                                                <option value="monthly">🔄 Mensal (SaaS)</option>
                                                <option value="annual">📅 Anual (Subscrição)</option>
                                            </select>
                                        ) : (
                                            <div className="w-full bg-background border-amber-500/10 rounded-xl px-2 py-1.5 text-xs font-bold text-foreground h-8 flex items-center">
                                                {product.pricing_model === 'monthly' ? '🔄 Mensal (SaaS)' :
                                                 product.pricing_model === 'annual' ? '📅 Anual (Subscrição)' :
                                                 '💰 Pagamento Único'}
                                            </div>
                                        )}
                                    </div>

                                    {/* Duration fields - only relevant for recurring */}
                                    {(product.pricing_model === 'monthly' || product.pricing_model === 'annual' || product.duration) && (
                                        <>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="text-[9px] font-bold text-amber-600/70 uppercase block mb-1">Duração (Qtd)</label>
                                            {isEditing ? (
                                                <Input
                                                    type="number"
                                                    className="w-full bg-background border-amber-500/20 rounded-xl px-2 py-1.5 text-xs font-bold text-foreground focus:ring-1 focus:ring-amber-500 outline-none h-8"
                                                    value={product.duration ?? ''}
                                                    onChange={(e: any) => handleUpdateProduct(product.id, 'duration', e.target.value === '' ? null : Number(e.target.value))}
                                                    onKeyDown={handleInputKeyDown}
                                                    placeholder="Ex: 36"
                                                />
                                            ) : (
                                                <div className="w-full bg-background border-amber-500/10 rounded-xl px-2 py-1.5 text-xs font-bold text-foreground h-8 flex items-center">
                                                    {product.duration || '---'}
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-amber-600/70 uppercase block mb-1">Período</label>
                                            {isEditing ? (
                                                <select
                                                    className="w-full bg-background border-amber-500/20 rounded-xl px-2 py-0 text-xs font-bold text-foreground focus:ring-1 focus:ring-amber-500 outline-none h-8"
                                                    value={product.duration_unit || ''}
                                                    onChange={(e: any) => handleUpdateProduct(product.id, 'duration_unit', e.target.value || null)}
                                                >
                                                    <option value="">Nenhum</option>
                                                    <option value="meses">Meses</option>
                                                    <option value="anos">Anos</option>
                                                </select>
                                            ) : (
                                                <div className="w-full bg-background border-amber-500/10 rounded-xl px-2 py-1.5 text-xs font-bold text-foreground h-8 flex items-center capitalize">
                                                    {product.duration_unit || '---'}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    {isEditing && !product.duration && (
                                        <p className="text-[9px] text-amber-600/60 italic font-medium">Preencha a duração do contrato para exibir na proposta.</p>
                                    )}
                                        </>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Column 3: Registration & BID */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between h-6 mb-2">
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                                    <span className="w-1 h-1 bg-teal-500 rounded-full"></span>
                                    Registros e Controle
                                </p>
                            </div>

                            <div className="space-y-4 bg-muted/30 p-4 rounded-2xl border border-border">
                                {/* Manufacturer Reg */}
                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">ID Oportunidade</label>
                                        {isEditing ? (
                                            <Input
                                                type="text"
                                                className="w-full bg-background border border-input rounded-xl px-2 py-1.5 text-xs text-foreground h-8"
                                                placeholder="Ex: 12345678"
                                                value={product.external_id || ''}
                                                onChange={e => handleUpdateProduct(product.id, 'external_id', e.target.value)}
                                                onKeyDown={handleInputKeyDown}
                                            />
                                        ) : (
                                            <div className="w-full bg-background border border-input rounded-xl px-2 py-1.5 text-xs font-bold text-foreground h-8 flex items-center">
                                                {product.external_id || '---'}
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <label className="text-[9px] font-bold text-muted-foreground uppercase block mb-1">Validade Reg.</label>
                                        {isEditing ? (
                                            <Input
                                                type="date"
                                                className="w-full bg-background border border-input rounded-xl px-2 py-1.5 text-xs text-foreground h-8"
                                                value={product.expiration_date || ''}
                                                onChange={e => handleUpdateProduct(product.id, 'expiration_date', e.target.value)}
                                                onKeyDown={handleInputKeyDown}
                                            />
                                        ) : (
                                            <div className="w-full bg-background border border-input rounded-xl px-2 py-1.5 text-xs font-bold text-foreground h-8 flex items-center">
                                                {product.expiration_date ? new Date(product.expiration_date).toLocaleDateString('pt-BR') : '---'}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <Separator className="bg-border my-2" />

                                {/* BID Options - Integrated */}
                                <div className="space-y-3">

                                    <div className="flex items-center justify-between gap-2 mb-2">
                                        <label htmlFor={`bid-mode-${product.id}`} className="text-[10px] font-bold text-primary uppercase tracking-wide cursor-pointer flex items-center gap-2 select-none">
                                            Modo BID (Preço Fixo)
                                        </label>
                                        <Switch
                                            id={`bid-mode-${product.id}`}
                                            checked={product.is_bid || false}
                                            disabled={!isEditing}
                                            onCheckedChange={checked => handleUpdateProduct(product.id, 'is_bid', checked)}
                                            className="scale-[0.65]"
                                        />
                                    </div>

                                    {product.is_bid && (
                                        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <div>
                                                <label className="text-[9px] font-bold text-blue-500/70 uppercase block mb-1">Número BID</label>
                                                {isEditing ? (
                                                    <Input
                                                        type="text"
                                                        className="w-full bg-background border border-blue-500/20 rounded-xl px-2 py-1.5 text-xs text-foreground h-8"
                                                        placeholder="BID-001"
                                                        value={product.bid_number || ''}
                                                        onChange={e => handleUpdateProduct(product.id, 'bid_number', e.target.value)}
                                                        onKeyDown={handleInputKeyDown}
                                                    />
                                                ) : (
                                                    <div className="w-full bg-background border border-input rounded-xl px-2 py-1.5 text-xs font-bold text-foreground h-8 flex items-center">
                                                        {product.bid_number || '---'}
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-bold text-blue-500/70 uppercase block mb-1">Validade</label>
                                                {isEditing ? (
                                                    <Input
                                                        type="date"
                                                        className="w-full bg-background border border-blue-500/20 rounded-xl px-2 py-1.5 text-xs text-foreground h-8"
                                                        value={product.bid_validity || ''}
                                                        onChange={e => handleUpdateProduct(product.id, 'bid_validity', e.target.value)}
                                                        onKeyDown={handleInputKeyDown}
                                                    />
                                                ) : (
                                                    <div className="w-full bg-background border border-input rounded-xl px-2 py-1.5 text-xs font-bold text-foreground h-8 flex items-center">
                                                        {product.bid_validity ? new Date(product.bid_validity).toLocaleDateString('pt-BR') : '---'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                    {!product.is_bid && (
                                        <p className="text-[10px] text-muted-foreground italic px-1">
                                            Preço de Venda calculado via Margem.
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Product Details Table - Full Width */}
                <div className="pt-4">
                    {isEditing ? (
                        <TechnicalDetailsEditor
                            details={details}
                            parentQuantity={product.quantity || 1}
                            onChange={(newDetails: any[]) => handleUpdateProduct(product.id, 'description', JSON.stringify(newDetails))}
                        />
                    ) : (
                        <div>
                            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide mb-2">Composição Técnica Definida</p>
                            <div className="bg-card border border-border rounded-xl p-4">
                                {details.length === 0 ? (
                                    <p className="text-sm text-muted-foreground">Nenhum detalhe técnico.</p>
                                ) : (
                                    <ul className="space-y-1">
                                        {details.filter((d: any) => d.is_visible_on_proposal !== false).map((d: any, i: number) => (
                                            <li key={i} className="text-sm text-foreground flex items-center justify-between">
                                                <span><span className="text-muted-foreground mr-2">{d.quantity}x</span> {d.description}</span>
                                                {d.is_highlighted_on_grid && (
                                                    <Badge variant="outline" className="text-[9px] bg-primary/10 text-primary border-primary/20 uppercase">
                                                        Destacado: {d.grid_label || 'Sim'}
                                                    </Badge>
                                                )}
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </td>
        </tr>
    );
}
