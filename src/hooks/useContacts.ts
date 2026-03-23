import { useState, useEffect, useCallback } from 'react';
import { getContacts, createContact as createContactAction, updateContact as updateContactAction, deleteContact as deleteContactAction } from '@/app/(dashboard)/contacts/actions';
import { Contact } from '@/types/contact';

export const useContacts = () => {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchContacts = useCallback(async () => {
        try {
            setLoading(true);
            const { contacts: data, error } = await getContacts();

            if (error) throw new Error(error);
            setContacts(data as Contact[]);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    const addContact = async (contact: Partial<Contact>) => {
        try {
            const { success, error } = await createContactAction(contact);

            if (!success) throw new Error(error || 'Failed to create contact');
            await fetchContacts();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const updateContact = async (id: string, updates: Partial<Contact>) => {
        try {
            await updateContactAction(id, updates);
            await fetchContacts();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    const deleteContact = async (id: string) => {
        try {
            await deleteContactAction(id);
            await fetchContacts();
            return true;
        } catch (err: any) {
            setError(err.message);
            return false;
        }
    };

    useEffect(() => {
        fetchContacts();
    }, [fetchContacts]);

    return { contacts, loading, error, addContact, updateContact, deleteContact, refetch: fetchContacts };
};
