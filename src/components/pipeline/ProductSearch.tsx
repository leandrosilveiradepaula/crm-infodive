
import { useState, useMemo, useEffect, useRef } from 'react';
import {
    Search, Loader2, X, Filter, Package, Database, AlertCircle, CheckCircle2, Inbox, Plus,
    Server, HardDrive, Cpu, Cloud, Network, Wifi, Monitor, Laptop, Smartphone, Tablet,
    Cable, Router, Shield, FileKey, FileCode, MemoryStick, Disc, Keyboard, Mouse, DatabaseBackup, Archive
} from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import type { Product } from '@/types/product';
import { DistributorConnect, type StockCheckResult } from '@/services/distributorConnect';
import { motion, AnimatePresence } from 'framer-motion';

const iconMap: Record<string, any> = {
    Server, Database, HardDrive, Cpu, Cloud, Network, Wifi, Monitor, Laptop, Smartphone, Tablet,
    Cable, Router, Shield, FileKey, FileCode, Package, MemoryStick, Disc, Keyboard, Mouse, DatabaseBackup, Archive
};

interface ProductSearchProps {
    onSelect: (product: Product) => void;
    onQuickAdd?: (searchTerm: string) => void;
}

export const ProductSearch = ({ onSelect, onQuickAdd }: ProductSearchProps) => {
    const { products, loading, error } = useProducts();
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [brandFilter, setBrandFilter] = useState<string>('all');
    const [showFilters, setShowFilters] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [stockStatus, setStockStatus] = useState<Record<string, StockCheckResult>>({});
    const [checkingStock, setCheckingStock] = useState<Record<string, boolean>>({});

    const handleCheckStock = async (product: Product) => {
        if (checkingStock[product.sku]) return;

        setCheckingStock(prev => ({ ...prev, [product.sku]: true }));
        try {
            const result = await DistributorConnect.checkStock(product.sku, 'INGRAM');
            setStockStatus(prev => ({ ...prev, [product.sku]: result }));
        } catch (error) {
            console.error('Stock check failed', error);
        } finally {
            setCheckingStock(prev => ({ ...prev, [product.sku]: false }));
        }
    };

    // Debounce search term
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchTerm);
        }, 300);
        return () => clearTimeout(timer);
    }, [searchTerm]);

    const categories = useMemo(() => {
        const unique = Array.from(new Set(products.map(p => p.category)));
        return ['all', ...unique.sort()];
    }, [products]);

    const brands = useMemo(() => {
        const unique = Array.from(new Set(products.map(p => p.brand)));
        return ['all', ...unique.sort()];
    }, [products]);

    const filteredProducts = useMemo(() => {
        let filtered = products;

        if (categoryFilter !== 'all') {
            filtered = filtered.filter(p => p.category === categoryFilter);
        }

        if (brandFilter !== 'all') {
            filtered = filtered.filter(p => p.brand === brandFilter);
        }

        if (debouncedSearch.trim()) {
            const lowerTerm = debouncedSearch.toLowerCase();
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(lowerTerm) ||
                p.sku.toLowerCase().includes(lowerTerm) ||
                p.brand.toLowerCase().includes(lowerTerm) ||
                p.category.toLowerCase().includes(lowerTerm) ||
                (p.subcategory && p.subcategory.toLowerCase().includes(lowerTerm)) ||
                (p.description && p.description.toLowerCase().includes(lowerTerm))
            );
        }

        return filtered.slice(0, 10);
    }, [debouncedSearch, categoryFilter, brandFilter, products]);

    useEffect(() => {
        setSelectedIndex(0);
    }, [filteredProducts]);

    const handleSelect = (product: Product) => {
        onSelect(product);
        setSearchTerm('');
        setDebouncedSearch('');
        setShowDropdown(false);
        setCategoryFilter('all');
        setBrandFilter('all');
        setSelectedIndex(0);
    };

    const handleClearSearch = () => {
        setSearchTerm('');
        setDebouncedSearch('');
        setCategoryFilter('all');
        setBrandFilter('all');
        setSelectedIndex(0);
    };

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!showDropdown || filteredProducts.length === 0) return;

            switch (e.key) {
                case 'ArrowDown':
                    e.preventDefault();
                    setSelectedIndex(prev =>
                        prev < filteredProducts.length - 1 ? prev + 1 : prev
                    );
                    break;
                case 'ArrowUp':
                    e.preventDefault();
                    setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
                    break;
                case 'Enter':
                    e.preventDefault();
                    if (filteredProducts[selectedIndex]) {
                        handleSelect(filteredProducts[selectedIndex]);
                    }
                    break;
                case 'Escape':
                    e.preventDefault();
                    setShowDropdown(false);
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [showDropdown, filteredProducts, selectedIndex]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const highlightMatch = (text: string, search: string) => {
        if (!search.trim()) return text;
        const parts = text.split(new RegExp(`(${search})`, 'gi'));
        return parts.map((part, i) =>
            part.toLowerCase() === search.toLowerCase() ?
                <span key={i} className="bg-primary/30 text-primary font-black px-0.5 rounded-sm">{part}</span> : part
        );
    };

    const hasActiveFilters = categoryFilter !== 'all' || brandFilter !== 'all' || searchTerm.trim();

    return (
        <div ref={wrapperRef} className="relative w-full">
            <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    {loading ? (
                        <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    ) : (
                        <Search className={`h-4 w-4 transition-colors ${searchTerm ? 'text-primary' : 'text-muted-foreground'}`} />
                    )}
                </div>
                <input
                    type="text"
                    className="w-full pl-11 pr-32 py-3 text-sm bg-muted/50 border border-border rounded-2xl text-foreground placeholder-muted-foreground focus:border-primary/50 focus:ring-4 focus:ring-primary/10 outline-none transition-all shadow-lg"
                    placeholder="Pesquisar catálogo..."
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowDropdown(true);
                    }}
                    onFocus={() => setShowDropdown(true)}
                />
                <div className="absolute inset-y-0 right-0 flex items-center gap-1.5 pr-3">
                    {hasActiveFilters && (
                        <button
                            onClick={handleClearSearch}
                            className="p-1.5 hover:bg-muted rounded-xl transition-colors text-muted-foreground hover:text-foreground"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    )}
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`
                            flex items-center gap-2 h-8 px-2.5 rounded-xl transition-all border text-[9px] font-black uppercase tracking-wider
                            ${showFilters
                                ? 'bg-primary border-primary/50 text-white shadow-lg shadow-blue-500/20'
                                : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:bg-muted'
                            }
                        `}
                    >
                        <Filter className="h-3 w-3" />
                        <span>Filtros</span>
                    </button>
                </div>
            </div>

            <AnimatePresence>
                {showFilters && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-2 p-4 bg-card rounded-2xl shadow-2xl border border-border"
                    >
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Categoria</label>
                                <select
                                    value={categoryFilter}
                                    onChange={(e) => setCategoryFilter(e.target.value)}
                                    className="w-full text-xs bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground focus:border-primary outline-none appearance-none cursor-pointer hover:border-border/80 transition-colors"
                                >
                                    {categories.map(cat => (
                                        <option key={cat} value={cat}>{cat === 'all' ? 'Todas as Categorias' : cat}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest px-1">Fabricante</label>
                                <select
                                    value={brandFilter}
                                    onChange={(e) => setBrandFilter(e.target.value)}
                                    className="w-full text-xs bg-muted border border-border rounded-xl px-3 py-2.5 text-foreground focus:border-primary outline-none appearance-none cursor-pointer hover:border-border/80 transition-colors"
                                >
                                    {brands.map(brand => (
                                        <option key={brand} value={brand}>{brand === 'all' ? 'Todos os Fabricantes' : brand}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showDropdown && (debouncedSearch.trim() || categoryFilter !== 'all' || brandFilter !== 'all') && (
                <div className="absolute z-[100] w-full mt-2 bg-card rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-border overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                    {error ? (
                        <div className="px-8 py-10 text-center">
                            <div className="h-16 w-16 bg-red-500/10 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
                                <AlertCircle className="h-8 w-8 text-red-500" />
                            </div>
                            <h4 className="text-lg font-black text-foreground mb-1">Erro ao carregar catálogo</h4>
                            <p className="text-xs text-red-500 font-bold mb-2">{error}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Contate o suporte técnico.</p>
                        </div>
                    ) : loading ? (
                        // Show loading skeleton while products are being fetched from Supabase
                        <div className="px-8 py-10 text-center">
                            <Loader2 className="h-8 w-8 text-primary animate-spin mx-auto mb-4" />
                            <p className="text-sm font-black text-foreground mb-1">Carregando catálogo...</p>
                            <p className="text-xs text-muted-foreground font-bold">Aguarde um instante</p>
                        </div>
                    ) : filteredProducts.length > 0 ? (
                        <div className="flex flex-col max-h-[450px]">
                            <div className="px-5 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                    {filteredProducts.length} {filteredProducts.length === 1 ? 'Produto' : 'Produtos'} encontrados
                                </p>
                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold">
                                    <Database className="h-3 w-3" />
                                    <span>IBM Catalog</span>
                                </div>
                            </div>

                            <ul className="overflow-y-auto">
                                {filteredProducts.map((product, index) => {
                                    // Resolve icon string to component, or default to Package
                                    const Icon = (product.icon && iconMap[product.icon]) ? iconMap[product.icon] : Package;
                                    const isSelected = index === selectedIndex;
                                    const stock = stockStatus[product.sku];

                                    return (
                                        <li key={product.id}>
                                            <button
                                                onClick={() => handleSelect(product)}
                                                onMouseEnter={() => setSelectedIndex(index)}
                                                className={`w-full text-left px-5 py-4 flex items-center gap-4 transition-all border-b border-border last:border-none ${isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'}`}
                                            >
                                                <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner group ${isSelected ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                                                    <Icon className="h-6 w-6" />
                                                </div>

                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div>
                                                            <p className="text-sm font-black text-foreground leading-none mb-1.5 truncate">
                                                                {highlightMatch(product.name, debouncedSearch)}
                                                            </p>
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-[10px] text-muted-foreground font-mono tracking-tight">{product.sku}</span>
                                                                <span className="w-1 h-1 rounded-full bg-border" />
                                                                <span className="text-[10px] text-primary font-black uppercase tracking-widest">{product.brand}</span>
                                                            </div>
                                                        </div>

                                                        {/* Stock Status UI */}
                                                        <div
                                                            onClick={(e) => { e.stopPropagation(); handleCheckStock(product); }}
                                                            className="flex flex-col items-end gap-1.5 group/stock cursor-pointer"
                                                        >
                                                            {checkingStock[product.sku] ? (
                                                                <div className="flex items-center gap-2 px-3 py-1.5 bg-muted/50 border border-border rounded-lg">
                                                                    <Loader2 className="h-3 w-3 text-primary animate-spin" />
                                                                    <span className="text-[9px] font-black text-muted-foreground uppercase tracking-tighter">Consultando...</span>
                                                                </div>
                                                            ) : stock ? (
                                                                <div className={`
                                                                    flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all
                                                                    ${stock.status === 'in_stock' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' :
                                                                        stock.status === 'low_stock' ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-500' :
                                                                            'bg-red-500/10 border-red-500/30 text-red-500'}
                                                                `}>
                                                                    {stock.status === 'in_stock' ? <CheckCircle2 className="h-3 w-3" /> :
                                                                        stock.status === 'low_stock' ? <AlertCircle className="h-3 w-3" /> :
                                                                            <Inbox className="h-3 w-3" />}
                                                                    <span className="text-[11px] font-black">{stock.quantity} UN</span>
                                                                </div>
                                                            ) : (
                                                                <div className="px-3 py-1.5 bg-muted/50 hover:bg-primary/20 hover:text-primary border border-border rounded-lg transition-all">
                                                                    <span className="text-[9px] font-black text-muted-foreground group-hover/stock:text-primary uppercase tracking-tighter">Ver Estoque</span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ) : (
                        <div className="px-8 py-12 text-center">
                            <div className="h-16 w-16 bg-muted/50 rounded-3xl flex items-center justify-center mx-auto mb-4 border border-border">
                                <Search className="h-8 w-8 text-muted-foreground" />
                            </div>
                            <h4 className="text-lg font-black text-foreground mb-1">Sem resultados</h4>
                            <p className="text-xs text-muted-foreground font-bold mb-5">Nenhum produto encontrado no catálogo.</p>
                            <div className="flex flex-col items-center gap-3">
                                {onQuickAdd && debouncedSearch.trim() && (
                                    <button
                                        onClick={() => {
                                            onQuickAdd(debouncedSearch.trim());
                                            setShowDropdown(false);
                                        }}
                                        className="flex items-center gap-2 px-6 py-3 bg-primary text-white hover:bg-primary/90 rounded-2xl text-xs font-black uppercase tracking-wider transition-all shadow-lg shadow-primary/20 hover:shadow-primary/30"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Criar &ldquo;{debouncedSearch.trim()}&rdquo; como avulso
                                    </button>
                                )}
                                {hasActiveFilters && (
                                    <button
                                        onClick={handleClearSearch}
                                        className="px-6 py-3 bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                                    >
                                        Limpar filtros
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
