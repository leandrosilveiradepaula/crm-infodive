
import React, { useState, useRef } from 'react';
import {
    Package, Plus, Trash2, FileSpreadsheet, X, Star, Tag, Copy, Pencil, Check, PackagePlus, Paperclip, ChevronDown, ChevronUp
} from 'lucide-react';
import { DndContext, closestCenter, type DragEndEvent, useSensor, useSensors, PointerSensor, KeyboardSensor } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TabsContent } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/format';
import { ProductSearch } from './ProductSearch';
import { SortableProductRow, type ProductItem } from './SortableProductRow';
import { ProductDetailsDrawer, type Distributor } from './ProductDetailsDrawer';
import { Deal, ProductTechDetail } from '@/types/deal';
import type { Profile } from '@/types/profile';
import { 
    updateDeal, reorderDealProducts, removeDealProduct, updateDealProduct, 
    bulkAddDealProducts, createDealQuote, setPrimaryDealQuote, deleteDealQuote,
    duplicateDealQuote, getDealDetails, updateDealQuote,
    getDealDocuments, uploadDealDocument, getDealDocumentSignedUrl, deleteDealDocument
} from '@/app/(dashboard)/pipeline/actions';
import { DocumentsTab } from '@/components/shared/DocumentsTab';
import { ImportDealProductsModal, type ProductItem as ImportProductItem } from './ImportDealProductsModal';
import { calculateDealValue, calculateDealTotalCost } from '@/utils/dealCalculations';
import { sortProductsHierarchically } from '@/utils/productSorting';
import type { Product } from '@/types/product';
import type { EntityDocument } from '@/types/document';

interface CatalogProduct extends Product {
    price?: number;
    cost?: number;
    duration?: number;
    duration_unit?: string;
    pricing_model?: 'one_time' | 'monthly' | 'annual';
}

interface DealProductsTabProps {
    deal: Deal;
    setDeal: React.Dispatch<React.SetStateAction<Deal>>;
    isEditing: boolean;
    setIsEditing: (value: boolean) => void;
    distributors?: Distributor[];
    isLoading?: boolean;
    onNavigateToDocuments?: (quoteId: string) => void;
}

