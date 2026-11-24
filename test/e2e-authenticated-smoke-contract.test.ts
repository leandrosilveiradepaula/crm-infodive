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
        expect(source).toContain('CRM_B4_A11Y_DIAGNOSTIC=');
        expect(source).not.toContain('diagnosticMode');
        expect(source).toContain('WCAG remains unresolved in ');
        expect(source).toContain('Full matrix was audited but not certified');
        expect(source).toContain('results.failures.push(finding)');
        expect(source).toContain('for (const [profileIndex, account] of accounts.entries())');
        expect(source).toContain("for (const theme of ['light', 'dark'])");
        expect(source).toContain('MAX_A11Y_DIAGNOSTICS');
        expect(source).toContain('a11yFailureCount += 1;');
        expect(source).toContain('a11yFailedRoutes.add(route);');
        expect(source).toContain('Never retain HTML, text, attributes, selectors, URLs or screenshots.');
        expect(source).toContain('result.incomplete.slice(0, 6)');
        expect(source).toContain('samples: (nodes || []).slice(0, 16).map((node) => ({');
        expect(source).toContain('safeCheck');
        expect(source).toContain('backgroundImage: style.backgroundImage');
        expect(source).toContain('backdropFilter: style.backdropFilter');
        expect(source).toContain("element.closest('[data-qa-region]')");
        expect(source).toContain("region = regions.has(candidateRegion)");
        expect(source).toContain("imageKind: /gradient\\(/");
        expect(source).toContain('Mobile menu did not close after navigation.');
        expect(source).toContain("execFileSync('git', ['rev-parse', 'HEAD']");
        expect(source).toContain('candidateSha, target:');
        expect(source).toContain("state: 'deal-detail'");
        expect(source).toContain('pipeline-deal-detail-${viewport.name}-${theme}.png');
        expect(source).toContain("if (capture && local && profileIndex === 0 && route === '/pipeline')");
        expect(source).toContain('Opportunity detail extends outside the device viewport.');
        expect(source).toContain('assertOpportunitySections(page, dialog, capture, artifactDir,');
        expect(source).toContain('CRM_B4_SECTION_NAV_DIAGNOSTIC=');
        expect(source).toContain("a11yFailedRoutes.add('/pipeline?detail:sections')");
        expect(source).toContain("for (const label of ['Parceiros', 'Clientes', 'Documentos', 'Comunicações', 'Histórico'])");
        expect(source).toContain("getByRole('tab', { name: 'Resumo', exact: true })");
        expect(source).toContain("'-history.png'");

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
        expect(source).toContain('axeReport.incompleteCount + axeReport.violationsCount');
        expect(source).toContain('fail(');
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
        expect(workflow).toContain('github.event.number == 218');
        expect(workflow).toContain('cancel-in-progress: false');
        expect(workflow).toContain('node test/e2e/prepare-qa-preview.mjs prepare');
        expect(workflow).toContain('node test/e2e/prepare-qa-preview.mjs cleanup');
        expect(workflow).toContain('if: always()');
        expect(workflow).not.toContain('CRM_B4_QA_ENABLED');
        expect(workflow).toContain("CRM_E2E_ENFORCE_PASS: 'true'");
        expect(workflow).not.toContain('CRM_E2E_ACCOUNTS_FILE: ${{ env.');
        expect(workflow).toContain('node test/e2e/provision-qa-auth.mjs');
        expect(workflow).toContain('CRM_B4_SUPABASE_SERVICE_ROLE_KEY:');
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
        expect(source).toContain("await context.route('**/*'");
        expect(source).toContain('requestedUrl.origin !== baseUrl.origin');
        expect(source).toContain("'x-vercel-protection-bypass': bypass");
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

    it('provisions synthetic QA users through Supabase Auth Admin only in a protected environment', () => {
        const bootstrap = readFileSync(resolve(process.cwd(), 'test/e2e/provision-qa-auth.mjs'), 'utf8');
        expect(bootstrap).toContain("QA_URL = 'https://lwpjiufsetnpjuoyline.supabase.co'");
        expect(bootstrap).toContain('CRM_B4_BACKEND_ISOLATED');
        expect(bootstrap).toContain('auth.admin.createUser');
        expect(bootstrap).toContain('auth.admin.updateUserById');
        expect(bootstrap).toContain('email_confirm: true');
        expect(bootstrap).toContain("app_metadata: { crm_b4_qa_fixture: true }");
        expect(bootstrap).toContain("mode: 0o600, flag: 'wx'");
        expect(bootstrap).toContain('CRM_E2E_ACCOUNTS_FILE=');
        expect(bootstrap).toContain("basename(process.argv[1] || '') === 'provision-qa-auth.mjs'");
        expect(bootstrap).not.toContain("from('auth.users')");
        const result = spawnSync(process.execPath, ['test/e2e/provision-qa-auth.mjs'], {
            cwd: process.cwd(), env: {}, encoding: 'utf8',
        });
        expect(result.status).toBe(2);
        expect(result.stderr).toContain('CRM_QA_AUTH_PROVISION=BLOCKED: ISOLATION_NOT_APPROVED');
    });

    it('reads only a 0600 credentials file issued by the protected provisioner', () => {
        expect(source).toContain('CRM_E2E_ACCOUNTS_FILE');
        expect(source).toContain("stat.mode & 0o077");
        expect(source).toContain("readFileSync(credentialsFile, 'utf8')");
        expect(source).toContain('Provide exactly one E2E account source');
    });

    it('blocks protected GitHub environment approval until real local Next.js E2E passed for the same SHA', () => {
        const wf = readFileSync(resolve(process.cwd(), '.github/workflows/crm-b4-authenticated.yml'), 'utf8');
        expect(wf).toContain('local-parity-preflight:');
        expect(wf).toContain('needs: local-parity-preflight');
        expect(wf).toContain('CRM B4 real local authenticated QA');
        expect(wf).toContain('REVIEWED_SHA:');
        expect(wf).toContain('conclusion == "success"');
        expect(wf).toContain('environment: crm-ui-qa');
        const local = readFileSync(resolve(process.cwd(), '.github/workflows/crm-b4-local-authenticated.yml'), 'utf8');
        expect(local).toContain('Start pristine ephemeral Supabase');
        expect(local).toContain('ref: ${{ github.event.pull_request.head.sha }}');
        expect(local).toContain('Compile real Next.js application');
        expect(local).toContain('node test/e2e/run-authenticated-smoke.mjs');
        expect(local).toContain('CRM_E2E_CAPTURE_SANITIZED=true');
        expect(local).toContain('CRM_E2E_ARTIFACT_DIR="$RUNNER_TEMP/crm-b4-local-visual-evidence"');
        expect(local).toContain('Upload sanitized local visual evidence');
        expect(local).toContain('crm-b4-local-visual-evidence-${{ github.event.pull_request.head.sha }}');
        expect(local).toContain('retention-days: 7');
        expect(local).toContain('supabase stop --no-backup');
        expect(local).not.toContain('environment: crm-ui-qa');
        expect(local).not.toContain('supabase link');
        const bootstrap = readFileSync(resolve(process.cwd(), 'test/e2e/local-qa/export-local-status.mjs'), 'utf8');
        expect(bootstrap).toContain("values.API_URL !== 'http://127.0.0.1:54321'");
        expect(bootstrap).toContain('CRM_E2E_BACKEND_ISOLATED:');
        const provision = readFileSync(resolve(process.cwd(), 'test/e2e/local-qa/provision-local-auth.mjs'), 'utf8');
        expect(provision).toContain("QA_ACCOUNTS } from '../provision-qa-auth.mjs'");
        expect(provision).toContain('auth.admin.createUser');
        expect(provision).toContain('mode: 0o600');
    });

    it('keeps the local synthetic schema compatible with QA Auth provisioner ownership fields', () => {
        const sql = readFileSync(resolve(process.cwd(), 'docs/ui/QA_SUPABASE_COMMERCIAL_SCHEMA.sql'), 'utf8');
        const scenario = sql.split('CREATE TABLE public.scenarios (')[1]?.split(');')[0] || '';
        expect(scenario).toContain('user_id uuid REFERENCES auth.users(id)');
        const provisioner = readFileSync(resolve(process.cwd(), 'test/e2e/local-qa/provision-local-auth.mjs'), 'utf8');
        expect(provisioner).toContain("['scenarios','name','Cenário Fictício'");
        expect(provisioner).toContain("LOCAL_QA_ASSIGN_OWNER_FAILED:");
    });


    it('retries only temporary local PostgREST schema-cache unavailability after SQL seed', () => {
        const wf = readFileSync(resolve(process.cwd(), '.github/workflows/crm-b4-local-authenticated.yml'), 'utf8');
        expect(wf).toContain("NOTIFY pgrst, 'reload schema'");
        const auth = readFileSync(resolve(process.cwd(), 'test/e2e/local-qa/provision-local-auth.mjs'), 'utf8');
        expect(auth).toContain("'PGRST205'");
        expect(auth).toContain("'PGRST002'");
        expect(auth).toContain('LOCAL_QA_POSTGREST_SCHEMA_NOT_READY');
        expect(auth).toContain('LOCAL_QA_TENANT_QUERY_FAILED:');
        expect(auth).toContain("env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:54321'");
    });


    it('waits for dark/light CSS transitions before calling axe on real pages', () => {
        expect(source).toContain('expectedDark => document.documentElement.classList.contains');
        expect(source).toContain('document.fonts.ready');
        expect(source).toContain('await page.waitForTimeout(900)');
        expect(source).not.toContain('await page.waitForTimeout(100)');
        expect(source).toContain('const axeReport = await runAxe(page, source)');
        expect(source).toContain("a11yFailureCount += 1");
    });

});
