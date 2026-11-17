import { readFileSync } from 'node:fs';
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
    });
});
