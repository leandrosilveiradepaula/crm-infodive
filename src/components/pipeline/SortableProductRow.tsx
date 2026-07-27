import React from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { ProductRowHeader } from './product-row/ProductRowHeader';
import type { ProductTechDetail } from '@/types/deal';

export interface ProductItem {
    id: string;
    sku?: string;
    name: string;
    display_name?: string | null;
    description?: string;
    quantity: number;
    unit_price: number;
    cost?: number;
    margin?: number;
    category?: string;
    subcategory?: string;
    manufacturer?: string;
    is_usd?: boolean;
    usd_cost?: number;
    exchange_rate?: number;
    is_bid?: boolean;
    bid_number?: string;
    bid_validity?: string;
    external_id?: string;
    expiration_date?: string;
    details?: ProductTechDetail[];
    billing_type?: 'direct' | 'indirect';
    distributor_id?: string;
    distributor_cnpj?: string;
    is_optional?: boolean;
    parent_id?: string | null;
    duration?: number | null;
    duration_unit?: string | null;
    catalog_description?: string;
    show_sku_on_proposal?: boolean;
    show_description_on_proposal?: boolean;
    present_in_usd?: boolean;
    pricing_model?: 'one_time' | 'monthly' | 'annual';
    display_order?: number;
    custom_label?: string | null;
    tech_details?: string | null;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    [key: string]: any;
}

interface SortableProductRowProps {
    product: ProductItem;
    isEditing: boolean;
    isFirst: boolean;
    isLast: boolean;
    selectedProducts: Set<string>;
    toggleSelectProduct: (productId: string) => void;
    toggleProductExpansion: (productId: string) => void;
    drawerProductId?: string | null;
    handleUpdateProduct: (prodId: string, field: keyof ProductItem, value: unknown) => void;
    handleInputKeyDown: (e: React.KeyboardEvent) => void;
    handleRemoveProduct: (prodId: string) => void;
    moveProduct: (id: string, direction: 'up' | 'down') => void;
    previousProduct?: ProductItem;
    onLink?: (childId: string, parentId: string) => void;
    onUnlink?: (childId: string) => void;
}

export const SortableProductRow = ({
    product,
    isEditing,
    isFirst,
    isLast,
    selectedProducts,
    toggleSelectProduct,
    toggleProductExpansion,
    drawerProductId,
    handleUpdateProduct,
    handleInputKeyDown,
    handleRemoveProduct,
    moveProduct,
    previousProduct,
    onLink,
    onUnlink
}: SortableProductRowProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: product.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        zIndex: isDragging ? 100 : 1,
        position: 'relative' as const,
    };

    return (
        <React.Fragment>
            <ProductRowHeader
                product={product}
                isEditing={isEditing}
                isFirst={isFirst}
                isLast={isLast}
                selectedProducts={selectedProducts}
                toggleSelectProduct={toggleSelectProduct}
                toggleProductExpansion={toggleProductExpansion}
                drawerProductId={drawerProductId}
                handleUpdateProduct={handleUpdateProduct}
                handleRemoveProduct={handleRemoveProduct}
                moveProduct={moveProduct}
                previousProduct={previousProduct}
                onLink={onLink}
                onUnlink={onUnlink}
                setNodeRef={setNodeRef}
                style={style}
                attributes={attributes}
                listeners={listeners}
                isDragging={isDragging}
                handleInputKeyDown={handleInputKeyDown}
            />
        </React.Fragment>
    );
};
