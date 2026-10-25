import type { Deal } from '@/types/deal';

/** Revert only the failed optimistic move and preserve independent edits. */
export function rollbackOptimisticStageMove(
    current: Deal[], original: Deal, attemptedStage: string,
): Deal[] {
    return current.map(deal =>
        deal.id === original.id && deal.stage === attemptedStage ? original : deal
    );
}
