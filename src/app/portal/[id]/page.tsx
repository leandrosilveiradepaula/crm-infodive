
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { fetchPublicRoomData } from '@/app/(dashboard)/pipeline/dealroom-actions';
import { DealRoomPortal } from '@/components/portal/DealRoomPortal';
import { ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface PageProps {
    params: Promise<{ id: string }>
}

export default async function DealRoomPortalPage({ params }: PageProps) {
    const { id: token } = await params;
    const result = await fetchPublicRoomData(token);

    if (!result.success || !result.data) {
        return (
            <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
                <div className="max-w-md w-full text-center space-y-6 animate-in fade-in zoom-in duration-500">
                    <div className="h-20 w-20 bg-destructive-subtle rounded-[var(--radius-panel)] flex items-center justify-center mx-auto border border-destructive/20">
                        <ShieldAlert className="w-10 h-10 text-destructive-readable" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-page-title font-bold">Acesso <span className="text-destructive-readable">Restrito</span></h1>
                        <p className="text-muted-foreground font-medium">Este link expirou ou o token de acesso é inválido para esta área segura.</p>
                    </div>
                    <Button asChild variant="outline" className="h-[var(--ds-control-height-large)] px-8">
                        <Link href="/">Voltar ao Início</Link>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <Suspense fallback={<PortalSkeleton />}>
            <DealRoomPortal data={result.data} />
        </Suspense>
    );
}

function PortalSkeleton() {
    return (
        <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
            <div className="flex flex-col items-center gap-4">
                <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <p className="text-body-ui font-semibold animate-pulse">Autenticando Acesso Seguro...</p>
            </div>
        </div>
    );
}
