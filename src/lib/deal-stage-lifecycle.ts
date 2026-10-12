/**
 * Keep persisted commercial outcomes consistent across every write entrypoint.
 * Terminal states always use canonical probabilities and a single timestamp.
 * Reopening a deal clears stale close timestamps without resetting its value.
 */
export function stageLifecyclePatch(
    stage: string,
    probability?: number,
    at: string = new Date().toISOString(),
): { stage: string; probability?: number; won_at: string | null; lost_at: string | null } {
    if (stage === 'won') {
        return { stage, probability: 100, won_at: at, lost_at: null };
    }
    if (stage === 'lost') {
        return { stage, probability: 0, won_at: null, lost_at: at };
    }
    return {
        stage,
        ...(probability !== undefined ? { probability } : {}),
        won_at: null,
        lost_at: null,
    };
}
