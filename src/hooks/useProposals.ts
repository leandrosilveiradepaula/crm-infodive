import { useState, useEffect, useCallback } from 'react';
import { getProposals, createProposalAction, updateProposalAction, deleteProposalAction } from '@/app/(dashboard)/proposals/proposals-actions';
import type { Proposal, ProposalStatus } from '../types/proposal';

export const useProposals = (dealId?: string) => {
    const [proposals, setProposals] = useState<Proposal[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProposals = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getProposals(dealId as string);
            setProposals(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [dealId]);

    const createProposal = async (proposalData: Partial<Proposal>) => {
        try {
            const result = await createProposalAction(proposalData);
            if (!result.success) throw new Error(result.error);
            await fetchProposals();
            return result.data;
        } catch (err: any) {
            console.error('Error creating proposal:', err);
            throw err;
        }
    };

    const updateProposal = async (id: string, updates: Partial<Proposal>) => {
        try {
            const result = await updateProposalAction(id, updates);
            if (!result.success) throw new Error(result.error);
            await fetchProposals();
        } catch (err: any) {
            console.error('Error updating proposal:', err);
            throw err;
        }
    };

    const deleteProposal = async (id: string) => {
        try {
            const result = await deleteProposalAction(id);
            if (!result.success) throw new Error(result.error);
            await fetchProposals();
        } catch (err: any) {
            console.error('Error deleting proposal:', err);
            throw err;
        }
    };

    useEffect(() => {
        fetchProposals();
    }, [fetchProposals]);

    return {
        proposals,
        loading,
        error,
        createProposal,
        updateProposal,
        deleteProposal,
        refetch: fetchProposals
    };
};
