import { existsSync, readFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'test/e2e/run-authenticated-smoke.mjs'), 'utf8');

describe('authenticated E2E smoke contract', () => {
    it('requires a legitimate isolated target and never manufactures an authenticated session', () => {
        expect(source).toContain("CRM_E2E_TEST_TARGET must be exactly \"isolated\"");
        expect(source).toContain('CRM_E2E_PREVIEW_SHA');
        expect(source).toContain('CRM_E2E_DEPLOYMENT_ID');
        expect(source).toContain("await page.locator('input[name=\"email\"]').fill(account.email)");
        expect(source).not.toContain('storageState');
        expect(source).not.toContain('addCookies');
    });

    it('makes missing credentials an explicit skip and treats incomplete axe output as unresolved', () => {
        expect(source).toContain('E2E_AUTHENTICATED_SMOKE=SKIPPED');
        expect(source).toContain('axe returned ${result.incomplete.length} incomplete result(s), which require review.');
        expect(source).toContain('Mobile menu did not close after navigation.');
    });
    it('only enumerates existing concrete dashboard routes, never an absent module', () => {
        const section = source.match(/const defaultRoutes = \[([\s\S]*?)\];/)?.[1];
        expect(section).toBeDefined();
        const routes = [...(section || '').matchAll(/'([^']+)'/g)].map((match) => match[1]);
        expect(routes.length).toBe(22);
        expect(routes).not.toContain('/purchases');
        for (const route of routes) {
            expect(route.startsWith('/')).toBe(true);
            expect(existsSync(resolve(process.cwd(), `src/app/(dashboard)${route}/page.tsx`))).toBe(true);
        }
    });

    it('treats a required run without target or test credentials as BLOCKED rather than PASS', () => {
        expect(source).toContain("CRM_E2E_ENFORCE_PASS === 'true'");
        expect(source).toContain('E2E_AUTHENTICATED_SMOKE=BLOCKED');
        expect(source).toContain('process.exit(2)');
        expect(source).toContain('CRM_E2E_EXPECTED_SHA');
    });

    it('does not treat moderate/minor WCAG or an unapproved route as a successful E2E', () => {
        expect(source).toContain('if (result.violations.length)');
        expect(source).toContain('if (url.origin !== baseUrl.origin)');
        expect(source).toContain("route !== '/login' && !defaultRoutes.includes(route)");
        expect(source).toContain('if (!response?.ok())');
        expect(source).toContain("mobileMenuNavigation: 'not-applicable-for-profile'");
    });

    it('exits as SKIPPED locally but blocks required QA when no target is configured', () => {
        const script = resolve(process.cwd(), 'test/e2e/run-authenticated-smoke.mjs');
        const local = spawnSync(process.execPath, [script], {
            env: {},
            encoding: 'utf8',
        });
        expect(local.status).toBe(0);
        expect(local.stdout).toContain('E2E_AUTHENTICATED_SMOKE=SKIPPED');
        const required = spawnSync(process.execPath, [script], {
            env: { CRM_E2E_ENFORCE_PASS: 'true' },
            encoding: 'utf8',
        });
        expect(required.status).toBe(2);
        expect(required.stderr).toContain('E2E_AUTHENTICATED_SMOKE=BLOCKED');
    });

});
