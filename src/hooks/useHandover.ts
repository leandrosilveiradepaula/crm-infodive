import { useState, useCallback } from 'react';
import { getHandover, createHandover as createHandoverAction, updateHandover as updateHandoverAction } from '@/app/(dashboard)/pipeline/handover-actions';

export interface Handover {
    id: string;
    deal_id: string;
    technical_lead_id?: string;
    status: 'pending' | 'in_progress' | 'completed';
    checklist_data: Record<string, boolean>;
    acceptance_term_url?: string;
    completed_at?: string;
    created_at: string;
    created_by: string;
    deal?: {
        title: string;
        customer: {
            name: string;
        }
    };
}

export const useHandover = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchHandover = useCallback(async (dealId: string) => {
        setLoading(true);
        try {
            const data = await getHandover(dealId);
            return data as Handover | null;
        } catch (err: any) {
            console.error('Error fetching handover:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    }, []);

    const createHandover = async (handover: Partial<Handover>) => {
        setLoading(true);
        try {
            const data = await createHandoverAction(handover);
            return data as Handover;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    const updateHandover = async (id: string, updates: Partial<Handover>) => {
        setLoading(true);
        try {
            const data = await updateHandoverAction(id, updates);
            return data as Handover;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        fetchHandover,
        createHandover,
        updateHandover,
        loading,
        error
    };
};
