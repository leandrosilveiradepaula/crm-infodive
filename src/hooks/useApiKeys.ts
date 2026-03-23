import { useState, useEffect, useCallback } from 'react';
import { getApiKeys, createApiKey, revokeApiKey as revokeApiKeyAction, removeApiKey } from '@/app/(dashboard)/integrations/apikey-actions';

export interface ApiKey {
    id: string;
    name: string;
    token_prefix: string;
    status: 'active' | 'revoked';
    last_used: string | null;
    created_at: string;
}

export const useApiKeys = () => {
    const [keys, setKeys] = useState<ApiKey[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchKeys = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getApiKeys();
            setKeys(data as ApiKey[]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const addKey = async (name: string) => {
        try {
            const data = await createApiKey(name);
            setKeys(prev => [data as ApiKey, ...prev]);
            return data as ApiKey;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    };

    const revokeKey = async (id: string) => {
        try {
            await revokeApiKeyAction(id);
            setKeys(prev => prev.map(k => k.id === id ? { ...k, status: 'revoked' } : k));
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const deleteKey = async (id: string) => {
        try {
            await removeApiKey(id);
            setKeys(prev => prev.filter(k => k.id !== id));
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    useEffect(() => {
        fetchKeys();
    }, [fetchKeys]);

    return { keys, loading, error, addKey, revokeKey, deleteKey, refetch: fetchKeys };
};
