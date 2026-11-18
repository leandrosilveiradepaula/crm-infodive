import { randomBytes } from 'node:crypto';
import { appendFile } from 'node:fs/promises';
import { verifyVercelPreview } from './verify-vercel-preview.mjs';

const qaProjectId = 'prj_DhLwVxE59HpWzp2YPrWw4sZpKGXc';
const qaTeamId = 'team_Zkee7KNuBllZCEI327veFF3d';
const qaBranch = 'ux-ui/crm214-b4-integrated-qa';
const qaRepository = 'leandrosilveiradepaula/crm-infodive';
const apiOrigin = 'https://api.vercel.com';

export function assertProtectedQa(env, needSha = true) {
    if (env.CRM_B4_BACKEND_ISOLATED !== 'true') throw Error('QA_BACKEND_ISOLATION_NOT_APPROVED');
    if (env.CRM_B4_VERCEL_PROJECT_ID !== qaProjectId || env.CRM_B4_VERCEL_TEAM_ID !== qaTeamId) {
        throw Error('QA_VERCEL_PROJECT_OR_TEAM_MISMATCH');
    }
    if (!env.CRM_B4_VERCEL_TOKEN || env.CRM_B4_VERCEL_TOKEN.length < 10) throw Error('QA_VERCEL_TOKEN_MISSING');
    if (env.GITHUB_EVENT_NAME !== 'pull_request' || env.GITHUB_REPOSITORY !== qaRepository ||
        env.CRM_B4_EXPECTED_BRANCH !== qaBranch || env.CRM_B4_PR_NUMBER !== '218') {
        throw Error('QA_GITHUB_EVENT_NOT_APPROVED');
    }
    if (needSha && (!/^[a-f0-9]{40}$/.test(env.CRM_B4_EXPECTED_SHA || '') || !env.GITHUB_ENV)) {
        throw Error('QA_REVIEWED_SHA_OR_RUNNER_MISSING');
    }
}

async function apiFetch(fetchFn, path, options, action) {
    const response = await fetchFn(apiOrigin + path, {
        ...options,
        signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw Error(action + '_HTTP_' + response.status);
    return response.json();
}

function apiHeaders(token) {
    return { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' };
}

export function chooseApprovedDeployment(payload, sha) {
    const items = payload.deployments;
    if (!Array.isArray(items)) throw Error('QA_DEPLOYMENT_INDEX_INVALID');
    const approved = items.filter((d) =>
        d.meta?.githubCommitSha === sha &&
        d.meta?.githubCommitRef === qaBranch &&
        (d.projectId || d.project?.id) === qaProjectId &&
        d.target === 'staging' &&
        (d.readyState || d.state) === 'READY' &&
        /^dpl_[A-Za-z0-9]+$/.test(d.id || d.uid || '') &&
        typeof d.url === 'string' &&
        /^[a-z0-9.-]+\.vercel\.app$/.test(d.url)
    ).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    if (!approved.length) throw Error('QA_STAGING_READY_FOR_REVIEWED_SHA_NOT_FOUND');
    return approved[0];
}

async function changeBypass(fetchFn, env, body) {
    const path = '/v1/projects/' + qaProjectId + '/protection-bypass?teamId=' + encodeURIComponent(qaTeamId);
    return apiFetch(fetchFn, path, {
        method: 'PATCH',
        headers: apiHeaders(env.CRM_B4_VERCEL_TOKEN),
        body: JSON.stringify(body),
    }, 'QA_VERCEL_BYPASS');
}

export async function prepareQaPreview(env, fetchFn = globalThis.fetch) {
    assertProtectedQa(env);
    const search = new URL('/v6/deployments', apiOrigin);
    search.searchParams.set('projectId', qaProjectId);
    search.searchParams.set('teamId', qaTeamId);
    search.searchParams.set('sha', env.CRM_B4_EXPECTED_SHA);
    search.searchParams.set('limit', '100');
    const response = await apiFetch(fetchFn, search.pathname + search.search, {
        headers: apiHeaders(env.CRM_B4_VERCEL_TOKEN),
    }, 'QA_DEPLOYMENT_INDEX');
    const deployment = chooseApprovedDeployment(response, env.CRM_B4_EXPECTED_SHA);
    const baseUrl = 'https://' + deployment.url;
    await verifyVercelPreview({
        baseUrl,
        deploymentId: deployment.id || deployment.uid,
        expectedSha: env.CRM_B4_EXPECTED_SHA,
        expectedBranch: qaBranch,
        projectId: qaProjectId,
        teamId: qaTeamId,
        token: env.CRM_B4_VERCEL_TOKEN,
        fetchFn,
    });

    // A short-lived *job-scoped* header bypasses only Vercel's outer SSO.
    // The app's real Supabase Auth login is still mandatory for every account.
    // Never print, upload, or send this value to a host other than the QA deployment.
    const bypass = randomBytes(16).toString('hex');
    await changeBypass(fetchFn, env, {
        generate: { secret: bypass, note: 'CRM B4 protected E2E job - revoke on completion' },
    });

    try {
        await appendFile(env.GITHUB_ENV,
            'CRM_E2E_BASE_URL=' + baseUrl + '\n' +
            'CRM_E2E_DEPLOYMENT_ID=' + (deployment.id || deployment.uid) + '\n' +
            'CRM_B4_PROTECTION_BYPASS=' + bypass + '\n',
        );
    } catch {
        await changeBypass(fetchFn, env, { revoke: { secret: bypass, regenerate: false } });
        throw Error('QA_RUNNER_ENVIRONMENT_WRITE_FAILED');
    }
    return { deploymentId: deployment.id || deployment.uid, reviewedSha: env.CRM_B4_EXPECTED_SHA, target: 'staging' };
}

export async function revokeQaPreviewBypass(env, fetchFn = globalThis.fetch) {
    // A failed/cancelled prepare step has nothing to revoke. No token may be logged.
    if (!env.CRM_B4_PROTECTION_BYPASS) return { skipped: true };
    assertProtectedQa(env, false);
    if (!/^[a-f0-9]{32}$/.test(env.CRM_B4_PROTECTION_BYPASS)) throw Error('QA_BYPASS_TOKEN_INVALID');
    await changeBypass(fetchFn, env, {
        revoke: { secret: env.CRM_B4_PROTECTION_BYPASS, regenerate: false },
    });
    return { revoked: true };
}

if (process.argv[1]?.endsWith('/prepare-qa-preview.mjs')) {
    const mode = process.argv[2];
    (async () => {
        if (mode === 'prepare') {
            const result = await prepareQaPreview(process.env);
            process.stdout.write('CRM_B4_PREVIEW_ATTESTED=READY; target=staging; deployment=' +
                result.deploymentId + '; sha=' + result.reviewedSha.slice(0, 7) + '; bypass=redacted\n');
        } else if (mode === 'cleanup') {
            const result = await revokeQaPreviewBypass(process.env);
            process.stdout.write('CRM_B4_BYPASS_CLEANUP=' + (result.revoked ? 'REVOKED' : 'NOT_NEEDED') + '\n');
        } else {
            throw Error('QA_PREVIEW_COMMAND_INVALID');
        }
    })().catch((err) => {
        const code = typeof err?.message === 'string' && /^QA_[A-Z0-9_]+(?:_HTTP_[0-9]+)?$/.test(err.message)
            ? err.message : 'QA_PREVIEW_UNEXPECTED_ERROR';
        process.stderr.write('CRM_B4_PREVIEW=BLOCKED:' + code + '\n');
        process.exitCode = 2;
    });
}
