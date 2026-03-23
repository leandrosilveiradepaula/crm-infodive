import { useState, useEffect, useCallback } from 'react';
import { getPriceLists, saveTemplateAction, getTemplateAction, importPriceListAction, deletePriceListAction, PriceList, PriceListTemplate } from '@/app/(dashboard)/settings/price-lists-actions';
import type { ColumnMapping, ParsedRow } from '../utils/excelParser';

export const usePriceLists = () => {
    const [priceLists, setPriceLists] = useState<PriceList[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchPriceLists = useCallback(async () => {
        try {
            setLoading(true);
            const result = await getPriceLists();
            if (!result.success) throw new Error(result.error);
            setPriceLists(result.data as PriceList[]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const saveTemplate = async (manufacturer: string, mapping: ColumnMapping) => {
        try {
            const result = await saveTemplateAction(manufacturer, mapping);
            if (!result.success) throw new Error(result.error);
        } catch (err: any) {
            throw new Error(`Failed to save template: ${err.message}`);
        }
    };

    const getTemplate = async (manufacturer: string): Promise<ColumnMapping | null> => {
        try {
            const result = await getTemplateAction(manufacturer);
            if (!result.success) throw new Error(result.error);
            return result.data as ColumnMapping | null;
        } catch (err: any) {
            console.error('Error fetching template:', err);
            return null;
        }
    };

    const importPriceList = async (
        name: string,
        manufacturer: string,
        fileName: string,
        products: ParsedRow[]
    ): Promise<{ success: boolean; priceListId?: string; error?: string }> => {
        try {
            const result = await importPriceListAction(name, manufacturer, fileName, products);
            if (!result.success) {
                return { success: false, error: result.error };
            }

            await fetchPriceLists();

            return {
                success: true,
                priceListId: result.priceListId
            };
        } catch (err: any) {
            return {
                success: false,
                error: err.message
            };
        }
    };

    const deletePriceList = async (id: string) => {
        try {
            const result = await deletePriceListAction(id);
            if (!result.success) throw new Error(result.error);
            await fetchPriceLists();
        } catch (err: any) {
            throw new Error(`Failed to delete price list: ${err.message}`);
        }
    };

    useEffect(() => {
        fetchPriceLists();
    }, [fetchPriceLists]);

    return {
        priceLists,
        loading,
        error,
        importPriceList,
        saveTemplate,
        getTemplate,
        deletePriceList,
        refresh: fetchPriceLists
    };
};
