'use client';

import { AiSuggestionsPanel } from '@/components/activities/AiSuggestionsPanel';

interface DealSuggestedActionsProps {
    dealId: string;
    onAccepted?: () => void;
}

export function DealSuggestedActions({ dealId, onAccepted }: DealSuggestedActionsProps) {
    return (
        <AiSuggestionsPanel
            dealId={dealId}
            onAccepted={onAccepted}
            compact
            maxItems={5}
        />
    );
}
