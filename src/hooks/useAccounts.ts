import { useState, useEffect, useCallback } from 'react';
import { getAccounts, createAccount as createAccountAction, updateAccount as updateAccountAction, deleteAccount as deleteAccountAction } from '@/app/(dashboard)/accounts/actions';
import { Account } from '@/types/account';

export interface AccountContact {
    id: string;
    name: string;
    email: string;
    mobile: string;
    landline: string;
    role: string;
    isPrimary: boolean;
}

export interface AccountBranch {
    id: string;
    name: string;
    zip: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    cnpj?: string; // Migration V51
    ie?: string;   // Migration V51
}

export const useAccounts = () => {
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchAccounts = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getAccounts();
            setAccounts(data as unknown as Account[]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const uploadLogo = async (accountId: string, file: File): Promise<string | null> => {
        // Feature flagged out/stubbed. Real implementation needs a dedicated upload endpoint.
        console.warn("uploadLogo requires a dedicated Server Action for file uploads.");
        return null;
    };

    const addAccount = async (account: Partial<Account>) => {
        try {
            const result = await createAccountAction(account);
            if (!result.success) throw new Error(result.error);
            await fetchAccounts();
            return result.data;
        } catch (err: any) {
            setError(err.message);
            return null;
        }
    };

    const updateAccount = async (id: string, updates: Partial<Account>) => {
        try {
            const result = await updateAccountAction(id, updates);
            if (!result.success) throw new Error(result.error);
            await fetchAccounts();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const deleteAccount = async (id: string) => {
        try {
            const result = await deleteAccountAction(id);
            if (!result.success) throw new Error(result.error);
            await fetchAccounts();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, [fetchAccounts]);

    return { accounts, loading, error, addAccount, updateAccount, deleteAccount, uploadLogo, refetch: fetchAccounts };
};
