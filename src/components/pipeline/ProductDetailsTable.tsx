import { useState, useRef, useEffect } from 'react';
import { Check, Edit2, Trash2, TrendingUp, DollarSign, Package, ChevronDown, ChevronUp, Plus, X, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ThemeCurrencyInput } from '@/components/ui/theme/ThemeComponents';
import { formatCurrency } from '@/utils/format';

interface ProductDetailsTableProps {
    details: any[];
    isDealEditing: boolean;
    onUpdate: (d: any[]) => void;
    isBidMode?: boolean;
    productMargin?: number;
    proposalSpecs?: number[];
    onProposalSpecsChange?: (indices: number[]) => void;
}

interface SubItem {
    sku: string;
    description: string;
    quantity: number;
    unit_price: number;
}

const SubItemEditor = ({
    items,
    onSave,
    onClose
}: {
    items: SubItem[],
    onSave: (newItems: SubItem[]) => void,
    onClose: () => void
}) => {
    const [localItems, setLocalItems] = useState<SubItem[]>(items);

    const handleAddItem = () => {
        setLocalItems([...localItems, { sku: '', description: '', quantity: 1, unit_price: 0 }]);
    };

    const handleRemoveItem = (idx: number) => {
        setLocalItems(localItems.filter((_, i) => i !== idx));
    };

    const handleUpdateItem = (idx: number, field: keyof SubItem, value: any) => {
        const updated = [...localItems];
        updated[idx] = { ...updated[idx], [field]: value };
        setLocalItems(updated);
    };

    const totalCost = localItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-xl w-full max-w-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
                <div className="p-5 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Settings className="h-4 w-4 text-primary" />
                        <h3 className="text-sm font-semibold text-foreground tracking-tight">Editor de Sub-itens / Bundle</h3>
                    </div>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-5 space-y-3 bg-muted/30">
                    {localItems.map((item, idx) => (
                        <div key={idx} className="bg-card border border-border rounded-lg p-4 flex gap-3 items-start group hover:border-primary/50 transition-colors shadow-sm">
                            <div className="grid grid-cols-12 gap-3 flex-1">
                                <div className="col-span-3">
                                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">SKU</label>
                                    <input
                                        type="text"
                                        value={item.sku}
                                        onChange={(e) => handleUpdateItem(idx, 'sku', e.target.value)}
                                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary font-mono"
                                        placeholder="SKU"
                                    />
                                </div>
                                <div className="col-span-12 md:col-span-5">
                                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Descrição</label>
                                    <input
                                        type="text"
                                        value={item.description}
                                        onChange={(e) => handleUpdateItem(idx, 'description', e.target.value)}
                                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
                                        placeholder="Nome do componente"
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Qtd</label>
                                    <input
                                        type="number"
                                        value={item.quantity}
                                        onChange={(e) => handleUpdateItem(idx, 'quantity', Number(e.target.value))}
                                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary text-center"
                                    />
                                </div>
                                <div className="col-span-6 md:col-span-2">
                                    <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block mb-1.5">Custo Unit</label>
                                    <ThemeCurrencyInput
                                        value={item.unit_price}
                                        onChange={(e) => handleUpdateItem(idx, 'unit_price', Number(e.target.value))}
                                        className="w-full bg-background border border-input rounded-md px-3 py-2 text-xs text-foreground outline-none focus:ring-1 focus:ring-primary text-right"
                                    />
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveItem(idx)}
                                className="mt-6 h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                    ))}

                    <Button
                        variant="outline"
                        onClick={handleAddItem}
                        className="w-full py-6 border-dashed border-2 flex items-center justify-center gap-2 text-muted-foreground hover:text-primary hover:border-primary/50 hover:bg-primary/5 transition-all group h-auto"
                    >
                        <Plus className="h-4 w-4 group-hover:scale-110 transition-transform" />
                        <span className="text-xs font-bold uppercase tracking-wide">Adicionar Item ao Bundle</span>
                    </Button>
                </div>

                <div className="p-5 border-t border-border bg-muted/10 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wide">Custo Total Consolidado</p>
                        <p className="text-xl font-bold text-primary">
                            {formatCurrency(totalCost)}
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <Button variant="outline" onClick={onClose} size="sm">Cancelar</Button>
                        <Button onClick={() => onSave(localItems)} size="sm">
                            Salvar Alterações
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const BundleRenderer = ({ jsonString, isEditingEnabled, onUpdate }: { jsonString: string, isEditingEnabled: boolean, onUpdate?: (newJson: string) => void }) => {
    const [expanded, setExpanded] = useState(false);
    const [isEditing, setIsEditing] = useState(false);

    try {
        const items = JSON.parse(jsonString);
        if (!Array.isArray(items)) return <span className="text-xs text-muted-foreground font-medium">{jsonString}</span>;

        return (
            <div className="space-y-2">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => setExpanded(!expanded)}
                        className="flex items-center gap-2 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                    >
                        <Package className="h-3.5 w-3.5" />
                        <span>Bundle com {items.length} itens</span>
                        {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                    </button>

                    {isEditingEnabled && (
                        <button
                            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
                            className="p-1 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md transition-colors"
                            title="Editar composição do bundle"
                        >
                            <Edit2 className="h-3 w-3" />
                        </button>
                    )}
                </div>

                {expanded && (
                    <div className="pl-2 border-l-2 border-border space-y-1">
                        {items.map((item: any, idx: number) => (
                            <div key={idx} className="text-[10px] text-muted-foreground flex justify-between gap-4">
                                <span className="flex-1 truncate">{item.quantity}x {item.description}</span>
                                <span className="font-mono text-muted-foreground/70">{item.sku}</span>
                            </div>
                        ))}
                    </div>
                )}

                {isEditing && (
                    <SubItemEditor
                        items={items}
                        onClose={() => setIsEditing(false)}
                        onSave={(newItems) => {
                            onUpdate?.(JSON.stringify(newItems));
                            setIsEditing(false);
                        }}
                    />
                )}
            </div>
        );
    } catch {
        return <p className="text-xs text-muted-foreground font-medium">{jsonString}</p>;
    }
};

// Helper Component for Details Table
export const ProductDetailsTable = ({ details, isDealEditing, onUpdate, isBidMode = false, productMargin = 0, proposalSpecs, onProposalSpecsChange }: ProductDetailsTableProps) => {
    // Stores the indices of rows currently being edited
    const [editingRows, setEditingRows] = useState<number[]>([]);
    // Stores the indices of selected rows for bulk delete
    const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());

    // If details change (e.g. added new row from parent), we might need to auto-edit the new row
    const prevDetailsLengthRef = useRef(details.length);

    useEffect(() => {
        const diff = details.length - prevDetailsLengthRef.current;
        if (diff > 0) {
            // New row(s) added!
            const lastRow = details[details.length - 1];
            // "Fresh" row template has empty SKU and Description
            const isFreshRow = !lastRow.sku && !lastRow.description;

            if (diff === 1 && isFreshRow) {
                const newIdx = details.length - 1;
                setEditingRows(prev => [...prev, ...(!prev.includes(newIdx) ? [newIdx] : [])]);
            }
        }
        prevDetailsLengthRef.current = details.length;
    }, [details.length]);

    if (details.length === 0 && !isDealEditing) {
        return (
            <div className="bg-muted/20 border border-border rounded-xl px-4 py-12 text-center flex flex-col items-center gap-3">
                <Package className="h-10 w-10 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">Nenhum item adicionado a esta oportunidade.</p>
            </div>
        );
    }

    const toggleEdit = (idx: number) => {
        setEditingRows(prev => {
            if (prev.includes(idx)) return prev.filter(i => i !== idx);
            return [...prev, idx];
        });
    };

    const toggleSelectRow = (idx: number) => {
        setSelectedRows(prev => {
            const newSet = new Set(prev);
            if (newSet.has(idx)) {
                newSet.delete(idx);
            } else {
                newSet.add(idx);
            }
            return newSet;
        });
    };

    const toggleSelectAll = () => {
        if (selectedRows.size === details.length && details.length > 0) {
            setSelectedRows(new Set());
        } else {
            setSelectedRows(new Set(details.map((_, idx) => idx)));
        }
    };

    const handleBulkDelete = () => {
        if (selectedRows.size === 0) return;

        if (!window.confirm(`Remover ${selectedRows.size} item(ns) selecionado(s)?`)) {
            return;
        }

        const updated = details.filter((_, idx) => !selectedRows.has(idx));
        onUpdate(updated);
        setSelectedRows(new Set());
    };

    const isAllSelected = details.length > 0 && selectedRows.size === details.length;

    // Helper functions for calc
    const calculateSalesPrice = (cost: number, margin: number) => {
        const denominator = 1 - (margin / 100);
        return denominator > 0.001 ? cost / denominator : cost * 1.5; // Fail safe
    };

    const calculateCost = (price: number, margin: number) => {
        return price * (1 - (margin / 100));
    };

    return (
        <div className="bg-card rounded-xl overflow-hidden shadow-sm border border-border">
            {/* Bulk Delete Button */}
            {isDealEditing && selectedRows.size > 0 && (
                <div className="px-4 py-3 bg-destructive/10 border-b border-destructive/20 flex justify-end">
                    <button
                        onClick={handleBulkDelete}
                        className="flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md font-medium text-xs hover:bg-destructive/90 transition-all"
                    >
                        <Trash2 className="h-4 w-4" />
                        Remover {selectedRows.size} Selecionado(s)
                    </button>
                </div>
            )}
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-muted/50 border-b border-border">
                        <tr>
                            <th className="px-4 py-3 text-center w-12">
                                <div className="flex items-center justify-center">
                                    <input
                                        type="checkbox"
                                        checked={isAllSelected}
                                        onChange={toggleSelectAll}
                                        className="h-4 w-4 rounded border-input bg-background"
                                        title="Selecionar todos"
                                    />
                                </div>
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-40">SKU/PartNumber</th>
                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                Descrição
                                <span className="ml-1 text-primary/60 normal-case font-normal text-[10px]">(+ nome na proposta)</span>
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center w-24">Qtd</th>

                            {/* Dynamic Columns based on Mode */}
                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right w-32">
                                {isBidMode ? 'Preço Venda' : 'Custo'}
                            </th>
                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center w-24">Margem (%)</th>
                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right w-32">
                                {isBidMode ? 'Custo (Calc)' : 'Preço Venda'}
                            </th>

                            <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right w-32">Total</th>
                            {onProposalSpecsChange && (
                                <th className="px-4 py-3 text-xs font-semibold text-amber-600 uppercase tracking-wider text-center w-20" title="Marcar para aparecer nas Specs Técnicas da proposta">
                                    📄 Proposta
                                </th>
                            )}
                            {isDealEditing && <th className="px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider text-center w-24">Ações</th>}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {details.map((detail: any, idx: number) => {
                            const isRowEditing = editingRows.includes(idx);

                            // Handle Values Logic
                            const rawValue = detail.unit_price || 0;
                            const qty = detail.quantity || 0;

                            // Identify what 'rawValue' means based on mode
                            // If !isBidMode -> rawValue is COST.
                            // If isBidMode -> rawValue is SALES PRICE.

                            let displayCost = 0;
                            let displayPrice = 0;

                            if (isBidMode) {
                                displayPrice = rawValue; // Master
                                displayCost = calculateCost(displayPrice, productMargin); // Derived
                            } else {
                                displayCost = rawValue; // Master
                                displayPrice = calculateSalesPrice(displayCost, productMargin); // Derived
                            }

                            const lineTotal = displayPrice * qty; // Always show Total Sales Price

                            return (
                                <tr key={idx} className={`group transition-colors ${selectedRows.has(idx) ? 'bg-muted/50' : 'hover:bg-muted/30'}`}>
                                    <td className="px-4 py-3 text-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedRows.has(idx)}
                                            onChange={() => toggleSelectRow(idx)}
                                            className="h-4 w-4 rounded border-input bg-background"
                                        />
                                    </td>
                                    {/* ... rest of columns ... */}
                                    <td className="px-4 py-3">
                                        {isRowEditing ? (
                                            <input
                                                type="text"
                                                className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                                                placeholder="SKU"
                                                value={detail.sku || ''}
                                                onChange={e => {
                                                    const updated = [...details];
                                                    updated[idx] = { ...updated[idx], sku: e.target.value };
                                                    onUpdate(updated);
                                                }}
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-foreground">{detail.sku || '---'}</p>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        {isRowEditing ? (
                                            <div className="space-y-2">
                                                {/* IBM/Catalog name - read-only reference */}
                                                <div>
                                                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Nome Técnico (IBM)</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-muted/30 border border-input rounded-md px-3 py-1.5 text-xs text-muted-foreground outline-none font-mono cursor-not-allowed"
                                                        value={detail.name || ''}
                                                        readOnly
                                                        title="Nome original do catálogo — não editável aqui"
                                                    />
                                                </div>
                                                {/* Friendly display name for proposal */}
                                                <div>
                                                    <label className="text-[9px] font-bold text-primary uppercase tracking-wider block mb-1">📄 Nome na Proposta</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-background border border-primary/30 rounded-md px-3 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none placeholder:text-muted-foreground/50"
                                                        placeholder={`${detail.name || 'Nome para o cliente...'}`}
                                                        value={detail.display_name || ''}
                                                        onChange={e => {
                                                            const updated = [...details];
                                                            updated[idx] = { ...updated[idx], display_name: e.target.value || null };
                                                            onUpdate(updated);
                                                        }}
                                                    />
                                                </div>
                                                {/* Original description field */}
                                                <div>
                                                    <label className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider block mb-1">Descrição Interna</label>
                                                    <input
                                                        type="text"
                                                        className="w-full bg-background border border-input rounded-md px-3 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
                                                        placeholder="Descrição"
                                                        value={detail.description || ''}
                                                        onChange={e => {
                                                            const updated = [...details];
                                                            updated[idx] = { ...updated[idx], description: e.target.value };
                                                            onUpdate(updated);
                                                        }}
                                                    />
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-1">
                                                {detail.description?.trim().startsWith('[') ? (
                                                    <BundleRenderer
                                                        jsonString={detail.description}
                                                        isEditingEnabled={isDealEditing}
                                                        onUpdate={(newJson) => {
                                                            const updated = [...details];
                                                            let newCost = 0;
                                                            try {
                                                                const items = JSON.parse(newJson);
                                                                newCost = items.reduce((sum: number, item: any) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);
                                                            } catch (e) { }

                                                            updated[idx] = {
                                                                ...updated[idx],
                                                                description: newJson,
                                                                unit_price: newCost
                                                            };
                                                            onUpdate(updated);
                                                        }}
                                                    />
                                                ) : (
                                                    <div className="space-y-0.5">
                                                        {detail.display_name ? (
                                                            <>
                                                                <p className="text-sm font-semibold text-foreground">{detail.display_name}</p>
                                                                <p className="text-[10px] text-muted-foreground/60 font-mono truncate" title={detail.name}>{detail.name}</p>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm text-muted-foreground">{detail.description || detail.name || '---'}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {isRowEditing ? (
                                            <input
                                                type="number"
                                                className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none text-center"
                                                value={detail.quantity ?? ''}
                                                onFocus={(e) => e.target.select()}
                                                onChange={e => {
                                                    const updated = [...details];
                                                    updated[idx] = { ...updated[idx], quantity: Number(e.target.value) || 0 };
                                                    onUpdate(updated);
                                                }}
                                            />
                                        ) : (
                                            <Badge variant="outline" className="font-mono font-medium">
                                                {detail.quantity || 0}
                                            </Badge>
                                        )}
                                    </td>

                                    {/* Master Value Column */}
                                    <td className="px-4 py-3 text-right">
                                        {isRowEditing ? (
                                            <ThemeCurrencyInput
                                                className="w-full bg-background border border-input rounded-md px-2 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none text-right"
                                                value={detail.unit_price ?? 0}
                                                onChange={e => {
                                                    const updated = [...details];
                                                    updated[idx] = { ...updated[idx], unit_price: Number(e.target.value) || 0 };
                                                    onUpdate(updated);
                                                }}
                                            />
                                        ) : (
                                            <p className="text-sm font-medium text-foreground">
                                                {formatCurrency(isBidMode ? displayPrice : displayCost)}
                                            </p>
                                        )}
                                    </td>

                                    {/* Margin (Read Only) */}
                                    <td className="px-4 py-3 text-center">
                                        <Badge variant="secondary" className="font-mono text-xs">
                                            {productMargin}%
                                        </Badge>
                                    </td>

                                    {/* Derived Value Column (Read Only) */}
                                    <td className="px-4 py-3 text-right">
                                        <p className="text-sm text-muted-foreground">
                                            {formatCurrency(isBidMode ? displayCost : displayPrice)}
                                        </p>
                                    </td>

                                    {/* Line Total (Based on Driver) */}
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex flex-col items-end">
                                            <p className={`text-sm font-bold ${isBidMode ? 'text-primary' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                                {formatCurrency(lineTotal)}
                                            </p>
                                            <span className="text-[10px] text-muted-foreground uppercase">Total Venda</span>
                                        </div>
                                    </td>


                                    {onProposalSpecsChange && (
                                        <td className="px-4 py-3 text-center">
                                            <input
                                                type="checkbox"
                                                title="Incluir como característica técnica na proposta"
                                                checked={proposalSpecs?.includes(idx) ?? false}
                                                onChange={() => {
                                                    const current = proposalSpecs || [];
                                                    const next = current.includes(idx)
                                                        ? current.filter(i => i !== idx)
                                                        : [...current, idx].sort((a, b) => a - b);
                                                    onProposalSpecsChange(next);
                                                }}
                                                className="h-4 w-4 rounded border-amber-400 accent-amber-500"
                                            />
                                        </td>
                                    )}
                                    {
                                        isDealEditing && (
                                            <td className="px-4 py-3 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {isRowEditing ? (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleEdit(idx)}
                                                            className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => toggleEdit(idx)}
                                                            className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </Button>
                                                    )}

                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => {
                                                            const updated = details.filter((_: any, i: number) => i !== idx);
                                                            onUpdate(updated);
                                                            setEditingRows(prev => prev.filter(i => i !== idx).map(i => i > idx ? i - 1 : i));
                                                        }}
                                                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        )
                                    }
                                </tr>
                            );
                        })}
                    </tbody>
                    {/* Table Footer with Totals */}
                    <tfoot className="bg-muted/50 border-t border-border font-medium text-sm text-foreground">
                        <tr>
                            <td colSpan={3} className="px-4 py-4 text-right uppercase text-xs tracking-wider text-muted-foreground">Totais:</td>
                            <td className="px-4 py-4 text-center font-bold">
                                {details.reduce((acc, d) => acc + (Number(d.quantity) || 0), 0)}
                            </td>
                            <td className="px-4 py-4 text-right">
                                -
                            </td>
                            <td className="px-4 py-4 text-center">
                                -
                            </td>
                            <td className="px-4 py-4 text-right">
                                -
                            </td>
                            <td className="px-4 py-4 text-right text-base font-bold text-primary">
                                {formatCurrency(
                                    details.reduce((acc, d) => {
                                        const qty = Number(d.quantity) || 0;
                                        const val = Number(d.unit_price) || 0;
                                        // If !isBidMode, val is Cost. Convert to Price.
                                        const price = isBidMode ? val : calculateSalesPrice(val, productMargin);
                                        return acc + (qty * price);
                                    }, 0)
                                )}
                            </td>
                            {onProposalSpecsChange && <td></td>}
                            {isDealEditing && <td></td>}
                        </tr>
                    </tfoot>
                </table>
            </div>
        </div >
    );
};
