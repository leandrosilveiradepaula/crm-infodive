'use client';

import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function ConnectEmailButton() {
    const [loading, setLoading] = useState(false);
    const handleConnect = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/emails/connect');
            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error(data.error || 'Failed to get auth url');
            }
        } catch (error: any) {
            console.error('Error connecting email:', error);
            toast.error('Erro ao conectar conta de email: ' + error.message);
            setLoading(false);
        }
    };

    return (
        <Button
            onClick={handleConnect}
            disabled={loading}
            className="bg-[#0078D4] hover:bg-[#005a9e] text-white font-semibold"
        >
            {loading ? (
                'Conectando...'
            ) : (
                <>
                    <Mail className="mr-2 h-4 w-4" />
                    Conectar Office 365
                </>
            )}
        </Button>
    );
}
