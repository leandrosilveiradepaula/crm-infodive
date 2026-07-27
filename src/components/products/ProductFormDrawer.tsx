'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { createProduct, updateProduct } from '@/app/(dashboard)/products/actions';
import { Loader2, Package, Server, Laptop, Cloud, Shield, Database, Layout, HardDrive, Cpu, DatabaseBackup, Archive, Network, Smartphone, X } from 'lucide-react';
import { ThemeInput, ThemeLabel, ThemeSectionHeader } from '@/components/ui/theme/ThemeComponents';

import { type Product } from '@/types/product';
import { useRouter } from 'next/navigation';
import { invalidateProductsCache } from '@/hooks/useProducts';

interface ProductFormDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product?: Product | null;
    existingBrands: string[];
    existingCategories: string[];
    existingSubcategories?: Record<string, string[]>;
    registeredManufacturers?: { id: string, name: string }[];
}

const iconOptions = [
    { label: 'Server', icon: Server, value: 'Server' },
    { label: 'Laptop', icon: Laptop, value: 'Laptop' },
    { label: 'Cloud', icon: Cloud, value: 'Cloud' },
    { label: 'Shield', icon: Shield, value: 'Shield' },
    { label: 'Database', icon: Database, value: 'Database' },
    { label: 'Layout', icon: Layout, value: 'Layout' },
    { label: 'HardDrive', icon: HardDrive, value: 'HardDrive' },
    { label: 'Cpu', icon: Cpu, value: 'Cpu' },
    { label: 'Storage', icon: DatabaseBackup, value: 'DatabaseBackup' },
    { label: 'Archive', icon: Archive, value: 'Archive' },
    { label: 'Network', icon: Network, value: 'Network' },
    { label: 'Mobile', icon: Smartphone, value: 'Smartphone' },
];

const defaultSubcategories: Record<string, string[]> = {
    'Hardware': ['Servidores', 'Storage', 'Networking', 'Dispositivos de Usuário', 'Periféricos'],
    'Software': ['Sistema Operacional', 'Banco de Dados', 'Middleware', 'Segurança', 'Aplicações'],
    'Serviço': ['Consultoria', 'Implementação', 'Suporte', 'Gerenciamento', 'Treinamento'],
    'Suporte': ['Garantia', 'Manutenção', 'Consultoria', 'Assistência Técnica', 'Atualização'],
};

