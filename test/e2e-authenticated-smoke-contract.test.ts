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

    it('ships a protected PR-specific E2E workflow that fails while QA is unconfigured', () => {
        const workflow = readFileSync(resolve(process.cwd(), '.github/workflows/crm-b4-authenticated.yml'), 'utf8');
        expect(workflow).toContain("github.head_ref == 'ux-ui/crm214-b4-integrated-qa'");
        expect(workflow).toContain('environment: crm-ui-qa');
        expect(workflow).toContain('CRM_B4_QA_ENABLED');
        expect(workflow).toContain('exit 1');
        expect(workflow).toContain("CRM_E2E_ENFORCE_PASS: 'true'");
        expect(workflow).toContain('CRM_E2E_ACCOUNTS_JSON:');
        expect(workflow).toContain('npm run test:e2e');
        expect(workflow).toContain('crm-b4-e2e-');
        expect(workflow).toContain("CRM_E2E_CAPTURE_SANITIZED: 'false'");
        expect(workflow).toContain('results.json');
        expect(workflow).not.toContain('vercel deploy');
    });

    it('requires independent Vercel deployment verification before contacting a remote target', () => {
        expect(source).toContain('await verifyVercelPreview({');
        expect(source).toContain('Local Next.js can still point at a live backend.');
        expect(source).toContain("CRM_E2E_BACKEND_ISOLATED !== 'true'");
        expect(source).not.toContain("C:/Program Files/Google/Chrome/Application/chrome.exe");
        expect(source).toContain('if (process.env.CHROME_PATH) launchOptions.executablePath');
    });

    it('rejects production and mismatched remote deployments using mocked Vercel responses', () => {
        const record = {
            id: 'dpl_Test123',
            project: { id: 'prj_test' },
            url: 'qa-crm.example.vercel.app',
            readyState: 'READY',
            target: null,
            meta: { githubCommitSha: 'a'.repeat(40), githubCommitRef: 'ux-ui/crm214-b4-integrated-qa' },
        };
        const runCheck = (override: Record<string, unknown>) => {
            const data = JSON.stringify({ ...record, ...override });
            const program = [
                "import { verifyVercelPreview } from './test/e2e/verify-vercel-preview.mjs';",
                'const record = ' + data + ';',
                "await verifyVercelPreview({ baseUrl: 'https://qa-crm.example.vercel.app', deploymentId: 'dpl_Test123',",
                "  expectedSha: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa', expectedBranch: 'ux-ui/crm214-b4-integrated-qa',",
                "  projectId: 'prj_test', teamId: 'team_test', token: 'not-a-real-token',",
                "  fetchFn: async () => ({ ok: true, json: async () => record }),",
                '});',
            ].join('\n');
            return spawnSync(process.execPath, ['--input-type=module', '-e', program], {
                cwd: process.cwd(), encoding: 'utf8',
            }).status;
        };
        expect(runCheck({})).toBe(0);
        expect(runCheck({ target: 'production' })).not.toBe(0);
        expect(runCheck({ url: 'another-preview.vercel.app' })).not.toBe(0);
        expect(runCheck({ meta: { ...record.meta, githubCommitSha: 'b'.repeat(40) } })).not.toBe(0);
        expect(runCheck({ project: { id: 'prj_production' } })).not.toBe(0);
    });

});
