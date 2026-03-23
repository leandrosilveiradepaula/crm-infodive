import { useState } from 'react';
import { getOrCreateDealRoom, fetchPublicRoomData as fetchPublicRoomDataAction, DealRoom } from '@/app/(dashboard)/pipeline/dealroom-actions';

// ... other interfaces remain ...
export interface DealOwner {
    name: string;
    email: string;
    phone: string;
    avatar: string;
}

export interface DealRoomData {
    room: DealRoom;
    deal: {
        title: string;
        value: number;
        company: string;
        expected_close_date: string;
        owner: DealOwner;
        products: any[];
        sales_orders: any[];
    };
}

export const useDealRoom = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Internal: Create or Get Room for a Deal
    const getOrCreateRoom = async (dealId: string) => {
        setLoading(true);
        try {
            const result = await getOrCreateDealRoom(dealId);
            if (!result.success) throw new Error(result.error);
            return result.data;
        } catch (err: any) {
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    // Public: Fetch by Token
    const fetchPublicRoomData = async (token: string) => {
        setLoading(true);
        try {
            const result = await fetchPublicRoomDataAction(token);
            if (!result.success) throw new Error(result.error);
            return result.data;
        } catch (err: any) {
            console.error('Error fetching room:', err);
            setError(err.message);
            return null;
        } finally {
            setLoading(false);
        }
    };

    return {
        getOrCreateRoom,
        fetchPublicRoomData,
        loading,
        error
    };
};
