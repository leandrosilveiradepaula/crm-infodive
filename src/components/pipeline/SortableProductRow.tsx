import React, { useMemo } from 'react';

import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { ProductRowHeader } from './product-row/ProductRowHeader';
import { ProductFinancialDetails } from './product-row/ProductFinancialDetails';

export interface ProductItem {
    id: string;
    sku?: string;
    name: string;
    description?: string;
    quantity: number;
    unit_price: number;
    cost?: number;
    margin?: number;
    category?: string;
    is_usd?: boolean;
    usd_cost?: number;
    exchange_rate?: number;
    is_bid?: boolean;
    bid_number?: string;
    bid_validity?: string;
    external_id?: string;
    expiration_date?: string;
    details?: any[];
    billing_type?: 'direct' | 'indirect';
    distributor_id?: string;
    distributor_cnpj?: string;
    is_optional?: boolean;
    parent_id?: string | null;
    duration?: number | null;
    duration_unit?: string | null;
    catalog_description?: string;
    show_description_on_proposal?: boolean;
    present_in_usd?: boolean;
    pricing_model?: 'one_time' | 'monthly' | 'annual';
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
    expandedProducts: Set<string>;
    handleUpdateProduct: (prodId: string, field: keyof ProductItem, value: any) => void;
    handleInputKeyDown: (e: React.KeyboardEvent) => void;
    handleRemoveProduct: (prodId: string) => void;
    moveProduct: (id: string, direction: 'up' | 'down') => void;
    dealOwner: any;
    editedDeal: any;
    setEditedDeal: (deal: any) => void;
    setShowImportModal: (show: boolean) => void;
    setTargetImportProductId: (id: string | null) => void;
    onEnableEdit: () => void;
    distributors?: any[];
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
    expandedProducts,
    handleUpdateProduct,
    handleInputKeyDown,
    handleRemoveProduct,
    moveProduct,
    dealOwner,
    editedDeal,
    setEditedDeal,
    setShowImportModal,
    setTargetImportProductId,
    onEnableEdit,
    distributors = [],
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

    const details = useMemo(() => {
        let parsed: any[] = [];
        if (product.details && Array.isArray(product.details)) {
            parsed = product.details;
        } else if (product.description && typeof product.description === 'string') {
            const trimmed = product.description.trim();
            if (trimmed.startsWith('[')) {
                try {
                    parsed = JSON.parse(product.description);
                } catch (e) {
                    // Fallback: continue to textual analysis if invalid JSON
                }
            } else if (trimmed.length > 0) {
                // Fallback for simple text description: show as 1 item
                parsed = [{
                    sku: product.sku,
                    description: product.description,
                    quantity: product.quantity,
                    unit_price: product.unit_price || product.cost
                }];
            }
        }

        return parsed.map((item: any, idx: number) => ({
            ...item,
            id: item.id || `legacy-${product.id || 'new'}-${idx}`
        }));
    }, [product.details, product.description, product.id, product.sku, product.quantity, product.unit_price, product.cost]);

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
                expandedProducts={expandedProducts}
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
            {expandedProducts.has(product.id) && (
                <ProductFinancialDetails
                    product={product}
                    isEditing={isEditing}
                    handleUpdateProduct={handleUpdateProduct}
                    handleInputKeyDown={handleInputKeyDown}
                    editedDeal={editedDeal}
                    setEditedDeal={setEditedDeal}
                    dealOwner={dealOwner}
                    setShowImportModal={setShowImportModal}
                    setTargetImportProductId={setTargetImportProductId}
                    distributors={distributors}
                    onEnableEdit={onEnableEdit}
                    details={details}
                />
            )}
        </React.Fragment>
    );
};
