import { describe, expect, it } from 'vitest';
import { stageLifecyclePatch } from './deal-stage-lifecycle';

describe('commercial outcome lifecycle', () => {
    it('sets only the Won timestamp and a fixed 100% probability', () => {
        expect(stageLifecyclePatch('won', 12, '2026-10-12T10:00:00.000Z')).toEqual({
            stage: 'won', probability: 100, won_at: '2026-10-12T10:00:00.000Z', lost_at: null,
        });
    });
    it('sets only the Lost timestamp and a fixed 0% probability', () => {
        expect(stageLifecyclePatch('lost', 70, '2026-10-12T11:00:00.000Z')).toEqual({
            stage: 'lost', probability: 0, won_at: null, lost_at: '2026-10-12T11:00:00.000Z',
        });
    });
    it('clears stale closed dates when a deal re-enters an active stage', () => {
        expect(stageLifecyclePatch('33333333-3333-4333-8333-333333333333', 35)).toEqual({
            stage: '33333333-3333-4333-8333-333333333333',
            probability: 35, won_at: null, lost_at: null,
        });
        expect(stageLifecyclePatch('qualification')).toEqual({
            stage: 'qualification', won_at: null, lost_at: null,
        });
    });
});
