import { describe, expect, it } from 'vitest';
import { isPublicRoute } from './public-routes';

describe('health route exposure', () => {
    it('allows the dedicated health endpoint without opening adjacent APIs', () => {
        expect(isPublicRoute('/api/health')).toBe(true);
        expect(isPublicRoute('/api/health/details')).toBe(false);
        expect(isPublicRoute('/api/auth/me')).toBe(false);
    });
});
