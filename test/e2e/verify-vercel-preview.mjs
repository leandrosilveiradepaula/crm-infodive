/**
 * Audits an actual Vercel deployment before any authenticated CRM smoke check.
 * Values must come from a protected CI environment, independent of the web app.
 * Never log or return the API token.
 */
export async function verifyVercelPreview({
    baseUrl, deploymentId, expectedSha, expectedBranch, projectId, teamId, token,
    fetchFn = globalThis.fetch,
}) {
    if (!deploymentId || !/^dpl_[A-Za-z0-9]+$/.test(deploymentId)) {
        throw new Error('A valid Vercel deployment ID is required.');
    }
    if (!expectedSha || !/^[a-f0-9]{40}$/.test(expectedSha)) {
        throw new Error('The reviewed 40-character GitHub SHA is required.');
    }
    if (![expectedBranch, projectId, teamId, token].every((value) => typeof value === 'string' && value.length > 0)) {
        throw new Error('Expected branch, project/team IDs and a protected Vercel read token are required.');
    }
    const target = new URL(baseUrl);
    if (target.protocol !== 'https:' || target.username || target.password) {
        throw new Error('An HTTPS Preview origin without embedded credentials is required.');
    }
    const url = new URL('https://api.vercel.com/v13/deployments/' + encodeURIComponent(deploymentId));
    url.searchParams.set('teamId', teamId);
    const response = await fetchFn(url, {
        headers: { Authorization: 'Bearer ' + token },
        signal: AbortSignal.timeout(15_000),
    });
    if (!response.ok) throw new Error('Cannot independently verify Vercel deployment (HTTP ' + response.status + ').');
    const payload = await response.json();
    const deployment = payload.deployment || payload;
    if ((deployment.id || deployment.uid) !== deploymentId) {
        throw new Error('Vercel deployment ID does not match the approved record.');
    }
    if ((deployment.projectId || deployment.project?.id) !== projectId) {
        throw new Error('Vercel deployment belongs to a different project.');
    }
    if ((deployment.readyState || deployment.state) !== 'READY') {
        throw new Error('Vercel deployment is not READY.');
    }
    if (deployment.target === 'production') {
        throw new Error('Production deployments are prohibited for CRM B4 E2E.');
    }
    if (deployment.meta?.githubCommitSha !== expectedSha) {
        throw new Error('Deployed Git SHA does not match the reviewed pull-request SHA.');
    }
    if (deployment.meta?.githubCommitRef !== expectedBranch) {
        throw new Error('Deployment Git branch does not match the reviewed pull-request branch.');
    }
    const hostNames = [deployment.url, ...(Array.isArray(deployment.alias) ? deployment.alias : [])]
        .filter((value) => typeof value === 'string' && value.length)
        .map((host) => new URL('https://' + host.replace(/^https?:\/\//, '')).hostname);
    if (!hostNames.includes(target.hostname) || (target.pathname !== '/' && target.pathname !== '')) {
        throw new Error('The authorized Preview URL does not belong to the verified Vercel deployment.');
    }
    return { deploymentId, reviewedSha: expectedSha, branch: expectedBranch, verified: true };
}
