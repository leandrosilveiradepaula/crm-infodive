import { useState, useEffect, useCallback } from 'react';
import { getPipelineData, updateDealStage as updateDealStageAction, createDeal as createDealAction, updateDeal as updateDealAction, duplicateDealEntry } from '@/app/(dashboard)/pipeline/actions';
import { checkAutomations } from '@/lib/automations';
import { PRODUCT_CATEGORIES } from '@/lib/constants';

// Copying required types here
export interface ProductItem {
    id: string;
    sku: string;
    name: string;
    quantity: number;
    unit_price: number;
    cost?: number;
    margin?: number;
    notes?: string;
    category?: string;
    subcategory?: string;
    description?: string;
    isBidMode?: boolean;
    external_id?: string;
    expiration_date?: string;
    is_bid?: boolean;
    bid_number?: string;
    bid_validity?: string;
    part_number?: string;
    is_usd?: boolean;
    usd_cost?: number;
    exchange_rate?: number;
    manufacturer?: string;
    distributor_id?: string;
    distributor_branch_id?: string;
    details?: any[];
}

export interface DealActivity {
    id: string;
    deal_id: string;
    type: 'status_change' | 'note' | 'call' | 'meeting';
    description: string;
    date?: string;
    created_at?: string;
    user_name: string;
}

export interface Deal {
    id: string;
    title: string;
    company: string;
    value: number;
    probability: number;
    stage: string;
    owner: string;
    tags: string[];
    description?: string;
    days_in_stage: number;
    created_at: string;
    contact_name?: string;
    contact_email?: string;
    contact_phone?: string;
    expected_close_date?: string;
    lead_source?: string;
    next_step?: string;
    commission_deduction?: number;
    loss_reason?: string;
    lost_at?: string;
    won_at?: string;
    account_id?: string;
    lead_id?: string;
    deal_products?: ProductItem[];
    deal_activities?: DealActivity[];
    distributor_id?: string;
    supplier_id?: string;
    distributor?: { name: string };
    supplier?: { name: string };
    manufacturer_contact_id?: string;
    manufacturer_contact?: any;
    distributor_contact_id?: string;
    distributor_contact?: any;
    client_contact_id?: string;
    client_contact?: any;
    manufacturer_contact_role?: string;
    distributor_contact_role?: string;
    client_contact_role?: string;
    manufacturer_contact_notes?: string;
    distributor_contact_notes?: string;
    client_contact_notes?: string;
    manufacturer_contact_last_interaction?: string;
    distributor_contact_last_interaction?: string;
    client_contact_last_interaction?: string;
    commission_status?: string;
    commission_paid_at?: string;
    commission_value_final?: number;
    billing_type?: string;
    health_score?: number;
    health_trend?: string;
    risk_factors?: string[];
    sentiment_score?: number;
    custom_fields?: Record<string, any>;
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
