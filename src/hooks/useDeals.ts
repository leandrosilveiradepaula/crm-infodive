import { useState, useEffect, useCallback } from 'react';
import { getPipelineData, updateDealStage as updateDealStageAction, createDeal as createDealAction, updateDeal as updateDealAction, duplicateDealEntry } from '@/app/(dashboard)/pipeline/actions';
import { checkAutomations } from '@/lib/automations';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

import type { Deal, DealProduct as ProductItem } from '@/types/deal';

export type { ProductItem, Deal };

export interface DealActivity {
    id: string;
    deal_id: string;
    type: 'status_change' | 'note' | 'call' | 'meeting';
    description: string;
    date?: string;
    created_at?: string;
    user_name: string;
}

export const useDeals = () => {
    const [deals, setDeals] = useState<Deal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDeals = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getPipelineData();
            setDeals(data as any as Deal[]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const addDeal = async (newDeal: Partial<Deal>, products: Omit<ProductItem, 'id'>[] = []) => {
        try {
            // Note: Since Server Action createDeal just takes data and inserts deal + dealproducts. We rewrite this:
            // Assuming DealService.createDeal was updated to take full data
            const dataToInsert = { ...newDeal, products };
            await createDealAction(dataToInsert);

            // Re-fetch
            await fetchDeals();
            return newDeal;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    };

    const addActivity = async (activity: Omit<DealActivity, 'id' | 'date'>) => {
        try {
            // Currently DealActivity Server action doesn't exist, we will add it.
            // Placeholder for now
            const fetchReq = await fetch('/api/deals/activities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(activity)
            });
            if (!fetchReq.ok) throw new Error('API request failed');

            await fetchDeals();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const updateDeal = async (id: string, updates: Partial<Deal>) => {
        try {
            // OPTIMISTIC UPDATE: Update local state immediately for instant UI feedback
            setDeals(prevDeals =>
                prevDeals.map(deal =>
                    deal.id === id ? { ...deal, ...updates } : deal
                )
            );

            await updateDealAction(id, updates);
            // Refresh local state from database to ensure consistency
            await fetchDeals();

            // Automation Hook
            if (updates.stage) {
                checkAutomations({
                    type: 'deal_moved',
                    payload: {
                        dealId: id,
                        to: updates.stage
                    }
                });
            }

            return true;
        } catch (err: any) {
            // If database update fails, revert by fetching fresh data
            await fetchDeals();
            setError(err.message);
            return false;
        }
    };

    const deleteDeal = async (id: string) => {
        try {
            // Placeholder: Assume DealService.deleteDeal or API route handles this.
            const fetchReq = await fetch(`/api/deals/${id}`, {
                method: 'DELETE',
            });
            if (!fetchReq.ok) throw new Error('API request failed');

            setDeals(prev => prev.filter(d => d.id !== id));
            return true;
        } catch (err: any) {
            setError(err.message);
        }
    };

    const updateDealStage = async (id: string, newStage: string) => {
        try {
            await updateDealStageAction(id, newStage);
            await fetchDeals();

            // Run Automation
            checkAutomations({
                type: 'deal_moved',
                payload: {
                    dealId: id,
                    to: newStage
                }
            });

        } catch (err: any) {
            setError(err.message);
        }
    };

    const duplicateDeal = async (id: string) => {
        try {
            const newDeal = await duplicateDealEntry(id);
            await fetchDeals();
            return newDeal;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    };

    useEffect(() => {
        fetchDeals();
    }, [fetchDeals]);

    return { deals, loading, error, addDeal, updateDeal, deleteDeal, updateDealStage, addActivity, duplicateDeal, refetch: fetchDeals };
};