export function ProductFormDrawer({ open, onOpenChange, product, existingBrands, existingCategories, existingSubcategories = {}, registeredManufacturers = [] }: ProductFormDrawerProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);

    // Form State
    const [formData, setFormData] = useState<Partial<Product>>({
        name: '', category: 'Hardware', subcategory: '', brand: '', description: '', sku: '', icon: 'Server'
    });

    // Custom Input States
    const [isCustomBrand, setIsCustomBrand] = useState(false);
    const [isCustomCategory, setIsCustomCategory] = useState(false);
    const [isCustomSubcategory, setIsCustomSubcategory] = useState(false);

    const allAvailableBrands = Array.from(new Set([
        ...existingBrands,
        ...registeredManufacturers.map(m => m.name),
        ...(formData.brand ? [formData.brand] : [])
    ])).sort();

    useEffect(() => {
        if (product) {
            setFormData({ ...product });
            const allBrands = Array.from(new Set([
                ...existingBrands,
                ...registeredManufacturers.map(m => m.name)
            ]));
            setIsCustomBrand(!allBrands.includes(product.brand));
            setIsCustomCategory(!existingCategories.includes(product.category));
        } else {
            setFormData({
                name: '', category: 'Hardware', subcategory: '', brand: '', description: '', sku: '', icon: 'Server'
            });
            setIsCustomBrand(false);
            setIsCustomCategory(false);
            setIsCustomSubcategory(false);
        }
    }, [product, open, existingBrands, existingCategories, registeredManufacturers]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (product) {
                await updateProduct(product.id, formData);
            } else {
                await createProduct(formData);
            }
            invalidateProductsCache();
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            console.error('Error saving product:', error);
            alert('Erro ao salvar produto.');
        } finally {
            setLoading(false);
        }
    };

    const currentSubcategories = Array.from(new Set([
        ...(defaultSubcategories[formData.category || 'Hardware'] || []),
        ...(existingSubcategories[formData.category || ''] || []),
        ...(formData.subcategory ? [formData.subcategory] : [])
    ])).sort();

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="w-full sm:max-w-[650px] flex flex-col p-0 gap-0"
            >
                {/* ── Header ── */}
                <div className="border-b border-border px-6 py-4 shrink-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Package className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-lg font-bold text-foreground tracking-tight">
                                    {product ? 'Editar Produto' : 'Novo Produto'}
                                </SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                                    Gerencie as especificações técnicas do seu catálogo
                                </SheetDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={() => onOpenChange(false)}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* ── Form Content ── */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">
                        {/* Identificação */}
                        <div className="space-y-4">
                            <ThemeSectionHeader title="Identificação" />
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <ThemeLabel>Nome do Produto</ThemeLabel>
                                    <ThemeInput
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                        placeholder="Ex: ThinkPad X1 Carbon"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <ThemeLabel>SKU / Part Number</ThemeLabel>
                                    <ThemeInput
                                        value={formData.sku}
                                        onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                                        className="font-mono"
                                        required
                                        placeholder="Ex: 20U9001BUS"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Classificação */}
                        <div className="space-y-4 pt-4 border-t border-border">
                            <ThemeSectionHeader title="Classificação" iconColor="bg-stage-proposal" />
                            <div className="grid grid-cols-2 gap-4">
                                {/* Category */}
                                <div className="space-y-1">
                                    <ThemeLabel>Categoria</ThemeLabel>
                                    {isCustomCategory ? (
                                        <div className="flex gap-2">
                                            <ThemeInput
                                                value={formData.category}
                                                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                                                placeholder="Nova categoria..."
                                            />
                                            <Button type="button" variant="outline" size="sm" onClick={() => setIsCustomCategory(false)} className="bg-muted text-foreground border-border hover:bg-muted/80 h-[34px]">Listar</Button>
                                        </div>
                                    ) : (
                                        <Select
                                            value={formData.category}
                                            onValueChange={(val) => {
                                                if (val === '__NEW__') {
                                                    setIsCustomCategory(true);
                                                    setFormData({ ...formData, category: '' });
                                                } else {
                                                    setFormData({ ...formData, category: val, subcategory: '' });
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="bg-background border-border text-foreground h-[38px] rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary border">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border text-popover-foreground">
                                                {existingCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                {!existingCategories.includes('Hardware') && <SelectItem value="Hardware">Hardware</SelectItem>}
                                                {!existingCategories.includes('Software') && <SelectItem value="Software">Software</SelectItem>}
                                                {!existingCategories.includes('Serviço') && <SelectItem value="Serviço">Serviço</SelectItem>}
                                                <SelectItem value="__NEW__" className="text-primary font-bold">+ Nova Categoria</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>

                                {/* Subcategory */}
                                <div className="space-y-1">
                                    <ThemeLabel>Subcategoria</ThemeLabel>
                                    {isCustomSubcategory ? (
                                        <div className="flex gap-2">
                                            <ThemeInput
                                                value={formData.subcategory}
                                                onChange={(e) => setFormData({ ...formData, subcategory: e.target.value })}
                                                placeholder="Nova subcategoria..."
                                            />
                                            <Button type="button" variant="outline" size="sm" onClick={() => setIsCustomSubcategory(false)} className="bg-muted text-foreground border-border hover:bg-muted/80 h-[34px]">Listar</Button>
                                        </div>
                                    ) : (
                                        <Select
                                            value={formData.subcategory || ''}
                                            onValueChange={(val) => {
                                                if (val === '__NEW__') {
                                                    setIsCustomSubcategory(true);
                                                    setFormData({ ...formData, subcategory: '' });
                                                } else {
                                                    setFormData({ ...formData, subcategory: val });
                                                }
                                            }}
                                        >
                                            <SelectTrigger className="bg-background border-border text-foreground h-[38px] rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary border">
                                                <SelectValue placeholder="Selecione..." />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border text-popover-foreground">
                                                {currentSubcategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                                                <SelectItem value="__NEW__" className="text-primary font-bold">+ Nova Subcategoria</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            </div>

                            {/* Brand */}
                            <div className="space-y-1">
                                <ThemeLabel>Fabricante</ThemeLabel>
                                {isCustomBrand ? (
                                    <div className="flex gap-2">
                                        <ThemeInput
                                            value={formData.brand}
                                            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                                            placeholder="Novo fabricante..."
                                        />
                                        <Button type="button" variant="outline" size="sm" onClick={() => setIsCustomBrand(false)} className="bg-muted text-foreground border-border hover:bg-muted/80 h-[34px]">Listar</Button>
                                    </div>
                                ) : (
                                    <Select
                                        value={formData.brand}
                                        onValueChange={(val) => {
                                            if (val === '__NEW__') {
                                                setIsCustomBrand(true);
                                                setFormData({ ...formData, brand: '' });
                                            } else {
                                                setFormData({ ...formData, brand: val });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="bg-background border-border text-foreground h-[38px] rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary border">
                                            <SelectValue placeholder="Selecione..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground">
                                            {allAvailableBrands.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                            <SelectItem value="__NEW__" className="text-primary font-bold">+ Novo Fabricante</SelectItem>
                                        </SelectContent>
                                    </Select>
                                )}
                            </div>
                        </div>

                        {/* Detalhes */}
                        <div className="space-y-4 pt-4 border-t border-border">
                            <ThemeSectionHeader title="Detalhes" iconColor="bg-success" />
                            <div className="space-y-2">
                                <ThemeLabel>Ícone</ThemeLabel>
                                <div className="flex gap-2 flex-wrap">
                                    {iconOptions.map((opt) => (
                                        <div
                                            key={opt.value}
                                            onClick={() => setFormData({ ...formData, icon: opt.value })}
                                            className={`p-2.5 rounded-xl border cursor-pointer transition-all ${formData.icon === opt.value ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-card border-border hover:border-muted-foreground/30 text-muted-foreground hover:text-foreground'}`}
                                        >
                                            <opt.icon className="h-4 w-4" />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-1">
                                <ThemeLabel>Descrição</ThemeLabel>
                                <Textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="bg-background border-border text-foreground h-24 rounded-xl text-xs shadow-none resize-none"
                                    placeholder="Descreva as principais características do produto..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Sticky Footer ── */}
                    <div className="border-t border-border px-6 py-4 bg-muted/10 shrink-0 flex items-center justify-end gap-3">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="h-10 px-4 text-muted-foreground hover:text-foreground hover:bg-muted font-bold rounded-xl transition-all">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="h-10 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-md shadow-primary/20 min-w-[140px] transition-all active:scale-95 flex items-center justify-center gap-2">
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Package className="h-4 w-4" />
                            )}
                            {product ? 'Salvar' : 'Criar'}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
