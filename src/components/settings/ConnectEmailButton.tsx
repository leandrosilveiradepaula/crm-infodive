'use client';

import { Button } from '@/components/ui/button';
import { Mail } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { createClient } from '@/utils/supabase/client';

export function ConnectEmailButton() {
    const [loading, setLoading] = useState(false);
    const handleConnect = async () => {
        setLoading(true);
        try {
            const supabase = createClient();

            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'azure',
                options: {
                    scopes: 'Mail.Read Mail.Send User.Read offline_access',
                    redirectTo: `${window.location.origin}/auth/callback?next=/inbox`,
                },
            });

            if (error) {
                throw new Error(error.message);
            }

            if (data.url) {
                window.location.href = data.url;
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
