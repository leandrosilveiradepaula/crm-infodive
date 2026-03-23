'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Plus, Trash2, GripVertical, Check, X, Eye, EyeOff, LayoutTemplate } from 'lucide-react';
import { type ProductTechDetail } from '@/types/deal';

interface TechnicalDetailsEditorProps {
    details: ProductTechDetail[];
    onChange: (details: ProductTechDetail[]) => void;
    parentQuantity: number;
}

export const TechnicalDetailsEditor: React.FC<TechnicalDetailsEditorProps> = ({ details, onChange, parentQuantity }) => {
    const [editingId, setEditingId] = useState<string | null>(null);
    const descriptionInputRef = useRef<HTMLInputElement>(null);

    // Auto-focus logic for newly added items
    useEffect(() => {
        if (editingId && descriptionInputRef.current) {
            descriptionInputRef.current.focus();
            descriptionInputRef.current.select();
            // Reset editingId after focusing so it doesn't keep focusing if something else re-renders
            // But we might want to keep it if we want to track which one is being edited.
            // Actually, for a single "pop" of focus, we can reset it or just leave it if it only runs once per added item.
            // Let's use a separate flag if needed, but checking for editingId change in deps should be enough.
        }
    }, [editingId, details.length]);

    const handleNormalize = () => {
        if (!parentQuantity || parentQuantity <= 1) return;

        const normalized = details.map(item => ({
            ...item,
            quantity: Number((item.quantity / parentQuantity).toFixed(4)) // Use precision but keep as number
        }));

        onChange(normalized);
    };

    const handleAdd = () => {
        const newItem: ProductTechDetail = {
            id: `manual-${Date.now()}`,
            description: 'Novo Item',
            quantity: 1,
            unit_price: 0,
            unit_cost: 0,
            is_visible_on_proposal: true,
            is_highlighted_on_grid: false,
        };
        onChange([...details, newItem]);
        setEditingId(newItem.id);
    };

    const handleRemove = (id: string) => {
        onChange(details.filter(d => d.id !== id));
        if (editingId === id) setEditingId(null);
    };

    const handleUpdate = (id: string, field: keyof ProductTechDetail, value: any) => {
        let updatedDetails = details.map(d => {
            if (d.id === id) {
                // If turning off visible but it was highlighted, turn off highlight too
                if (field === 'is_visible_on_proposal' && value === false) {
                    return { ...d, [field]: value, is_highlighted_on_grid: false };
                }
                return { ...d, [field]: value };
            }
            return d;
        });

        // Trigger sort automatically if toggling visibility
        if (field === 'is_visible_on_proposal') {
            updatedDetails = updatedDetails.sort((a, b) => {
                const aVis = a.is_visible_on_proposal === true ? 1 : 0;
                const bVis = b.is_visible_on_proposal === true ? 1 : 0;
                return bVis - aVis;
            });
        }

        onChange(updatedDetails);
    };

    const handleDragStart = (e: React.DragEvent, index: number) => {
        e.dataTransfer.setData('text/plain', index.toString());
    };

    const handleDrop = (e: React.DragEvent, dropIndex: number) => {
        e.preventDefault();
        const dragIndex = parseInt(e.dataTransfer.getData('text/plain'));
        if (dragIndex === dropIndex) return;

        const newDetails = [...details];
        const [draggedItem] = newDetails.splice(dragIndex, 1);
        newDetails.splice(dropIndex, 0, draggedItem);
        onChange(newDetails);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const totals = details.reduce((acc, item) => ({
        cost: acc.cost + (item.unit_cost || 0) * item.quantity,
        price: acc.price + (item.unit_price || 0) * item.quantity
    }), { cost: 0, price: 0 });

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center mb-2">
                <div>
                    <h4 className="text-sm font-bold text-foreground">Editor de Detalhes Técnicos</h4>
                    <p className="text-xs text-muted-foreground">Arraste para reordenar. Oculte ou destaque itens na proposta final.</p>
                </div>
                <button
                    onClick={handleAdd}
                    className="flex items-center gap-1.5 text-xs font-bold bg-primary/10 text-primary hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors"
                >
                    <Plus className="h-3.5 w-3.5" />
                    Adicionar Item
                </button>
            </div>

            {/* Normalizer Toolbar */}
            <div className={`bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-wrap items-center justify-between gap-4 ${(!parentQuantity || parentQuantity <= 1) ? 'opacity-50 grayscale' : ''}`}>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <LayoutTemplate className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest leading-none mb-1">Normalizador Automático</p>
                        <p className="text-[11px] text-muted-foreground font-medium">Dividir itens internos pela quantidade do produto ({parentQuantity} un).</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <button
                        onClick={handleNormalize}
                        disabled={!parentQuantity || parentQuantity <= 1 || details.length === 0}
                        className="h-9 px-4 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-primary disabled:opacity-30 disabled:grayscale transition-all flex items-center gap-2 shadow-sm"
                    >
                        Normalizar para 1 un.
                    </button>
                </div>
            </div>

            <div className="bg-card border border-border rounded-xl overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-muted">
                        <tr>
                            <th className="w-8 px-3 py-2"></th>
                            <th className="px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Descrição Técnico/Comercial</th>
                            <th className="w-20 px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider text-right">Qtd</th>
                            <th className="w-32 px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider text-right">Custo (Unit)</th>
                            <th className="w-32 px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider text-right">Venda (Unit)</th>
                            <th className="w-20 px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider text-center">Proposta</th>
                            <th className="w-32 px-3 py-2 text-[10px] font-black text-muted-foreground uppercase tracking-wider">Destaque</th>
                            <th className="w-10 px-3 py-2"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {details.length === 0 ? (
                            <tr>
                                <td colSpan={8} className="px-4 py-8 text-center text-sm text-muted-foreground font-medium">
                                    Nenhum detalhe técnico. Adicione itens para compor este produto.
                                </td>
                            </tr>
                        ) : (
                            details.map((item, index) => (
                                <tr
                                    key={item.id}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDrop={(e) => handleDrop(e, index)}
                                    onDragOver={handleDragOver}
                                    className={`group hover:bg-muted/30 transition-colors ${item.is_visible_on_proposal !== true ? 'opacity-60 bg-muted/10' : ''}`}
                                >
                                    <td className="px-3 py-2 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground">
                                        <GripVertical className="h-4 w-4" />
                                    </td>

                                    <td className="px-3 py-2">
                                        <div className="flex flex-col">
                                            {item.sku && <span className="text-[10px] font-mono text-muted-foreground">{item.sku}</span>}
                                            <input
                                                ref={editingId === item.id ? descriptionInputRef : null}
                                                type="text"
                                                value={item.description}
                                                onChange={(e) => handleUpdate(item.id, 'description', e.target.value)}
                                                onFocus={(e) => {
                                                    setEditingId(item.id);
                                                    e.target.select();
                                                }}
                                                className={`bg-transparent border-0 p-1 -ml-1 text-sm font-semibold focus:ring-1 focus:ring-primary rounded w-full ${item.is_visible_on_proposal !== true ? 'text-muted-foreground' : 'text-foreground'}`}
                                                placeholder="Descrição do item..."
                                            />
                                        </div>
                                    </td>

                                    <td className="px-3 py-2 text-right">
                                        <input
                                            type="number"
                                            value={item.quantity}
                                            onFocus={(e) => {
                                                setEditingId(item.id);
                                                e.target.select();
                                            }}
                                            onChange={(e) => handleUpdate(item.id, 'quantity', parseInt(e.target.value) || 1)}
                                            className="bg-transparent hover:bg-muted border border-transparent focus:border-primary focus:bg-background px-1.5 py-1 text-xs text-right font-medium outline-none focus:ring-0 rounded-md w-full transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            min="1"
                                        />
                                    </td>

                                    <td className="px-3 py-2 text-right">
                                        <div className="relative h-9 flex items-center bg-transparent hover:bg-muted border border-transparent focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:bg-background rounded-md transition-all">
                                            <span className="pl-2.5 text-[10px] font-bold text-muted-foreground/50">R$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.unit_cost || 0}
                                                onFocus={(e) => {
                                                    setEditingId(item.id);
                                                    e.target.select();
                                                }}
                                                onChange={(e) => handleUpdate(item.id, 'unit_cost', parseFloat(e.target.value) || 0)}
                                                className="bg-transparent border-0 px-2 py-1 text-xs text-right font-bold outline-none focus:ring-0 w-full text-emerald-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </td>

                                    <td className="px-3 py-2 text-right">
                                        <div className="relative h-9 flex items-center bg-transparent hover:bg-muted border border-transparent focus-within:border-primary focus-within:ring-1 focus-within:ring-primary focus-within:bg-background rounded-md transition-all">
                                            <span className="pl-2.5 text-[10px] font-bold text-muted-foreground/50">R$</span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={item.unit_price || 0}
                                                onFocus={(e) => {
                                                    setEditingId(item.id);
                                                    e.target.select();
                                                }}
                                                onChange={(e) => handleUpdate(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                                                className="bg-transparent border-0 px-2 py-1 text-xs text-right font-bold outline-none focus:ring-0 w-full text-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                placeholder="0,00"
                                            />
                                        </div>
                                    </td>

                                    <td className="px-3 py-2 text-center">
                                        <button
                                            onClick={() => handleUpdate(item.id, 'is_visible_on_proposal', item.is_visible_on_proposal === true ? false : true)}
                                            className={`p-1.5 rounded-lg transition-colors ${item.is_visible_on_proposal === true ? 'text-emerald-500 hover:bg-emerald-500/10' : 'text-muted-foreground hover:bg-muted'}`}
                                            title={item.is_visible_on_proposal === true ? 'Aparece na proposta' : 'Oculto na proposta'}
                                        >
                                            {item.is_visible_on_proposal === true ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        </button>
                                    </td>

                                    <td className="px-3 py-2">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handleUpdate(item.id, 'is_highlighted_on_grid', !item.is_highlighted_on_grid)}
                                                disabled={item.is_visible_on_proposal !== true}
                                                className={`p-1.5 rounded-lg transition-colors ${item.is_highlighted_on_grid ? 'text-primary bg-primary/10' : 'text-muted-foreground hover:bg-muted'} disabled:opacity-30`}
                                                title="Destacar no sumário"
                                            >
                                                <LayoutTemplate className="h-4 w-4" />
                                            </button>
                                            {item.is_highlighted_on_grid && (
                                                <input
                                                    type="text"
                                                    value={item.grid_label || ''}
                                                    onChange={(e) => handleUpdate(item.id, 'grid_label', e.target.value)}
                                                    className="text-[10px] px-2 py-1 border border-border rounded bg-background focus:border-primary focus:ring-0 w-24 h-7"
                                                    placeholder="Rótulo..."
                                                />
                                            )}
                                        </div>
                                    </td>

                                    <td className="px-3 py-2 text-right">
                                        <button
                                            onClick={() => handleRemove(item.id)}
                                            className="p-1.5 text-muted-foreground/30 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                    {details.length > 0 && (
                        <tfoot className="bg-muted/30 border-t border-border">
                            <tr className="divide-x divide-border/10">
                                <td colSpan={3} className="px-3 py-1.5 text-[9px] font-bold text-muted-foreground uppercase text-right">Subtotal Composição:</td>
                                <td className="px-3 py-1.5 text-right text-[10px] font-black text-emerald-600/80">{formatCurrency(totals.cost)}</td>
                                <td className="px-3 py-1.5 text-right text-[10px] font-black text-primary/80">{formatCurrency(totals.price)}</td>
                                <td colSpan={3}></td>
                            </tr>
                        </tfoot>
                    )}
                </table>
            </div>

            <div className="flex gap-2 text-[10px] font-medium text-muted-foreground bg-muted/30 p-2 rounded-lg">
                <span className="flex items-center gap-1"><Eye className="h-3 w-3" /> Determina se a linha aparecerá na lista detalhada da proposta.</span>
                <span className="flex items-center gap-1 ml-4"><LayoutTemplate className="h-3 w-3" /> Cria um "Card" especial na capa do sumário de hardware.</span>
            </div>
        </div>
    );
};
