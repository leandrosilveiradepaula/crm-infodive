import { useState, useEffect, useCallback } from 'react';
import { getContracts, createContract as createContractAction, updateContract as updateContractAction, deleteContract as deleteContractAction } from '@/app/(dashboard)/contracts/actions';
import type { Contract } from '@/types/contract';

export const useContracts = () => {
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContracts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getContracts();
            setContracts(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const addContract = async (contract: Partial<Contract>) => {
        try {
            const result = await createContractAction(contract);
            if (!result.success) throw new Error(result.error);
            await fetchContracts();
            return result.data;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    };

    const updateContract = async (id: string, updates: Partial<Contract>) => {
        try {
            const result = await updateContractAction(id, updates);
            if (!result.success) throw new Error(result.error);
            await fetchContracts();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const deleteContract = async (id: string) => {
        try {
            const result = await deleteContractAction(id);
            if (!result.success) throw new Error(result.error);
            await fetchContracts();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    useEffect(() => {
        fetchContracts();
    }, [fetchContracts]);

    return { contracts, loading, error, addContract, updateContract, deleteContract, refetch: fetchContracts };
};
