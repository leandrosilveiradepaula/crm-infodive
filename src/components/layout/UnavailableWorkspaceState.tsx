'use client';

import { AlertCircle } from 'lucide-react';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';

/** String-only server/client boundary for unavailable workspaces. */
export function UnavailableWorkspaceState({ description }: { description: string }) {
    return (
        <div role="alert">
            <PremiumEmptyState icon={AlertCircle} title="Acesso indisponível" description={description} />
        </div>
    );
}
