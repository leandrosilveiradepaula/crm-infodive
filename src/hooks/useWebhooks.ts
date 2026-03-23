import { useState, useEffect, useCallback } from 'react';
import { getWebhooks, createWebhook, removeWebhook } from '@/app/(dashboard)/integrations/webhook-actions';

export interface Webhook {
    id: string;
    url: string;
    events: string[];
    status: 'active' | 'inactive' | 'error';
    last_triggered: string | null;
    created_at: string;
}

export const useWebhooks = () => {
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchWebhooks = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getWebhooks();
            setWebhooks(data as Webhook[]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const addWebhook = async (webhook: Omit<Webhook, 'id' | 'created_at' | 'last_triggered'>) => {
        try {
            const data = await createWebhook(webhook);
            setWebhooks(prev => [data as Webhook, ...prev]);
            return data;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    };

    const deleteWebhook = async (id: string) => {
        try {
            await removeWebhook(id);
            setWebhooks(prev => prev.filter(w => w.id !== id));
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    useEffect(() => {
        fetchWebhooks();
    }, [fetchWebhooks]);

    return { webhooks, loading, error, addWebhook, deleteWebhook, refetch: fetchWebhooks };
};
