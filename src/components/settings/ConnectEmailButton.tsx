'use client';

import { Button } from '@/components/ui/button';
import { Mail, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { connectEmailAction } from '@/app/api/emails/connect/actions';

export function ConnectEmailButton() {
    const [loading, setLoading] = useState(false);

    const handleConnect = async () => {
        setLoading(true);
        try {
            // Using the Server Action to initiate OAuth flow (solves PKCE error)
            await connectEmailAction();
        } catch (error: any) {
            console.error('Error connecting email:', error);
            // If we caught an error here, it means the redirection didn't happen 
            // or the initiation failed.
            if (error.message !== 'NEXT_REDIRECT') {
                toast.error('Erro ao conectar conta de email: ' + error.message);
                setLoading(false);
            }
        }
    };

    return (
        <Button
            onClick={handleConnect}
            disabled={loading}
            className="bg-[#0078D4] hover:bg-[#005a9e] text-white font-black h-11 px-6 rounded-2xl shadow-lg shadow-[#0078D4]/20 transition-all uppercase text-[10px] tracking-widest"
        >
            {loading ? (
                <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Conectando...
                </>
            ) : (
                <>
                    <Mail className="mr-2 h-4 w-4" />
                    Conectar Office 365
                </>
            )}
        </Button>
    );
}
