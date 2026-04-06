'use client';

import { type Product } from '@/types/product';
import { Package, Trash2, Edit, Server, Laptop, Cloud, Shield, Database, Layout, HardDrive, Cpu, DatabaseBackup, Archive, Network, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Copy } from 'lucide-react';

interface ProductCardProps {
    product: Product;
    onEdit: (product: Product) => void;
    onDelete: (id: string) => void;
    onDuplicate: (product: Product) => void;
}

const iconMap: Record<string, any> = {
    'Server': Server,
    'Laptop': Laptop,
    'Cloud': Cloud,
    'Shield': Shield,
    'Database': Database,
    'Layout': Layout,
    'HardDrive': HardDrive,
    'Cpu': Cpu,
    'Package': Package,
    'DatabaseBackup': DatabaseBackup,
    'Archive': Archive,
    'Network': Network,
    'Smartphone': Smartphone
};

export function ProductCard({ product, onEdit, onDelete, onDuplicate }: ProductCardProps) {
    const Icon = iconMap[product.icon || 'Server'] || Package;

    return (
        <div className="bg-card p-3 rounded-2xl border border-border hover:border-primary/30 transition-all duration-300 group hover:-translate-y-1 hover:shadow-2xl flex flex-col h-full relative overflow-hidden">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-[40px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors"></div>

            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="h-10 w-10 rounded-xl bg-muted flex items-center justify-center text-primary border border-border group-hover:border-primary/30 group-hover:text-primary transition-all shadow-inner group-hover:scale-110 duration-300">
                    <Icon className="h-5 w-5" />
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full outline-none">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                        <DropdownMenuItem onClick={() => onEdit(product)} className="hover:bg-muted cursor-pointer text-[10px] font-bold uppercase tracking-wide py-1.5 transition-colors focus:bg-muted outline-none">
                            <Edit className="mr-2 h-3 w-3" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDuplicate(product)} className="hover:bg-muted cursor-pointer text-[10px] font-bold uppercase tracking-wide py-1.5">
                            <Copy className="mr-2 h-3 w-3" /> Duplicar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(product.id)} className="text-destructive hover:bg-destructive/10 cursor-pointer text-[10px] font-bold uppercase tracking-wide py-1.5">
                            <Trash2 className="mr-2 h-3 w-3" /> Excluir
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex-1 relative z-10">
                <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[8px] font-bold uppercase tracking-wider px-1.5 py-0">
                        {product.brand}
                    </Badge>
                </div>
                <h3 className="font-bold text-foreground text-sm mb-0.5 truncate tracking-tight group-hover:text-primary transition-colors">{product.name}</h3>
                <p className="text-[9px] text-primary font-mono mb-2 font-bold tracking-wider">{product.sku}</p>

                <p className="text-[11px] text-muted-foreground line-clamp-2 min-h-[32px] leading-relaxed font-medium">{product.description}</p>
            </div>

            <div className="mt-4 flex flex-wrap gap-1.5 relative z-10">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0">
                    {product.category}
                </Badge>
                {product.subcategory && (
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-border text-[8px] font-bold uppercase tracking-wider px-1.5 py-0">
                        {product.subcategory}
                    </Badge>
                )}
            </div>
        </div>
    );
}

