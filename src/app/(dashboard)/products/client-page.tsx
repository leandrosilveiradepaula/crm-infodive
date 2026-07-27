'use client';

import { useState } from 'react';
import { type Product } from '@/types/product';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductsTable } from '@/components/products/ProductsTable';
import { Button } from '@/components/ui/button';
import { ThemeInput, ThemeSelect } from '@/components/ui/theme/ThemeComponents';
import { Plus, Search, Download, Package, Layers, Shield, Tag } from 'lucide-react';
import { deleteProduct, duplicateProduct } from '@/app/(dashboard)/products/actions';
import { useRouter } from 'next/navigation';
import { ProductFormDrawer } from '@/components/products/ProductFormDrawer';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle';
import { invalidateProductsCache } from '@/hooks/useProducts';
import { PageHeaderActions } from "@/components/layout/PageHeaderActions";
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';
import { FilterBar } from '@/components/layout/FilterBar';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';

interface ProductsClientPageProps {
    initialProducts: Product[];
    manufacturers: { id: string, name: string }[];
}

export default function ProductsClientPage({ initialProducts, manufacturers }: ProductsClientPageProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterBrand, setFilterBrand] = useState('all');
    const [filterCategory, setFilterCategory] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [view, setView] = useState<ViewMode>('cards');

    const filteredProducts = initialProducts.filter(p => {
        const matchesSearch = (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.sku || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesBrand = filterBrand === 'all' || p.brand === filterBrand;
        const matchesCategory = filterCategory === 'all' || p.category === filterCategory;
        return matchesSearch && matchesBrand && matchesCategory;
    });

    const existingBrands = Array.from(new Set(initialProducts.map(p => p.brand).filter(Boolean))).sort();
    const existingCategories = Array.from(new Set(initialProducts.map(p => p.category).filter(Boolean))).sort();

    // Build a map of category -> unique subcategories already saved in the DB
    const existingSubcategories: Record<string, string[]> = {};
    initialProducts.forEach(p => {
        if (p.category && p.subcategory) {
            if (!existingSubcategories[p.category]) existingSubcategories[p.category] = [];
            if (!existingSubcategories[p.category].includes(p.subcategory)) {
                existingSubcategories[p.category].push(p.subcategory);
            }
        }
    });

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            await deleteProduct(id);
            invalidateProductsCache();
            router.refresh();
        }
    };

    const handleDuplicate = async (product: Product) => {
        const result = await duplicateProduct(product.id);
        if (result.success) {
            invalidateProductsCache();
            router.refresh();
        } else {
            alert(result.error);
        }
    };

    const handleEdit = (product: Product) => {
        setEditingProduct(product);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingProduct(null);
        setIsModalOpen(true);
    };
    
    const stats: StatItem[] = [
        {
            label: "Total no Catálogo",
            value: initialProducts.length,
            description: "Itens cadastrados",
            icon: Package,
            color: "text-primary",
            gradient: "from-primary/5 to-white dark:from-primary/10",
            border: "border-primary/10"
        },
        {
            label: "Categorias",
            value: existingCategories.length,
            description: "Segmentação técnica",
            icon: Layers,
            color: "text-teal-600 dark:text-teal-400",
            gradient: "from-teal-50 to-white dark:from-teal-950/20",
            border: "border-teal-100 dark:border-teal-900/50"
        },
        {
            label: "Fabricantes",
            value: existingBrands.length,
            description: "Marcas e Vendors",
            icon: Shield,
            color: "text-emerald-600 dark:text-emerald-400",
            gradient: "from-emerald-50 to-white dark:from-emerald-950/20",
            border: "border-emerald-100 dark:border-emerald-900/50"
        },
        {
            label: "Média p/ Cat.",
            value: existingCategories.length > 0 
                ? (initialProducts.length / existingCategories.length).toFixed(1) 
                : '0.0',
            description: "Produtos por categoria",
            icon: Tag,
            color: "text-amber-600 dark:text-amber-400",
            gradient: "from-amber-50 to-white dark:from-amber-950/20",
            border: "border-amber-100 dark:border-amber-900/50"
        }
    ];

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <PageHeaderActions>
                <div className="flex gap-3">
                    <Button variant="outline" className="bg-card border-border text-muted-foreground hover:text-foreground h-11 px-6 rounded-2xl">
                        <Download className="h-4 w-4 mr-2" />
                        Exportar CSV
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 text-white shadow-xl shadow-primary/20 font-bold h-11 px-6 rounded-2xl flex items-center gap-2" onClick={handleCreate}>
                        <Plus className="h-4 w-4" />
                        Novo Produto
                    </Button>
                </div>
            </PageHeaderActions>
            
            <StatsGrid items={stats} />
            
            <FilterBar>
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <ThemeInput
                        placeholder="Buscar por nome, SKU ou fabricante..."
                        className="pl-11 w-full h-11 bg-muted/30 border-border focus:bg-background transition-all rounded-2xl"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <ThemeSelect
                        value={filterBrand}
                        onChange={e => setFilterBrand(e.target.value)}
                        className="h-11 rounded-2xl bg-muted/30 border-border transition-all"
                    >
                        <option value="all">Marca: Todas</option>
                        {existingBrands.map(brand => (
                            <option key={brand} value={brand || ''}>{brand}</option>
                        ))}
                    </ThemeSelect>

                    <ThemeSelect
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="h-11 rounded-2xl bg-muted/30 border-border transition-all"
                    >
                        <option value="all">Categoria: Todas</option>
                        {existingCategories.map(cat => (
                            <option key={cat} value={cat || ''}>{cat}</option>
                        ))}
                    </ThemeSelect>

                    <ViewToggle view={view} onViewChange={setView} />
                </div>
            </FilterBar>

            {/* Grid / Table */}
            {view === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProducts.map(product => (
                        <ProductCard
                            key={product.id}
                            product={product}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onDuplicate={handleDuplicate}
                        />
                    ))}
                </div>
            ) : (
                <ProductsTable
                    products={filteredProducts}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onDuplicate={handleDuplicate}
                />
            )}

            {filteredProducts.length === 0 && (
                <PremiumEmptyState
                    icon={Package}
                    title="Nenhum produto encontrado"
                    description="Não encontramos produtos com os filtros aplicados. Tente ajustar sua busca."
                    actionLabel="Limpar Filtros"
                    onAction={() => {
                        setSearchTerm('');
                        setFilterBrand('all');
                        setFilterCategory('all');
                    }}
                />
            )}

            <ProductFormDrawer
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                product={editingProduct}
                existingBrands={existingBrands}
                existingCategories={existingCategories}
                existingSubcategories={existingSubcategories}
                registeredManufacturers={manufacturers}
            />
        </div>
    );
}
