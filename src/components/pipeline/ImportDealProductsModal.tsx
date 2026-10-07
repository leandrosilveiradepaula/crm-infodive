'use client';

import React, { useState, useRef } from 'react';
import { X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, Loader, FileCode, ImageIcon } from 'lucide-react';
import { parseExcel, parseCSV, detectColumns, applyMapping, type ColumnMapping, findHeaderRow } from '@/utils/excelParser';
import { parseXML, extractNFeMetadata } from '@/utils/xmlParser';
import { DealProductMapper } from './DealProductMapper';
import { ProductSearch } from './ProductSearch';
import { extractProductsFromImage } from '@/lib/gemini';
import { type Product } from '@/types/product';
import { normalizePricingModel, type PricingModel } from './product-row/pricingModel';

// Simplified type for ProductItem since we don't have the full useDeals hook context
export interface ProductItem {
    id: string;
    sku?: string;
    name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    cost: number;
    margin: number;
    is_bid?: boolean;
    external_id?: string;
    is_usd?: boolean;
    usd_cost?: number;
    exchange_rate?: number;
    category?: string;
    subcategory?: string;
    pricing_model?: PricingModel;
}

interface ImportDealProductsModalProps {
    onClose: () => void;
    onImport: (products: ProductItem[]) => void;
    targetProduct?: ProductItem; // Optional target product for context-aware import
}

type Step = 'upload' | 'mapping' | 'preview' | 'processing';

const safeParseFloat = (value: any): number => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const clean = value.trim();
        if (!clean) return 0;

        // Check if it looks like Brazilian format (1.234,56 or 1234,56)
        if (clean.includes(',') && !clean.endsWith('.')) {
            // Remove dots (thousands) and replace comma with dot
            const normalized = clean.replace(/\./g, '').replace(',', '.');
            return parseFloat(normalized) || 0;
        }

        return parseFloat(clean) || 0;
    }
    return 0;
};

