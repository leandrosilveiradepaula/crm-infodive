import { useState, useEffect, useCallback } from 'react';
import { getAuditLogs, createAuditLog, AuditLog } from '@/app/(dashboard)/settings/audit-actions';

export const useAuditLogs = () => {
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchLogs = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAuditLogs();
            setLogs(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const addLog = async (log: Omit<AuditLog, 'id' | 'timestamp'>) => {
        try {
            const result = await createAuditLog(log);
            if (!result.success) throw new Error(result.error);
            await fetchLogs();
            return true;
        } catch (err: any) {
            console.error('Error adding log:', err);
            return false;
        }
    };

    useEffect(() => {
        fetchLogs();
    }, [fetchLogs]);

    return { logs, loading, error, addLog, refetch: fetchLogs };
};
