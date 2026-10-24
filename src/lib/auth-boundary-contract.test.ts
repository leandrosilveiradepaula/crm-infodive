import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const middleware = readFileSync('src/middleware.ts', 'utf8');
const login = readFileSync('src/app/login/actions.ts', 'utf8');
const auth = readFileSync('src/lib/auth-server.ts', 'utf8');
const migration = readFileSync(
    'supabase/migrations/20261010173000_active_profile_only_tenant_helper.sql', 'utf8',
);

describe('fail-closed identity boundaries', () => {
    it('removes caller-supplied identity and token headers before checking public paths', () => {
        const stripUser = middleware.indexOf("requestHeaders.delete('X-User-Id')");
        const stripToken = middleware.indexOf("requestHeaders.delete('X-Supabase-Token')");
        const publicRoute = middleware.indexOf('if (isPublicRoute(pathname))');
        expect(stripUser).toBeGreaterThan(0);
        expect(stripToken).toBeGreaterThan(stripUser);
        expect(publicRoute).toBeGreaterThan(stripToken);
        expect(middleware).toContain("requestHeaders.set('X-User-Id', session.userId)");
    });

    it('does not treat an injected user header as server-side authentication', () => {
        const functionStart = auth.indexOf('export async function requireUserId()');
        const functionBody = auth.slice(functionStart, auth.indexOf('export async function requireSessionContext()', functionStart));
        expect(functionBody).toContain('await requireSessionContext()');
        expect(functionBody).not.toContain('headers()');
        expect(functionBody).not.toContain("get('X-User-Id')");
    });

    it('accepts a login session only for an explicitly active profile', () => {
        expect(login).toContain("profile.status !== 'active'");
        expect(login).not.toContain("profile.status === 'inactive'");
        expect(login).not.toContain('user_metadata?.organization_id');
    });

    it('uses strict profile status for all protected sessions and permission checks', () => {
        expect(auth).toContain("profile.status !== 'active'");
        expect(auth).not.toContain("profile.status === 'inactive'");
    });

    it('prepares a narrow RLS helper migration with strict active status', () => {
        expect(migration).toContain("AND p.status = 'active'");
        expect(migration).toContain('p.id = auth.uid()');
        expect(migration).toContain('FROM public.profiles AS p');
        expect(migration).toContain('SECURITY DEFINER');
        expect(migration).toContain('REVOKE ALL ON FUNCTION public.current_user_organization_id() FROM PUBLIC;');
        expect(migration).toContain('REVOKE ALL ON FUNCTION public.current_user_organization_id() FROM anon;');
        expect(migration).not.toContain("COALESCE(p.status, 'active')");
        expect(migration).not.toContain('user_metadata');
        expect(migration).not.toContain('DROP TABLE');
    });
});
