import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { assertProtectedQa, chooseApprovedDeployment, prepareQaPreview, revokeQaPreviewBypass } from './e2e/prepare-qa-preview.mjs';

const sha = 'a'.repeat(40);
const qaProjectId = 'prj_DhLwVxE59HpWzp2YPrWw4sZpKGXc';
const qaTeamId = 'team_Zkee7KNuBllZCEI327veFF3d';
const qaBranch = 'ux-ui/crm214-b4-integrated-qa';
const deployment = {
    id: 'dpl_QaExample123',
    projectId: qaProjectId,
    url: 'crm-infodive-qa-sha123.vercel.app',
    target: 'staging',
    readyState: 'READY',
    createdAt: 1794970856401,
    meta: { githubCommitSha: sha, githubCommitRef: qaBranch },
};

function makeEnv(dir) {
    const filename = join(dir, 'GITHUB_ENV');
    writeFileSync(filename, '');
    return {
        CRM_B4_BACKEND_ISOLATED: 'true',
        CRM_B4_VERCEL_PROJECT_ID: qaProjectId,
        CRM_B4_VERCEL_TEAM_ID: qaTeamId,
        CRM_B4_VERCEL_TOKEN: 'synthetic-unit-test-only-token',
        CRM_B4_EXPECTED_SHA: sha,
        CRM_B4_EXPECTED_BRANCH: qaBranch,
        CRM_B4_PR_NUMBER: '218',
        GITHUB_EVENT_NAME: 'pull_request',
        GITHUB_REPOSITORY: 'leandrosilveiradepaula/crm-infodive',
        GITHUB_ENV: filename,
    };
}

function mockVercel(customIndex = [deployment]) {
    const calls = [];
    const fetchFn = async (input, options = {}) => {
        const url = new URL(input.toString());
        const method = options.method || 'GET';
        calls.push({ url: url.toString(), method });
        if (url.origin !== 'https://api.vercel.com') {
            throw Error('Non-Vercel API call in QA test');
        }
        if (url.pathname === '/v6/deployments') {
            expect(url.searchParams.get('projectId')).toBe(qaProjectId);
            expect(url.searchParams.get('teamId')).toBe(qaTeamId);
            expect(url.searchParams.get('sha')).toBe(sha);
            return { ok: true, json: async () => ({ deployments: customIndex }) };
        }
        if (url.pathname.startsWith('/v13/deployments/')) {
            return { ok: true, json: async () => ({ ...deployment }) };
        }
        if (url.pathname === '/v1/projects/' + qaProjectId + '/protection-bypass') {
            const body = JSON.parse(options.body);
            if (body.generate) {
                expect(body.generate.secret).toMatch(/^[a-f0-9]{32}$/);
                return { ok: true, json: async () => ({}) };
            }
            if (body.revoke) {
                expect(body.revoke.regenerate).toBe(false);
                return { ok: true, json: async () => ({}) };
            }
            throw Error('Unexpected project protection mutation');
        }
        throw Error('Unexpected Vercel API endpoint in QA test: ' + url.pathname);
    };
    return { fetchFn, calls };
}

