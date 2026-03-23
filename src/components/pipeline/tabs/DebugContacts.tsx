'use client';
import React from 'react';
import { useContacts } from '@/hooks/useContacts';

export const DebugContacts = () => {
    const { contacts, loading, error } = useContacts();
    return (
        <div className="p-4 bg-black text-white rounded">
            <h3>Debug Contacts</h3>
            <p>Loading: {loading ? 'Yes' : 'No'}</p>
            <p>Error: {error || 'None'}</p>
            <p>Total Contacts: {contacts.length}</p>
        </div>
    );
};
