import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('tenant authorization hardening', () => {
    it('does not resolve organization from user_metadata during login', () => {
        const source = readFileSync('src/app/login/actions.ts', 'utf8');
        expect(source).not.toContain('user_metadata?.organization_id');
        expect(source).not.toContain('auth.admin.getUserById');
        expect(source).toContain(".from('profiles')");
        expect(source).toContain(".select('organization_id, status')");
    });

    it('revalidates profile on every protected server context', () => {
        const source = readFileSync('src/lib/auth-server.ts', 'utf8');
        expect(source).toContain("Authorization is revalidated against the server-side profile");
        expect(source).toContain(".select('organization_id, status')");
        expect(source).not.toContain('// Fast path: organizationId already in session');
    });

    it('api me uses the revalidated session context', () => {
        const source = readFileSync('src/app/api/auth/me/route.ts', 'utf8');
        expect(source).toContain('requireSessionContext()');
    });
});