describe('QA staging deployment and temporary Vercel SSO bypass (offline)', () => {
    it('rejects anything except approved repo/PR/branch/project/team, before network or auth', () => {
        const dir = mkdtempSync(join(tmpdir(), 'crm214-qa-negative-'));
        try {
            const env = makeEnv(dir);
            expect(() => assertProtectedQa({ ...env, CRM_B4_VERCEL_PROJECT_ID: 'prj_original' }))
                .toThrow('QA_VERCEL_PROJECT_OR_TEAM_MISMATCH');
            expect(() => assertProtectedQa({ ...env, CRM_B4_VERCEL_TEAM_ID: 'team_original' }))
                .toThrow('QA_VERCEL_PROJECT_OR_TEAM_MISMATCH');
            expect(() => assertProtectedQa({ ...env, CRM_B4_BACKEND_ISOLATED: 'false' }))
                .toThrow('QA_BACKEND_ISOLATION_NOT_APPROVED');
            expect(() => assertProtectedQa({ ...env, GITHUB_REPOSITORY: 'somewhere/else' }))
                .toThrow('QA_GITHUB_EVENT_NOT_APPROVED');
            expect(() => assertProtectedQa({ ...env, CRM_B4_PR_NUMBER: '213' }))
                .toThrow('QA_GITHUB_EVENT_NOT_APPROVED');
            expect(() => assertProtectedQa({ ...env, CRM_B4_EXPECTED_SHA: 'not-a-sha' }))
                .toThrow('QA_REVIEWED_SHA_OR_RUNNER_MISSING');
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it('refuses a production deployment or mismatched branch/sha instead of making a bypass', () => {
        expect(chooseApprovedDeployment({ deployments: [deployment] }, sha).id).toBe(deployment.id);
        expect(chooseApprovedDeployment({ deployments: [{ ...deployment, projectId: undefined }] }, sha).id)
            .toBe(deployment.id);
        expect(() => chooseApprovedDeployment({ deployments: [{ ...deployment, projectId: 'prj_wrong' }] }, sha))
            .toThrow('QA_STAGING_READY_FOR_REVIEWED_SHA_NOT_FOUND');
        expect(() => chooseApprovedDeployment({ deployments: [{ ...deployment, target: 'production' }] }, sha))
            .toThrow('QA_STAGING_READY_FOR_REVIEWED_SHA_NOT_FOUND');
        expect(() => chooseApprovedDeployment({
            deployments: [{ ...deployment, meta: { ...deployment.meta, githubCommitSha: 'b'.repeat(40) } }],
        }, sha)).toThrow('QA_STAGING_READY_FOR_REVIEWED_SHA_NOT_FOUND');
        expect(() => chooseApprovedDeployment({ deployments: [{ ...deployment, readyState: 'BUILDING' }] }, sha))
            .toThrow('QA_STAGING_READY_FOR_REVIEWED_SHA_NOT_FOUND');
    });

    it('attests exact READY staging, creates job-private bypass and revokes it', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'crm214-qa-preview-'));
        try {
            const env = makeEnv(dir);
            const mocked = mockVercel();
            const out = await prepareQaPreview(env, mocked.fetchFn);
            expect(out).toEqual({ deploymentId: deployment.id, reviewedSha: sha, target: 'staging' });
            const lines = readFileSync(env.GITHUB_ENV, 'utf8');
            expect(lines).toContain('CRM_E2E_BASE_URL=https://' + deployment.url);
            expect(lines).toContain('CRM_E2E_DEPLOYMENT_ID=' + deployment.id);
            const secret = lines.match(/CRM_B4_PROTECTION_BYPASS=([a-f0-9]{32})\n/)?.[1];
            expect(secret).toBeDefined();
            const revoked = await revokeQaPreviewBypass({ ...env, CRM_B4_PROTECTION_BYPASS: secret }, mocked.fetchFn);
            expect(revoked).toEqual({ revoked: true });
            expect(mocked.calls.map((x) => x.method)).toEqual(['GET', 'GET', 'PATCH', 'PATCH']);
            expect(mocked.calls.some((x) => x.url.includes(secret))).toBe(false);
            expect(await revokeQaPreviewBypass(env, mocked.fetchFn)).toEqual({ skipped: true });
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it('never generates bypass if no QA deployment matches exact SHA', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'crm214-qa-no-sha-'));
        try {
            const env = makeEnv(dir);
            const mock = mockVercel([{ ...deployment, meta: { ...deployment.meta, githubCommitSha: 'b'.repeat(40) } }]);
            await expect(prepareQaPreview(env, mock.fetchFn))
                .rejects.toThrow('QA_STAGING_READY_FOR_REVIEWED_SHA_NOT_FOUND');
            expect(mock.calls).toHaveLength(1);
            expect(readFileSync(env.GITHUB_ENV, 'utf8')).toBe('');
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
});
