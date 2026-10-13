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
            // Never fall back to a blind write. The revision must be the one
            // observed in this hook's most recently fetched contracts.
            const current = contracts.find(contract => contract.id === id);
            if (!current || current.status !== 'draft' || !current.updatedAt) {
                throw new Error('Rascunho ausente ou desatualizado. Recarregue os contratos.');
            }
            const result = await updateContractAction(id, updates, current.updatedAt);
            if (!result.success) throw new Error(result.error || 'Falha ao salvar o rascunho.');
            setError(null);
            await fetchContracts();
            return true;
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : 'Falha ao salvar o rascunho.');
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