export const ImportDealProductsModal: React.FC<ImportDealProductsModalProps> = ({ onClose, onImport, targetProduct }) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [step, setStep] = useState<Step>('upload');
    const [file, setFile] = useState<File | null>(null);
    const [rows, setRows] = useState<any[][]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<ColumnMapping>({});
    const [error, setError] = useState<string | null>(null);

    const handleFileSelect = async (selectedFile: File) => {
        try {
            setError(null);
            setFile(selectedFile);

            // Parse file
            const isImage = selectedFile.type.startsWith('image/');
            const isPdf = selectedFile.type === 'application/pdf' || selectedFile.name.toLowerCase().endsWith('.pdf');

            let parsedRows: any[][] = [];
            
            if (selectedFile.name.endsWith('.csv')) {
                parsedRows = await parseCSV(selectedFile);
            } else if (selectedFile.name.match(/\.(xlsx|xls)$/)) {
                parsedRows = await parseExcel(selectedFile);
            } else if (isImage || isPdf) {
                setStep('processing');
                // Process image/pdf with Gemini
                
                // Fallback for mime type
                const fileType = isPdf ? 'application/pdf' : selectedFile.type;
                const fileToProcess = new File([selectedFile], selectedFile.name, { type: fileType });
                
                const products = await extractProductsFromImage(fileToProcess);

                // Artificial headers for mapping
                const artificialHeaders = ['sku', 'name', 'quantity', 'unit_price', 'total'];
                setHeaders(artificialHeaders);

                // Map to rows format (array of arrays)
                const artificialRowsAsArrays = products.map(p => [
                    p.sku || '',
                    p.name || '',
                    p.quantity || 0,
                    p.unit_price || 0,
                    p.total || 0
                ]);

                setRows(artificialRowsAsArrays);

                // Set initial mapping
                setMapping({
                    sku: 'sku',
                    name: 'name',
                    quantity: 'quantity',
                    cost: 'unit_price'
                });

                setStep('mapping');
                return;
            } else if (selectedFile.name.endsWith('.xml')) {
                setStep('processing');
                // Process XML (NFe)
                const products = await parseXML(selectedFile);

                // Artificial headers for mapping
                const artificialHeaders = ['sku', 'name', 'quantity', 'unit_price', 'total', 'ncm', 'cfop'];
                setHeaders(artificialHeaders);

                // Map to rows format (array of arrays)
                const artificialRowsAsArrays = products.map(p => [
                    p.sku || '',
                    p.name || '',
                    p.quantity || 0,
                    p.cost || 0,
                    p.total || 0,
                    p.ncm || '',
                    p.cfop || ''
                ]);

                setRows(artificialRowsAsArrays);

                // Set initial mapping
                setMapping({
                    sku: 'sku',
                    name: 'name',
                    quantity: 'quantity',
                    cost: 'unit_price'
                });

                setStep('mapping');
                return;
            } else {
                throw new Error('Formato não suportado. Use .xlsx, .csv, .xml, Imagem ou PDF');
            }

            if (parsedRows.length === 0) {
                throw new Error('Arquivo vazio ou formato inválido');
            }

            // SMART HEADER DETECTION
            const { headerRow, index } = findHeaderRow(parsedRows);

            const fileHeaders = headerRow.map(h => String(h));
            setHeaders(fileHeaders);

            // Slice rows to start AFTER the header
            const dataRows = parsedRows.slice(index + 1);
            setRows(dataRows);

            // Auto-detect columns
            const detectedMapping = detectColumns(fileHeaders);
            setMapping(detectedMapping);

            setStep('mapping');
        } catch (err: any) {
            console.error('Error selecting file:', err instanceof Error ? err.stack : err);
            setError(err instanceof Error ? err.message : String(err));
            setStep('upload'); // Go back to upload step on error
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            handleFileSelect(droppedFile);
        }
    };


    const [isBundle, setIsBundle] = useState(false);
    const [importPrices, setImportPrices] = useState(true);
    const [importAsSingleUnit, setImportAsSingleUnit] = useState(false);
    const [selectedBundleProduct, setSelectedBundleProduct] = useState<Product | null>(null);
    const [previewProducts, setPreviewProducts] = useState<ProductItem[]>([]); // This will now hold the DETAILS (rows)
    const [importPayload, setImportPayload] = useState<ProductItem[]>([]); // This holds what will be imported (Bundle or Rows)

    const handlePreview = async () => {
        try {
            setError(null);

            // Apply mapping
            const parsedProducts = applyMapping(rows, mapping, headers);

            if (parsedProducts.length === 0) {
                throw new Error('Nenhum produto válido encontrado. Verifique o mapeamento das colunas.');
            }

            // 1. Generate the Full List (Standard Logic)
            const fullList: ProductItem[] = parsedProducts.map((p, index) => {
                let effectiveCost = importPrices ? p.cost : 0;
                let effectiveQuantity = p.quantity;

                // Handle Single Unit Consolidation
                if (importAsSingleUnit && !targetProduct && !isBundle) {
                    effectiveCost = effectiveCost * effectiveQuantity;
                    effectiveQuantity = 1;
                }

                return {
                    id: `imp-${Date.now()}-${index}`,
                    sku: p.sku || 'IMP-SKU',
                    name: p.name,
                    cost: effectiveCost,
                    margin: 20, // Default for new imported items
                    unit_price: effectiveCost / 0.8, // Default 20% markup for new items
                    quantity: effectiveQuantity,
                    category: p.category || '',
                    subcategory: p.subcategory || '',
                    is_bid: false,
                    pricing_model: 'one_time'
                };
            });

            // 2. Determine Import Payload
            if (targetProduct) {
                // Target Product Logic (Consolidate into existing product)
                const totalCost = parsedProducts.reduce((sum, p) => sum + ((importPrices ? p.cost : 0) * p.quantity), 0);

                // Create description listing all items (JSON Structured)
                const newDetails = parsedProducts.map(p => ({
                    sku: p.sku || '',
                    description: p.name,
                    quantity: p.quantity,
                    unit_price: importPrices ? (p.cost || 0) : 0
                }));

                // MERGE with existing details if any
                let existingDetails: any[] = [];
                let existingCost = 0;
                try {
                    if (targetProduct.description) {
                        try {
                            existingDetails = JSON.parse(targetProduct.description);
                            if (!Array.isArray(existingDetails)) existingDetails = [];
                        } catch {
                            existingDetails = [{ description: targetProduct.description, quantity: 1, unit_price: targetProduct.cost / targetProduct.quantity }];
                        }
                    }
                    existingCost = safeParseFloat(targetProduct.cost);
                } catch (e) {
                    existingCost = safeParseFloat(targetProduct.cost);
                }

                const finalDetails = [...existingDetails, ...newDetails];
                const finalCost = existingCost + totalCost;

                let updatedProduct: ProductItem;
                const isBidMode = Boolean(targetProduct.is_bid);

                if (isBidMode) {
                    const existingPrice = safeParseFloat(targetProduct.unit_price);
                    const newTotalPrice = existingPrice + totalCost;
                    updatedProduct = {
                        ...targetProduct,
                        cost: newTotalPrice, // Price = Cost in BID mode
                        margin: 0,
                        unit_price: newTotalPrice,
                        description: JSON.stringify(finalDetails),
                        pricing_model: normalizePricingModel(targetProduct.pricing_model),
                    };
                } else {
                    const marginToUse = (typeof targetProduct.margin === 'number') ? targetProduct.margin : 20;
                    const divisor = 1 - (marginToUse / 100);
                    const newPrice = divisor > 0 ? finalCost / divisor : finalCost;

                    updatedProduct = {
                        ...targetProduct,
                        cost: finalCost,
                        margin: marginToUse,
                        unit_price: newPrice,
                        description: JSON.stringify(finalDetails),
                        pricing_model: normalizePricingModel(targetProduct.pricing_model),
                    };
                }

                setImportPayload([updatedProduct]);
            } else if (isBundle) {
                // Bundle Logic
                if (!selectedBundleProduct) {
                    throw new Error('Por favor, selecione um produto do catálogo.');
                }

                const totalCost = parsedProducts.reduce((sum, p) => sum + ((importPrices ? p.cost : 0) * p.quantity), 0);
                const details = parsedProducts.map(p => ({
                    sku: p.sku || '',
                    description: p.name,
                    quantity: p.quantity,
                    unit_price: importPrices ? (p.cost || 0) : 0
                }));

                const bundleMargin = typeof selectedBundleProduct.margin === 'number' ? selectedBundleProduct.margin : 20;
                const bundleDivisor = 1 - (bundleMargin / 100);

                const bundleItem: ProductItem = {
                    id: `imp-bundle-${Date.now()}`,
                    sku: selectedBundleProduct.sku || 'BUNDLE',
                    name: selectedBundleProduct.name,
                    cost: totalCost,
                    margin: bundleMargin,
                    unit_price: bundleDivisor > 0 ? totalCost / bundleDivisor : totalCost,
                    quantity: 1,
                    description: JSON.stringify(details),
                    is_bid: false,
                    category: selectedBundleProduct.category || '',
                    subcategory: selectedBundleProduct.subcategory || '',
                    external_id: selectedBundleProduct.id,
                    pricing_model: 'one_time'
                };

                setImportPayload([bundleItem]);
            } else {
                setImportPayload(fullList);
            }

            setPreviewProducts(fullList);
            setStep('preview');

        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleConfirmImport = async () => {
        if (!onImport) {
            console.error('❌ [ImportModal] onImport callback is missing!');
            return;
        }

        setStep('processing');
        try {
            // Await the import action (which is passed from ViewDealModal)
            await onImport(importPayload);
            console.log('✅ [ImportModal] onImport completed successfully');
            // onImport in parent already closes the modal on success, 
            // but we can call onClose here just in case, or leave it to parent.
            // Since parent now handles closure, we can just return.
        } catch (error) {
            console.error('❌ [ImportModal] Error confirming import:', error);
            setError('Falha ao processar importação.');
            setStep('preview'); // Go back to preview on error
        }
    };

    const renderUploadStep = () => (
        <div className="p-8">
            <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className="border-2 border-dashed border-border rounded-3xl p-12 text-center hover:border-primary/50 transition-colors cursor-pointer group bg-muted/10"
                onClick={() => fileInputRef.current?.click()}
            >
                <div className="h-20 w-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-10 w-10 text-primary" />
                </div>
                <p className="text-lg font-black text-foreground mb-2">Arraste seus arquivos aqui</p>
                <p className="text-sm text-muted-foreground font-bold mb-4">ou clique para selecionar</p>
                <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground font-mono">
                    <span className="flex items-center gap-1"><FileSpreadsheet className="h-3 w-3" /> XLS/CSV</span>
                    <span className="flex items-center gap-1"><FileCode className="h-3 w-3" /> XML</span>
                    <span className="flex items-center gap-1"><ImageIcon className="h-3 w-3" /> IMG/PDF</span>
                </div>
            </div>
            <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls,.csv,.xml,.png,.jpg,.jpeg,.webp,.pdf"
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                className="hidden"
            />
        </div>
    );

    const renderMappingStep = () => (
        <div className="p-8 space-y-6">
            <DealProductMapper
                headers={headers}
                mapping={mapping}
                onMappingChange={setMapping}
                previewRows={rows.slice(0, 4)}
            />

            {/* Bundle Configuration */}
            {targetProduct ? (
                <div className="bg-primary/10 border border-primary/20 rounded-2xl p-4">
                    <p className="text-xs text-primary font-bold uppercase tracking-widest mb-2">Importando dados para:</p>
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-primary/20 rounded-lg flex items-center justify-center text-primary font-black">
                            {targetProduct.name.charAt(0)}
                        </div>
                        <div>
                            <h4 className="text-sm font-bold text-foreground leading-none">{targetProduct.name}</h4>
                            <p className="text-xs text-muted-foreground font-mono mt-1">{targetProduct.sku}</p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-3">
                    <div className="bg-muted/30 border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-3 mb-3">
                            <input
                                type="checkbox"
                                id="isBundle"
                                checked={isBundle}
                                onChange={(e) => setIsBundle(e.target.checked)}
                                className="rounded border-border bg-card text-primary focus:ring-primary"
                            />
                            <label htmlFor="isBundle" className="text-sm font-bold text-foreground cursor-pointer select-none">
                                Agrupar itens em um único produto (Bundle)
                            </label>
                        </div>

                        {isBundle && (
                            <div className="animate-in fade-in slide-in-from-top-2 duration-200 pl-7">
                                {selectedBundleProduct ? (
                                    <div className="bg-card border border-border rounded-xl p-3 flex items-center justify-between group hover:border-primary/50 transition-colors">
                                        <div>
                                            <h4 className="text-sm font-bold text-foreground">{selectedBundleProduct.name}</h4>
                                            <p className="text-xs text-muted-foreground font-mono">{selectedBundleProduct.sku}</p>
                                        </div>
                                        <button onClick={() => setSelectedBundleProduct(null)} className="p-1.5 hover:bg-red-500/10 hover:text-red-500 text-muted-foreground rounded-lg">
                                            <X className="h-4 w-4" />
                                        </button>
                                    </div>
                                ) : (
                                    <ProductSearch onSelect={(product) => setSelectedBundleProduct(product)} />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Import Options */}
            <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-3">
                <div className="flex items-center gap-3">
                    <input
                        type="checkbox"
                        id="importPrices"
                        checked={importPrices}
                        onChange={(e) => setImportPrices(e.target.checked)}
                        className="rounded border-border bg-card text-primary focus:ring-primary"
                    />
                    <label htmlFor="importPrices" className="text-sm font-bold text-foreground cursor-pointer">
                        Importar Custos/Preços da Origem
                    </label>
                </div>
                {!targetProduct && !isBundle && (
                    <div className="flex items-center gap-3 pl-7">
                        <input
                            type="checkbox"
                            id="importAsSingleUnit"
                            checked={importAsSingleUnit}
                            onChange={(e) => setImportAsSingleUnit(e.target.checked)}
                            className="rounded border-border bg-card text-primary"
                        />
                        <label htmlFor="importAsSingleUnit" className="text-xs text-muted-foreground font-bold">
                            Consolidar quantidade em 1 unidade (Totalizar Custo)
                        </label>
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
                <button onClick={() => setStep('upload')} className="flex-1 bg-muted text-foreground border border-border hover:bg-muted/80 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-colors">Voltar</button>
                <button onClick={handlePreview} disabled={!mapping.name || !mapping.cost || (isBundle && !selectedBundleProduct)} className="flex-1 bg-primary text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-2xl shadow-blue-500/30 hover:bg-primary disabled:opacity-50 transition-colors">Continuar</button>
            </div>
        </div>
    );

    const renderPreviewStep = () => (
        <div className="p-8">
            <div className="bg-card border border-border rounded-2xl overflow-hidden max-h-[50vh] overflow-y-auto mb-6">
                <table className="w-full text-left">
                    <thead className="bg-muted sticky top-0">
                        <tr>
                            <th className="px-4 py-3 text-xs font-black text-muted-foreground uppercase">Produto</th>
                            <th className="px-4 py-3 text-xs font-black text-muted-foreground uppercase text-right">Qtd</th>
                            <th className="px-4 py-3 text-xs font-black text-muted-foreground uppercase text-right">Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {previewProducts.map((p, i) => (
                            <tr key={i} className="hover:bg-muted/50 transition-colors">
                                <td className="px-4 py-3 text-sm text-foreground font-bold">{p.name}</td>
                                <td className="px-4 py-3 text-sm text-muted-foreground text-right">{p.quantity}</td>
                                <td className="px-4 py-3 text-sm text-primary font-bold text-right">
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format((p.cost || 0) * p.quantity)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="flex gap-3">
                <button onClick={() => setStep('mapping')} className="flex-1 bg-muted text-foreground border border-border hover:bg-muted/80 px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-colors">Voltar</button>
                <button onClick={handleConfirmImport} className="flex-1 bg-primary text-white px-6 py-4 rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg hover:bg-primary transition-colors">Importar</button>
            </div>
        </div>
    );

    const renderProcessingStep = () => (
        <div className="p-12 text-center">
            <Loader className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
            <p className="text-lg font-black text-foreground">Processando...</p>
        </div>
    );

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
            <div className="bg-card rounded-[32px] border border-border shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto text-foreground">
                <div className="p-8 border-b border-border flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-foreground">Importar Itens</h2>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-widest">Processamento multimodal (XLS, XML, Print, PDF)</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-xl transition-colors"><X className="text-muted-foreground" /></button>
                </div>

                {error && <div className="mx-8 mt-4 p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-500 text-sm">{error}</div>}

                {step === 'upload' && renderUploadStep()}
                {step === 'mapping' && renderMappingStep()}
                {step === 'preview' && renderPreviewStep()}
                {step === 'processing' && renderProcessingStep()}
            </div>
        </div>
    );
};