export function DealProductsTab({ deal, setDeal, isEditing, setIsEditing, distributors = [], onNavigateToDocuments }: DealProductsTabProps) {
    // Local State for Products Tab
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [drawerProductId, setDrawerProductId] = useState<string | null>(null);
    const [showProductSearch, setShowProductSearch] = useState(false);
    const [selectedCatalogProduct, setSelectedCatalogProduct] = useState<CatalogProduct | null>(null);
    const [newProductQuantity, setNewProductQuantity] = useState(1);
    const [showImportModal, setShowImportModal] = useState(false);
    const [targetImportProductId, setTargetImportProductId] = useState<string | null>(null);

    // Quick Add (Produto Avulso)
    interface QuickAddProductData {
        name: string;
        sku: string;
        quantity: number;
        cost: number;
        margin: number;
        category: string;
        pricing_model: 'one_time' | 'monthly' | 'annual';
    }

    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickAddData, setQuickAddData] = useState<QuickAddProductData>({
        name: '', sku: '', quantity: 1, cost: 0, margin: 20, category: '', pricing_model: 'one_time'
    });
    const quickAddNameRef = useRef<HTMLInputElement>(null);

    // Quotes Management
    const defaultQuoteId = deal.deal_quotes?.find(q => q.is_primary)?.id || deal.deal_quotes?.[0]?.id || null;
    const [activeQuoteId, setActiveQuoteId] = useState<string | null>(defaultQuoteId);
    const [isCreatingQuote, setIsCreatingQuote] = useState(false);
    const [newQuoteTitle, setNewQuoteTitle] = useState('');
    const [renamingQuoteId, setRenamingQuoteId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');
    const renameInputRef = useRef<HTMLInputElement>(null);
    const [quoteDocsExpanded, setQuoteDocsExpanded] = useState(false);

    // Active Quote Derived State
    const activeQuote = deal.deal_quotes?.find(q => q.id === activeQuoteId) || null;
    const hasQuotes = (deal.deal_quotes || []).length > 0;
    const activeProducts = hasQuotes
        ? (deal.deal_products || []).filter(p => !p.quote_id || p.quote_id === activeQuoteId)
        : (deal.deal_products || []);

    const fetchQuoteDocuments = React.useCallback(async (dealId: string) => {
        const allDocs = await getDealDocuments(dealId);
        return (allDocs || []).filter((doc: EntityDocument) => doc.quote_id === activeQuoteId);
    }, [activeQuoteId]);

    const uploadQuoteDocument = React.useCallback(async (dealId: string, formData: FormData) => {
        if (activeQuoteId) {
            formData.append('quote_id', activeQuoteId);
        }
        return await uploadDealDocument(dealId, formData);
    }, [activeQuoteId]);



    // Dnd Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const toggleProductExpansion = (productId: string) => {
        setDrawerProductId(productId);
    };

    const handleDrawerNavigate = (productId: string) => {
        setDrawerProductId(productId);
    };

    const toggleSelectProduct = (productId: string) => {
        const newSelected = new Set(selectedProducts);
        if (newSelected.has(productId)) newSelected.delete(productId);
        else newSelected.add(productId);
        setSelectedProducts(newSelected);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        if (over && active.id !== over.id) {
            const products = deal.deal_products || [];
            const oldIndex = products.findIndex(p => p.id === active.id);
            const newIndex = products.findIndex(p => p.id === over.id);

            const newProducts = arrayMove(products, oldIndex, newIndex).map((p, idx) => ({
                ...p,
                display_order: idx
            }));

            // Hierarchical sort enforces relationships even after a visually wild drag
            const sortedProducts = sortProductsHierarchically(newProducts);

            // Optimistic Update
            setDeal(prev => ({ ...prev, deal_products: sortedProducts }));

            try {
                await reorderDealProducts(newProducts.map(p => ({
                    id: p.id,
                    display_order: p.display_order
                })));
            } catch {
                toast.error('Erro ao salvar nova ordem');
            }
        }
    };

    const moveProduct = async (id: string, direction: 'up' | 'down') => {
        const products = deal.deal_products || [];
        const oldIndex = products.findIndex(p => p.id === id);
        if (oldIndex === -1) return;
        const newIndex = direction === 'up' ? oldIndex - 1 : oldIndex + 1;
        if (newIndex < 0 || newIndex >= products.length) return;

        const newProducts = arrayMove(products, oldIndex, newIndex).map((p, idx) => ({
            ...p,
            display_order: idx
        }));

        const sortedProducts = sortProductsHierarchically(newProducts);

        setDeal(prev => ({ ...prev, deal_products: sortedProducts }));

        try {
            await reorderDealProducts(newProducts.map(p => ({
                id: p.id,
                display_order: p.display_order
            })));
        } catch {
            toast.error('Erro ao salvar nova ordem');
        }
    };

    const handleRemoveProduct = async (id: string) => {
        if (confirm('Tem certeza que deseja remover este produto?')) {
            const newProducts = (deal.deal_products || []).filter(p => p.id !== id);
            const isPrimaryQuote = activeQuote?.is_primary;
            let newTotalValue = deal.value;
            
            if (isPrimaryQuote) {
                const primaryProductsNow = newProducts.filter(p => p.quote_id === activeQuoteId);
                newTotalValue = calculateDealValue(primaryProductsNow);
                setDeal(prev => ({ ...prev, deal_products: newProducts, value: newTotalValue }));
            } else {
                setDeal(prev => ({ ...prev, deal_products: newProducts }));
            }

            await removeDealProduct(id);
            if (isPrimaryQuote) await updateDeal(deal.id, { value: newTotalValue });
            toast.success('Produto removido');
        }
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Excluir ${selectedProducts.size} produtos selecionados?`)) return;

        const keeping = (deal.deal_products || []).filter(p => !selectedProducts.has(p.id));
        const isPrimaryQuote = activeQuote?.is_primary;
        let newTotalValue = deal.value;
        
        if (isPrimaryQuote) {
            const primaryProductsNow = keeping.filter(p => p.quote_id === activeQuoteId);
            newTotalValue = calculateDealValue(primaryProductsNow);
            setDeal(prev => ({ ...prev, deal_products: keeping, value: newTotalValue }));
        } else {
            setDeal(prev => ({ ...prev, deal_products: keeping }));
        }

        // Note: bulkRemoveDealProducts needs to be imported if available, or loop removeDealProduct
        for (const id of selectedProducts) {
            await removeDealProduct(id);
        }

        if (isPrimaryQuote) await updateDeal(deal.id, { value: newTotalValue });
        setSelectedProducts(new Set());
        toast.success('Produtos excluídos com sucesso');
    };

    const handleAddProduct = () => {
        setShowProductSearch(!showProductSearch);
        setSelectedCatalogProduct(null);
        setNewProductQuantity(1);
        if (!showProductSearch) setShowQuickAdd(false);
    };

    const handleOpenQuickAdd = (prefillName = '') => {
        setShowQuickAdd(true);
        setShowProductSearch(false);
        setSelectedCatalogProduct(null);
        setQuickAddData({ name: prefillName, sku: '', quantity: 1, cost: 0, margin: 20, category: '', pricing_model: 'one_time' });
        setTimeout(() => quickAddNameRef.current?.focus(), 100);
    };

    const handleQuickAddProduct = async () => {
        if (!quickAddData.name.trim()) {
            toast.error('Informe o nome do produto.');
            return;
        }

        const marginDecimal = (quickAddData.margin || 0) / 100;
        const unitPrice = marginDecimal < 1
            ? parseFloat(((quickAddData.cost || 0) / (1 - marginDecimal)).toFixed(2))
            : quickAddData.cost || 0;

        const newProduct = {
            deal_id: deal.id,
            product_id: null,
            name: quickAddData.name.trim(),
            sku: quickAddData.sku.trim(),
            quantity: quickAddData.quantity || 1,
            cost: quickAddData.cost || 0,
            unit_price: unitPrice,
            margin: quickAddData.margin || 0,
            category: quickAddData.category || '',
            description: '',
            display_order: (activeProducts.length || 0),
            quote_id: activeQuoteId,
            pricing_model: quickAddData.pricing_model
        };

        try {
            const result = await bulkAddDealProducts(deal.id, [newProduct]);
            if (result && result.length > 0) {
                const added = result[0];
                const updatedProducts = [...(deal.deal_products || []), added];
                const isPrimaryQuote = activeQuote?.is_primary;

                if (isPrimaryQuote) {
                    const primaryProductsNow = updatedProducts.filter(p => p.quote_id === activeQuoteId);
                    const newTotal = calculateDealValue(primaryProductsNow);
                    setDeal(prev => ({ ...prev, deal_products: updatedProducts, value: newTotal }));
                    await updateDeal(deal.id, { value: newTotal });
                } else {
                    setDeal(prev => ({ ...prev, deal_products: updatedProducts }));
                }

                toast.success('Produto avulso adicionado!');
                setShowQuickAdd(false);
                setQuickAddData({ name: '', sku: '', quantity: 1, cost: 0, margin: 20, category: '', pricing_model: 'one_time' });
            }
        } catch {
            toast.error('Erro ao adicionar produto avulso');
        }
    };

    const handleConfirmAddProduct = async () => {
        if (!selectedCatalogProduct) return;

        const newProduct = {
            deal_id: deal.id,
            product_id: selectedCatalogProduct.id,
            name: selectedCatalogProduct.name,
            sku: selectedCatalogProduct.sku,
            description: selectedCatalogProduct.description,
            unit_price: selectedCatalogProduct.price || 0,
            quantity: newProductQuantity,
            cost: selectedCatalogProduct.cost || 0,
            margin: selectedCatalogProduct.margin || 0,
            category: selectedCatalogProduct.category || '',
            subcategory: selectedCatalogProduct.subcategory || '',
            duration: selectedCatalogProduct.duration,
            duration_unit: selectedCatalogProduct.duration_unit,
            show_sku_on_proposal: selectedCatalogProduct.show_sku_on_proposal,
            display_order: (activeProducts.length || 0),
            quote_id: activeQuoteId,
            pricing_model: selectedCatalogProduct.pricing_model || 'one_time'
        };

        try {
            // Optimistic update done in parent usually, but here we invoke action directly?
            // Existing logic in ViewDealModal used addDealProduct.
            // But wait, ViewDealModal didn't have handleConfirmAddProduct visible in the snippet.
            // I'll assume standard add logic.
            // ACTUALLY, checking the snippet again... line 809 calls handleConfirmAddProduct.
            // I don't have the implementation of handleConfirmAddProduct in the snippet, so I'll reimplement it robustly.

            // Re-implementing based on typical pattern
            const result = await bulkAddDealProducts(deal.id, [newProduct]);
            if (result && result.length > 0) {
                const added = result[0];
                const currentProducts = deal.deal_products || [];
                const updatedProducts = [...currentProducts, added];
                
                const isPrimaryQuote = activeQuote?.is_primary;
                
                if (isPrimaryQuote) {
                    const primaryProductsNow = updatedProducts.filter(p => p.quote_id === activeQuoteId);
                    const newTotal = calculateDealValue(primaryProductsNow);
                    setDeal(prev => ({
                        ...prev,
                        deal_products: updatedProducts,
                        value: newTotal
                    }));
                    await updateDeal(deal.id, { value: newTotal });
                } else {
                    setDeal(prev => ({
                        ...prev,
                        deal_products: updatedProducts
                    }));
                }

                toast.success('Produto adicionado!');
                setShowProductSearch(false);
                setSelectedCatalogProduct(null);
            }
        } catch {
            toast.error('Erro ao adicionar produto');
        }
    };

    const handleUpdateProduct = async (id: string, field: keyof ProductItem | string, value: unknown) => {
        const updatedProducts = (deal.deal_products || []).map(p => {
            if (p.id === id) {
                const updated = { ...p };

                // Special Logic: If updating 'description' (Details Table), recalculate based on sum
                if (field === 'description') {
                    try {
                        const details = JSON.parse(String(value)) as ProductTechDetail[];
                        // Only recalculate if there's at least one item with a price defined
                        const hasPrices = details.some(item => (Number(item.unit_price) || 0) > 0);
                        const totalSum = details.reduce((acc: number, item) => acc + ((Number(item.quantity) || 0) * (Number(item.unit_price) || 0)), 0);
                        updated.description = String(value);

                        if (hasPrices && totalSum > 0) {
                            if (updated.is_bid) {
                                updated.unit_price = parseFloat(totalSum.toFixed(2));
                                const margin = updated.margin || 0;
                                updated.cost = parseFloat((updated.unit_price * (1 - (margin / 100))).toFixed(2));
                            } else {
                                updated.cost = parseFloat(totalSum.toFixed(2));
                                const marginToUse = typeof updated.margin === 'number' ? updated.margin : 20;
                                updated.unit_price = parseFloat(((updated.cost || 0) / (1 - (marginToUse / 100))).toFixed(2));
                            }
                        }
                    } catch {
                        (updated as Record<string, unknown>)[field] = value;
                    }
                } else {
                    (updated as Record<string, unknown>)[field] = value;
                }

                // Math Engine
                const isBidActive = field === 'is_bid' ? value : updated.is_bid;
                if (isBidActive) {
                    if (field === 'unit_price') {
                        updated.cost = parseFloat((Number(value) * (1 - ((updated.margin || 0) / 100))).toFixed(2));
                    } else if (field === 'margin') {
                        updated.cost = parseFloat(((updated.unit_price || 0) * (1 - (Number(value) / 100))).toFixed(2));
                    } else if (field === 'cost') {
                        if (updated.unit_price) updated.margin = parseFloat(((1 - (Number(value) / updated.unit_price)) * 100).toFixed(2));
                    }
                } else if (field === 'is_usd' || field === 'usd_cost' || field === 'exchange_rate') {
                    const isUsd = (field === 'is_usd') ? value : updated.is_usd;
                    if (field === 'is_usd' && value === true && (!updated.usd_cost || updated.usd_cost === 0) && updated.cost) {
                        const rate = updated.exchange_rate || 5.0;
                        updated.exchange_rate = rate;
                        updated.usd_cost = parseFloat((updated.cost / rate).toFixed(2));
                    }
                    if (isUsd) {
                        const usdCost = field === 'usd_cost' ? Number(value) : (updated.usd_cost || 0);
                        const rate = field === 'exchange_rate' ? Number(value) : (updated.exchange_rate || 0);
                        updated.cost = parseFloat((usdCost * rate).toFixed(2));
                        const marginToUse = typeof updated.margin === 'number' ? updated.margin : 20;
                        updated.unit_price = parseFloat((updated.cost / (1 - (marginToUse / 100))).toFixed(2));
                    }
                } else {
                    if (field === 'cost' || field === 'margin') {
                        const marginToUse = typeof updated.margin === 'number' ? updated.margin : 20;
                        updated.unit_price = parseFloat(((updated.cost || 0) / (1 - (marginToUse / 100))).toFixed(2));
                    }
                }
                return updated;
            }
            return p;
        });

        // Split products for calculation
        const isPrimaryQuote = activeQuote?.is_primary;
        
        let newTotalValue = deal.value; // default to current deal value

        if (isPrimaryQuote) {
            const primaryProductsNow = updatedProducts.filter(p => p.quote_id === activeQuoteId);
            newTotalValue = calculateDealValue(primaryProductsNow);
            setDeal(prev => ({ ...prev, deal_products: updatedProducts, value: newTotalValue }));
        } else {
            setDeal(prev => ({ ...prev, deal_products: updatedProducts }));
        }

        try {
            const productToUpdate = updatedProducts.find(p => p.id === id);
            if (productToUpdate) {
                const payload: Record<string, unknown> = {
                    [field]: value,
                    unit_price: productToUpdate.unit_price,
                    cost: productToUpdate.cost,
                    margin: productToUpdate.margin,
                    is_optional: productToUpdate.is_optional,
                    present_in_usd: productToUpdate.present_in_usd,
                    pricing_model: productToUpdate.pricing_model
                };
                if (productToUpdate.is_usd) {
                    payload.is_usd = productToUpdate.is_usd;
                    payload.usd_cost = productToUpdate.usd_cost;
                    payload.exchange_rate = productToUpdate.exchange_rate;
                }
                await updateDealProduct(id, payload);
                if (isPrimaryQuote) {
                    await updateDeal(deal.id, { value: newTotalValue });
                }
            }
        } catch (error) {
            console.error('Error updating product:', error);
            toast.error('Erro ao atualizar produto');
        }
    };

    const handleLinkProduct = async (childId: string, parentId: string) => {
        const updatedProducts = (deal.deal_products || []).map(p =>
            p.id === childId ? { ...p, parent_id: parentId } : p
        );
        const sortedProducts = sortProductsHierarchically(updatedProducts);
        
        const isPrimaryQuote = activeQuote?.is_primary;
        let newTotalValue = deal.value;
        
        if (isPrimaryQuote) {
            const primaryProductsNow = sortedProducts.filter(p => p.quote_id === activeQuoteId);
            newTotalValue = calculateDealValue(primaryProductsNow);
            setDeal(prev => ({ ...prev, deal_products: sortedProducts, value: newTotalValue }));
        } else {
            setDeal(prev => ({ ...prev, deal_products: sortedProducts }));
        }

        await updateDealProduct(childId, { parent_id: parentId });
        if (isPrimaryQuote) await updateDeal(deal.id, { value: newTotalValue });
        toast.success('Item vinculado com sucesso');
    };

    const handleUnlinkProduct = async (childId: string) => {
        const updatedProducts = (deal.deal_products || []).map(p =>
            p.id === childId ? { ...p, parent_id: null } : p
        );
        const sortedProducts = sortProductsHierarchically(updatedProducts);
        
        const isPrimaryQuote = activeQuote?.is_primary;
        let newTotalValue = deal.value;
        
        if (isPrimaryQuote) {
            const primaryProductsNow = sortedProducts.filter(p => p.quote_id === activeQuoteId);
            newTotalValue = calculateDealValue(primaryProductsNow);
            setDeal(prev => ({ ...prev, deal_products: sortedProducts, value: newTotalValue }));
        } else {
            setDeal(prev => ({ ...prev, deal_products: sortedProducts }));
        }

        await updateDealProduct(childId, { parent_id: null });
        if (isPrimaryQuote) await updateDeal(deal.id, { value: newTotalValue });
        toast.success('Item desvinculado');
    };

    const handleCreateQuote = async () => {
        if (!newQuoteTitle.trim()) return;
        try {
            const newQuote = await createDealQuote(deal.id, newQuoteTitle);
            setDeal(prev => ({
                ...prev,
                deal_quotes: [...(prev.deal_quotes || []), newQuote]
            }));
            setActiveQuoteId(newQuote.id);
            setNewQuoteTitle('');
            setIsCreatingQuote(false);
            toast.success('Cotação criada com sucesso!');
        } catch {
            toast.error('Erro ao criar cotação');
        }
    };

    const handleSetPrimaryQuote = async () => {
        if (!activeQuoteId) return;
        try {
            await setPrimaryDealQuote(deal.id, activeQuoteId);
            
            // Recalculate pipeline value based on this quote's products
            const newTotalValue = calculateDealValue(activeProducts);

            setDeal(prev => ({
                ...prev,
                value: newTotalValue,
                deal_quotes: (prev.deal_quotes || []).map(q => ({
                    ...q,
                    is_primary: q.id === activeQuoteId
                }))
            }));
            await updateDeal(deal.id, { value: newTotalValue });
            toast.success('Cotação definida como principal! Valor do deal atualizado.');
        } catch {
            toast.error('Erro ao definir cotação principal');
        }
    };

    const handleDeleteQuote = async () => {
        if (!activeQuoteId || activeQuote?.is_primary) return;
        if (!confirm('Tem certeza que deseja excluir esta cotação? Todos os produtos vinculados a ela serão perdidos.')) return;
        try {
            await deleteDealQuote(activeQuoteId);
            
            const remainingQuotes = (deal.deal_quotes || []).filter(q => q.id !== activeQuoteId);
            const remainingProducts = (deal.deal_products || []).filter(p => p.quote_id !== activeQuoteId);
            
            setDeal(prev => ({
                ...prev,
                deal_quotes: remainingQuotes,
                deal_products: remainingProducts
            }));
            
            const newActiveId = remainingQuotes.find(q => q.is_primary)?.id || remainingQuotes[0]?.id || null;
            setActiveQuoteId(newActiveId);
            
            toast.success('Cotação excluída!');
        } catch {
            toast.error('Erro ao excluir cotação');
        }
    };

    const handleDuplicateQuote = async () => {
        if (!activeQuoteId) return;
        try {
            const toastId = toast.loading('Duplicando cotação...');
            const newQuote = await duplicateDealQuote(deal.id, activeQuoteId);
            
            // Reload all deal details to get the new quote AND products correctly synced.
            const freshDeal = await getDealDetails(deal.id);
            if (freshDeal) {
                setDeal(prev => ({
                    ...prev,
                    deal_quotes: freshDeal.deal_quotes || [],
                    deal_products: freshDeal.deal_products || []
                }));
                setActiveQuoteId(newQuote.id); // Switch to the new quote
            }

            toast.success('Cotação duplicada!', { id: toastId });
        } catch {
            toast.error('Erro ao duplicar cotação');
        }
    };

    const handleStartRename = (quoteId: string, currentTitle: string) => {
        setRenamingQuoteId(quoteId);
        setRenameValue(currentTitle);
        setTimeout(() => renameInputRef.current?.focus(), 50);
    };

    const handleConfirmRename = async () => {
        if (!renamingQuoteId || !renameValue.trim()) {
            setRenamingQuoteId(null);
            return;
        }
        try {
            await updateDealQuote(renamingQuoteId, { title: renameValue.trim() });
            setDeal(prev => ({
                ...prev,
                deal_quotes: (prev.deal_quotes || []).map(q =>
                    q.id === renamingQuoteId ? { ...q, title: renameValue.trim() } : q
                )
            }));
            toast.success('Cotação renomeada!');
        } catch {
            toast.error('Erro ao renomear cotação');
        } finally {
            setRenamingQuoteId(null);
        }
    };

    return (
        <TabsContent value="products" className="mt-0 flex flex-col flex-1 h-full w-full overflow-y-auto custom-scrollbar px-6 pt-2 pb-8">
            <div className="flex justify-between items-center mb-2">
                <div className="flex-1">
                    <h2 className="text-xl font-bold text-foreground">Produtos & Cotações</h2>
                    <p className="text-sm text-muted-foreground">Gerencie múltiplas opções comerciais e escopos</p>
                </div>
            </div>

            {/* QUOTES NAVIGATION BAR */}
            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-border overflow-x-auto custom-scrollbar min-h-[48px]">
                {(deal.deal_quotes || []).map(quote => (
                    <button
                        key={quote.id}
                        onClick={() => {
                            if (activeQuoteId === quote.id && isEditing) {
                                handleStartRename(quote.id, quote.title);
                            } else {
                                setActiveQuoteId(quote.id);
                            }
                        }}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all border shrink-0 ${
                            activeQuoteId === quote.id 
                            ? 'bg-primary/10 text-primary border-primary shadow-sm' 
                            : 'bg-muted/50 text-muted-foreground border-transparent hover:bg-muted hover:border-border'
                        }`}
                        title={isEditing && activeQuoteId === quote.id ? 'Clique para renomear' : ''}
                    >
                        {quote.is_primary && <Star className="h-4 w-4 fill-primary text-primary" />}
                        {!quote.is_primary && <Tag className="h-4 w-4" />}
                        {quote.title}
                    </button>
                ))}

                {isEditing && (
                    <div className="flex items-center gap-2 shrink-0 ml-2 border-l border-border pl-4">
                        {isCreatingQuote ? (
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-4 duration-300">
                                <Input 
                                    className="h-9 w-48 bg-background border-primary/50 text-xs" 
                                    placeholder="Nome da Cotação..." 
                                    autoFocus
                                    value={newQuoteTitle}
                                    onChange={e => setNewQuoteTitle(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleCreateQuote()}
                                />
                                <Button size="sm" onClick={handleCreateQuote} className="h-9">Salvar</Button>
                                <Button size="icon" variant="ghost" className="h-9 w-9 text-muted-foreground" onClick={() => setIsCreatingQuote(false)}><X className="h-4 w-4" /></Button>
                            </div>
                        ) : (
                            <Button variant="outline" size="sm" onClick={() => setIsCreatingQuote(true)} className="h-9 border-dashed border-2 text-muted-foreground hover:text-foreground">
                                <Plus className="h-4 w-4 mr-1" />
                                Adicionar Opção
                            </Button>
                        )}
                    </div>
                )}
            </div>

            {/* QUOTE ACTION BAR */}
            <div className="flex justify-between items-center mb-2 min-h-[52px] bg-muted/20 p-2 rounded-xl border border-border">
                <div className="flex items-center gap-3">
                    {activeQuote && (
                        <div className="flex items-center gap-4">
                            {renamingQuoteId === activeQuote.id ? (
                                <div className="flex items-center gap-2 animate-in fade-in duration-200">
                                    <input
                                        ref={renameInputRef}
                                        value={renameValue}
                                        onChange={e => setRenameValue(e.target.value)}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter') handleConfirmRename();
                                            if (e.key === 'Escape') setRenamingQuoteId(null);
                                        }}
                                        onBlur={handleConfirmRename}
                                        className="text-lg font-black text-foreground bg-muted border border-primary/50 rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary/30 w-56"
                                    />
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-primary" onClick={handleConfirmRename}>
                                        <Check className="h-4 w-4" />
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 group pl-2">
                                    <h3
                                        className="text-lg font-black text-foreground cursor-pointer hover:text-primary transition-colors"
                                        onClick={() => isEditing && handleStartRename(activeQuote.id, activeQuote.title)}
                                        title={isEditing ? 'Clique para renomear' : ''}
                                    >
                                        {activeQuote.title}
                                    </h3>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        className={`h-6 w-6 text-muted-foreground transition-opacity hover:text-primary ${isEditing ? 'opacity-0 group-hover:opacity-100' : 'opacity-0 pointer-events-none'}`}
                                        onClick={() => handleStartRename(activeQuote.id, activeQuote.title)}
                                        title="Renomear cotação"
                                    >
                                        <Pencil className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                            <div className="flex items-center gap-2">
                                {activeQuote.is_primary ? (
                                    <span className="bg-primary/10 text-primary border border-primary/20 text-[10px] uppercase font-black px-2 py-1 rounded">
                                        Valor no Funil ⭐
                                    </span>
                                ) : (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleSetPrimaryQuote}
                                        className={`h-7 text-xs font-bold gap-1.5 text-muted-foreground hover:text-primary hover:border-primary/50 transition-all duration-200 ${!isEditing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}
                                    >
                                        <Star className="h-3.5 w-3.5" /> Tornar Principal
                                    </Button>
                                )}
                                <div className={`flex items-center ml-2 border border-border rounded-md overflow-hidden bg-background transition-opacity duration-200 ${!isEditing ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
                                    <Button variant="ghost" size="sm" onClick={handleDuplicateQuote} className="h-7 w-8 p-0 rounded-none text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors border-r border-border" title="Duplicar Cotação">
                                        <Copy className="h-3.5 w-3.5" />
                                    </Button>
                                    {!activeQuote.is_primary && (
                                        <Button variant="ghost" size="sm" onClick={handleDeleteQuote} className="h-7 w-8 p-0 rounded-none text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" title="Excluir Cotação">
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
                
                <div className="flex gap-2 items-center pr-1">
                    {selectedProducts.size > 0 && (
                        <Button
                            variant="destructive"
                            onClick={handleBulkDelete}
                            className="h-9 px-4 rounded-lg gap-2 animate-in fade-in"
                        >
                            <Trash2 className="w-4 h-4" />
                            <span className="hidden sm:inline">Excluir ({selectedProducts.size})</span>
                        </Button>
                    )}
                    {showProductSearch && (
                        <div className="w-[450px] animate-in slide-in-from-right-4 duration-300">
                            <ProductSearch onSelect={(p: Product) => setSelectedCatalogProduct(p as CatalogProduct)} onQuickAdd={handleOpenQuickAdd} />
                        </div>
                    )}

                    {!showProductSearch && (
                        <div className={`flex gap-2 items-center transition-opacity duration-200 ${isEditing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                            <Button
                                variant="outline"
                                onClick={() => {
                                    setTargetImportProductId(null);
                                    setShowImportModal(true);
                                }}
                                className="border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 rounded-lg font-bold text-xs uppercase tracking-widest transition-all hover:border-primary/30"
                            >
                                <FileSpreadsheet className="w-4 h-4 mr-2 text-primary" />
                                Importar
                            </Button>
                            <Button
                                variant="outline"
                                onClick={() => handleOpenQuickAdd()}
                                className={`h-9 px-4 rounded-lg font-bold text-xs uppercase tracking-widest transition-all bg-background ${
                                    showQuickAdd
                                        ? 'bg-amber-500/10 text-amber-600 border-amber-500/30 hover:bg-amber-500/20'
                                        : 'border-input hover:bg-accent hover:text-accent-foreground hover:border-primary/30'
                                }`}
                            >
                                <PackagePlus className="w-4 h-4 mr-2" />
                                Avulso
                            </Button>
                            {onNavigateToDocuments && activeQuoteId && (
                                <Button
                                    variant="outline"
                                    onClick={() => onNavigateToDocuments(activeQuoteId)}
                                    className="border-input bg-background hover:bg-accent hover:text-accent-foreground h-9 px-4 rounded-lg font-bold text-xs uppercase tracking-widest transition-all hover:border-primary/30"
                                    title="Ver anexos desta cotação na aba Documentos"
                                >
                                    <Paperclip className="w-4 h-4 mr-2 text-primary" />
                                    Anexos
                                </Button>
                            )}
                        </div>
                    )}

                    <Button
                        className={`h-9 px-6 rounded-lg font-bold text-xs uppercase tracking-widest transition-all duration-200 shadow-md ${
                            !isEditing
                                ? 'opacity-0 pointer-events-none bg-primary text-primary-foreground'
                                : showProductSearch
                                    ? 'bg-destructive/10 text-destructive border border-destructive/20 hover:bg-destructive/20 opacity-100'
                                    : 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-primary/20 hover:shadow-primary/40 opacity-100'
                        }`}
                        onClick={handleAddProduct}
                    >
                        {showProductSearch ? <X className="w-4 h-4 mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                        {showProductSearch ? 'Cancelar' : 'Adicionar'}
                    </Button>
                </div>
            </div>

            {isEditing && selectedCatalogProduct && (
                <div className="mb-2 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-muted/50 border border-border rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Package className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h4 className="text-base font-black text-foreground uppercase tracking-tight">{selectedCatalogProduct.name}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded tracking-tighter">{selectedCatalogProduct.sku}</span>
                                    <span className="text-[10px] text-primary font-bold bg-primary/10 px-1.5 py-0.5 rounded">{selectedCatalogProduct.brand}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-6">
                            <div className="text-right">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Quantidade</label>
                                <Input
                                    type="number"
                                    min="1"
                                    value={newProductQuantity}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewProductQuantity(parseInt(e.target.value) || 1)}
                                    className="h-9 w-24 bg-background border-input text-center font-bold text-foreground focus:ring-primary"
                                    onFocus={(e: React.ChangeEvent<HTMLInputElement>) => e.target.select()}
                                />
                            </div>
                            <Button
                                onClick={handleConfirmAddProduct}
                                className="bg-primary text-primary-foreground hover:bg-primary/90 font-black text-xs uppercase tracking-widest px-8 shadow-lg shadow-primary/20 rounded-xl"
                            >
                                Incluir na Oportunidade
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* QUICK ADD - PRODUTO AVULSO */}
            {isEditing && showQuickAdd && (
                <div className="mb-2 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="bg-amber-500/5 border border-amber-500/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <PackagePlus className="h-4 w-4 text-amber-600" />
                            <span className="text-xs font-black text-amber-600 uppercase tracking-widest">Produto Avulso</span>
                            <span className="text-[10px] text-muted-foreground ml-1">— sem vínculo com o catálogo</span>
                            <button onClick={() => setShowQuickAdd(false)} className="ml-auto p-1 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                        <div className="flex items-end gap-3">
                            <div className="flex-1 min-w-0">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Nome *</label>
                                <Input
                                    ref={quickAddNameRef}
                                    value={quickAddData.name}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuickAddData(prev => ({ ...prev, name: e.target.value }))}
                                    onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleQuickAddProduct()}
                                    className="h-9 bg-background border-input text-foreground text-sm font-bold"
                                    placeholder="Nome do produto..."
                                />
                            </div>
                            <div className="w-32">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">SKU</label>
                                <Input
                                    value={quickAddData.sku}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuickAddData(prev => ({ ...prev, sku: e.target.value }))}
                                    className="h-9 bg-background border-input text-foreground text-xs font-mono"
                                    placeholder="Opcional"
                                />
                            </div>
                            <div className="w-20">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Qtd</label>
                                <Input
                                    type="number" min="1"
                                    value={quickAddData.quantity}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuickAddData(prev => ({ ...prev, quantity: parseInt(e.target.value) || 1 }))}
                                    className="h-9 bg-background border-input text-center font-bold text-foreground"
                                    onFocus={(e: React.ChangeEvent<HTMLInputElement>) => e.target.select()}
                                />
                            </div>
                            <div className="w-28">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Custo (R$)</label>
                                <Input
                                    type="number" min="0" step="0.01"
                                    value={quickAddData.cost || ''}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuickAddData(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                                    className="h-9 bg-background border-input text-right font-bold text-foreground"
                                    placeholder="0,00"
                                    onFocus={(e: React.ChangeEvent<HTMLInputElement>) => e.target.select()}
                                />
                            </div>
                            <div className="w-20">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Margem %</label>
                                <Input
                                    type="number" min="0" max="99"
                                    value={quickAddData.margin}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setQuickAddData(prev => ({ ...prev, margin: parseFloat(e.target.value) || 0 }))}
                                    className="h-9 bg-background border-input text-center font-bold text-foreground"
                                    onFocus={(e: React.ChangeEvent<HTMLInputElement>) => e.target.select()}
                                />
                            </div>
                            <div className="w-32">
                                <label className="text-[9px] font-black text-muted-foreground uppercase tracking-widest block mb-1">Modelo</label>
                                <Select
                                    value={quickAddData.pricing_model}
                                    onValueChange={(val: 'one_time' | 'monthly' | 'annual') => setQuickAddData(prev => ({ ...prev, pricing_model: val }))}
                                >
                                    <SelectTrigger className="h-9 bg-background border-input text-xs font-bold text-foreground rounded-lg">
                                        <SelectValue placeholder="Modelo" />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-xl border-border shadow-xl">
                                        <SelectItem value="one_time">Único</SelectItem>
                                        <SelectItem value="monthly">Mensal</SelectItem>
                                        <SelectItem value="annual">Anual</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <Button
                                onClick={handleQuickAddProduct}
                                className="bg-amber-600 text-white hover:bg-amber-700 font-black text-xs uppercase tracking-widest px-6 shadow-lg shadow-amber-600/20 rounded-xl h-9"
                            >
                                Incluir
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Product Details Drawer */}
            {drawerProductId && (() => {
                const drawerProduct = (activeProducts.find(p => p.id === drawerProductId) as unknown as ProductItem) ?? null;
                const drawerDetails = (() => {
                    if (!drawerProduct) return [];
                    let parsed: ProductTechDetail[] = [];
                    if (drawerProduct.details && Array.isArray(drawerProduct.details)) {
                        parsed = drawerProduct.details;
                    } else if (drawerProduct.description && typeof drawerProduct.description === 'string') {
                        const trimmed = drawerProduct.description.trim();
                        if (trimmed.startsWith('[')) {
                            try { parsed = JSON.parse(drawerProduct.description) as ProductTechDetail[]; } catch { /* noop */ }
                        } else if (trimmed.length > 0) {
                            parsed = [{ sku: drawerProduct.sku, description: drawerProduct.description, quantity: drawerProduct.quantity, unit_price: drawerProduct.unit_price || drawerProduct.cost } as ProductTechDetail];
                        }
                    }
                    return parsed.map((item: ProductTechDetail, idx: number) => ({ ...item, id: item.id || `legacy-${drawerProduct.id}-${idx}` }));
                })();
                return (
                    <ProductDetailsDrawer
                        open={!!drawerProductId}
                        onClose={() => setDrawerProductId(null)}
                        product={drawerProduct}
                        allProducts={activeProducts as unknown as ProductItem[]}
                        onNavigate={handleDrawerNavigate}
                        isEditing={isEditing}
                        onEnableEdit={() => setIsEditing(true)}
                        handleUpdateProduct={handleUpdateProduct}
                        editedDeal={deal}
                        setEditedDeal={setDeal}
                        dealOwner={(deal.owner_profile || deal.owner) as (Profile & { commission_rate?: number }) | null}
                        distributors={distributors as Distributor[]}
                        setShowImportModal={setShowImportModal}
                        setTargetImportProductId={setTargetImportProductId}
                        details={drawerDetails}
                    />
                );
            })()}

            <div className="bg-card rounded-xl border border-border shadow-sm shrink-0">
                <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    onDragEnd={handleDragEnd}
                >
                    <table className="w-full text-left table-fixed">
                        <thead className="text-[10px] text-muted-foreground uppercase font-bold tracking-wide bg-muted/30">
                            <tr>
                                <th className="w-10"></th>
                                <th className="pl-6 py-3 w-16 text-center">
                                    <div className={`flex flex-col items-center gap-1 transition-opacity duration-200 ${isEditing ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                                        <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wide">Sel.</span>
                                    </div>
                                </th>
                                <th className="px-4 py-3 text-left text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Produto / SKU</th>
                                <th className="px-4 py-3 text-center text-[10px] font-bold text-muted-foreground uppercase tracking-wide w-32">Qtd</th>
                                <th className="px-4 py-3 text-right text-[10px] font-bold text-muted-foreground uppercase tracking-wide w-40">Preço Unit.</th>
                                <th className="px-6 py-3 text-right text-[10px] font-bold text-foreground uppercase tracking-wide w-40">Total</th>
                                <th className="w-10"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            <SortableContext
                                items={activeProducts.map(p => p.id)}
                                strategy={verticalListSortingStrategy}
                            >
                                {(activeProducts.length === 0) ? (
                                    <tr>
                                        <td colSpan={7} className="px-6 py-12 text-center">
                                            <div className="flex flex-col items-center justify-center space-y-4">
                                                <Package className="h-10 w-10 text-muted-foreground/50" />
                                        <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Nenhum produto nesta cotação</p>
                                    </div>
                                </td>
                            </tr>
                                ) : activeProducts.map((product, index) => (
                                    <SortableProductRow
                                        key={product.id}
                                        product={product}
                                        isEditing={isEditing}
                                        isFirst={index === 0}
                                        isLast={index === activeProducts.length - 1}
                                        selectedProducts={selectedProducts}
                                        toggleSelectProduct={toggleSelectProduct}
                                        toggleProductExpansion={toggleProductExpansion}
                                        drawerProductId={drawerProductId}
                                        handleUpdateProduct={handleUpdateProduct}
                                        handleInputKeyDown={() => { }}
                                        handleRemoveProduct={handleRemoveProduct}
                                        moveProduct={moveProduct}
                                        previousProduct={index > 0 ? (deal.deal_products || [])[index - 1] as ProductItem : undefined}
                                        onLink={handleLinkProduct}
                                        onUnlink={handleUnlinkProduct}
                                    />
                                ))}
                            </SortableContext>
                        </tbody>
                        <tfoot className="bg-muted/30 border-t border-border">
                            <tr className="bg-card/50">
                                <td colSpan={5} className="px-6 py-6 align-top">
                                    <div className="flex justify-end gap-12 mr-6">
                                        <div className="flex flex-col items-end gap-1 opacity-60 hover:opacity-100 transition-opacity mt-1">
                                            <span className="text-sm font-black text-muted-foreground">
                                                {formatCurrency(calculateDealTotalCost(activeProducts))}
                                            </span>
                                            <p className="text-[9px] text-muted-foreground/70 font-bold uppercase tracking-wide">Custo Total (Desta Cotação)</p>
                                        </div>

                                        <div className="flex items-center gap-2 px-3 py-1.5 h-fit bg-emerald-500/10 rounded-lg border border-emerald-500/20 mt-1">
                                            <span className="text-xs font-bold text-emerald-500">
                                                {(() => {
                                                    const totalCost = calculateDealTotalCost(activeProducts);
                                                    const totalSales = calculateDealValue(activeProducts);
                                                    if (totalSales === 0) return '0.0%';
                                                    const margin = ((totalSales - totalCost) / totalSales) * 100;
                                                    return `${margin.toFixed(1)}%`;
                                                })()}
                                            </span>
                                            <span className="text-[10px] font-bold text-emerald-500/70 uppercase">Margem</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-6 align-top text-right w-40">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xl font-black text-primary tracking-tight whitespace-nowrap">
                                            {formatCurrency(calculateDealValue(activeProducts))}
                                        </span>
                                        <p className="text-[9px] text-primary font-bold uppercase tracking-wide">
                                            {activeQuote?.is_primary ? 'Valor no Funil ⭐' : 'Subtotal Desta Cotação'}
                                        </p>
                                    </div>
                                </td>
                                <td className="w-10"></td>
                            </tr>
                        </tfoot>
                    </table>
                </DndContext>
            </div>
            {showImportModal && (
                <ImportDealProductsModal
                    onClose={() => {
                        setShowImportModal(false);
                        setTargetImportProductId(null);
                    }}
                    targetProduct={deal.deal_products?.find(p => p.id === targetImportProductId) as ImportProductItem | undefined}
                    dealProducts={activeProducts as unknown as ImportProductItem[]}
                    onImport={async (products: ImportProductItem[]) => {
                        try {
                            if (targetImportProductId && products.length > 0) {
                                const updatedProduct = products[0];
                                const updatePayload = {
                                    description: updatedProduct.description,
                                    unit_price: updatedProduct.unit_price,
                                    quantity: updatedProduct.quantity,
                                    cost: updatedProduct.cost,
                                    margin: updatedProduct.margin,
                                };

                                await updateDealProduct(targetImportProductId, updatePayload);
                                toast.success('Produto atualizado com sucesso!');

                                // Function to refresh deal - we can re-fetch or optimistically update.
                                // Since we don't have a full refresh function prop, we rely on setDeal optimistic update in parent 
                                // OR we can manually update local state here if we want perfect sync.
                                // But typically we should just trust the parent's refresh or do a local merge.
                                // For now, let's manually merge into current deal state for immediate UI feedback
                                setDeal(prev => ({
                                    ...prev,
                                    deal_products: (prev.deal_products || []).map(p =>
                                        p.id === targetImportProductId
                                            ? { ...p, ...updatePayload, description: updatedProduct.description } // Ensure description is updated
                                            : p
                                    )
                                }));

                                setShowImportModal(false);
                                setTargetImportProductId(null);
                            } else {
                                const addedProducts = await bulkAddDealProducts(deal.id, products.map(p => ({...p, quote_id: activeQuoteId})));

                                if (addedProducts && addedProducts.length > 0) {
                                    toast.success(`${addedProducts.length} produtos importados!`);

                                    const currentProducts = deal.deal_products || [];
                                    const allProducts = [...currentProducts, ...addedProducts];
                                    
                                    // Recalculate pipeline total ONLY if we are actively on the primary quote
                                    if (activeQuote?.is_primary) {
                                        const newTotalValue = calculateDealValue(allProducts.filter(p => p.quote_id === activeQuoteId));
                                        await updateDeal(deal.id, { value: newTotalValue });
                                        setDeal(prev => ({
                                            ...prev,
                                            deal_products: allProducts,
                                            value: newTotalValue
                                        }));
                                    } else {
                                        setDeal(prev => ({
                                            ...prev,
                                            deal_products: allProducts
                                        }));
                                    }

                                    setShowImportModal(false);
                                    setTargetImportProductId(null);
                                } else {
                                    toast.success('Importação concluída (nenhum item retornado).');
                                    setShowImportModal(false);
                                    setTargetImportProductId(null);
                                }
                            }
                        } catch (error: unknown) {
                            console.error('❌ Import error:', error);
                            const errorMessage = error instanceof Error ? error.message : 'Desconhecido';
                            toast.error(`Erro na importação: ${errorMessage}`);
                        }
                    }}
                />
            )}
            {activeQuote && (
                <div className="mt-6 border border-border rounded-xl bg-card/30 overflow-hidden shrink-0 flex flex-col">
                    <button
                        onClick={() => setQuoteDocsExpanded(prev => !prev)}
                        className="px-6 py-3 bg-muted/20 flex items-center justify-between shrink-0 hover:bg-muted/40 transition-colors cursor-pointer w-full text-left"
                    >
                        <div className="flex items-center gap-2">
                            <Paperclip className="h-3.5 w-3.5 text-muted-foreground" />
                            <span className="text-xs font-black text-foreground uppercase tracking-wider">Arquivos da Cotação:</span>
                            <span className="text-xs text-muted-foreground font-semibold">"{activeQuote.title}"</span>
                        </div>
                        <div className="flex items-center gap-3">
                            {activeQuote.is_primary && (
                                <span className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[9px] uppercase font-black px-2 py-0.5 rounded">
                                    Valor no Funil (Obrigatório para Fechamento)
                                </span>
                            )}
                            {quoteDocsExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                        </div>
                    </button>
                    {quoteDocsExpanded && (
                        <div className="min-h-[280px] overflow-hidden relative border-t border-border">
                            <DocumentsTab
                                entityType="deal"
                                entityId={deal.id}
                                fetchDocuments={fetchQuoteDocuments}
                                uploadDocument={uploadQuoteDocument}
                                getSignedUrl={getDealDocumentSignedUrl}
                                deleteDocument={deleteDealDocument}
                            />
                        </div>
                    )}
                </div>
            )}
        </TabsContent>
    );
}
