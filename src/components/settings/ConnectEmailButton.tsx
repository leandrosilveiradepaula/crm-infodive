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
            size="lg"
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
