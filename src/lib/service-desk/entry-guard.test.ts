import { describe, expect, it } from 'vitest';
import { decideServiceDeskEntry } from './entry-guard';

describe('decideServiceDeskEntry', () => {
    it('admits an authenticated session with a user and organization', () => {
        expect(decideServiceDeskEntry({
            isLoggedIn: true,
            userId: 'user-1',
            organizationId: 'organization-1'
        })).toEqual({ admitted: true });
    });

    it('refuses an unauthenticated session', () => {
        expect(decideServiceDeskEntry({
            isLoggedIn: false,
            userId: 'user-1',
            organizationId: 'organization-1'
        })).toEqual({ admitted: false, reason: 'unauthenticated' });
    });

    it('refuses a session without a user id', () => {
        expect(decideServiceDeskEntry({
            isLoggedIn: true,
            userId: null,
            organizationId: 'organization-1'
        })).toEqual({ admitted: false, reason: 'missing-user-id' });
    });

    it('refuses a session without an organization id', () => {
        expect(decideServiceDeskEntry({
            isLoggedIn: true,
            userId: 'user-1',
            organizationId: undefined
        })).toEqual({ admitted: false, reason: 'missing-organization-id' });
    });
});
