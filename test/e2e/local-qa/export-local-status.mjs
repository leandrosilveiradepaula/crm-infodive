#!/usr/bin/env node
/** Convert local-only Supabase CLI status into masked GitHub step env.
 * Refuse hosted URLs, linked project refs and unexpected CLI output.
 */
import { readFileSync, appendFileSync } from 'node:fs';
import { randomBytes } from 'node:crypto';

if (!process.env.GITHUB_ENV || !process.env.RUNNER_TEMP || process.argv.length !== 3) {
    throw new Error('LOCAL_QA_CI_ONLY');
}
const status = readFileSync(process.argv[2], 'utf8');
const values = Object.fromEntries(status.split(/\r?\n/).filter((x) => x.includes('=')).map((line) => {
    const i = line.indexOf('=');
    return [line.slice(0, i), line.slice(i + 1).replace(/^["']|["']$/g, '')];
}));
if (values.API_URL !== 'http://127.0.0.1:54321' ||
    !/^postgresql?:\/\/postgres:postgres@127\.0\.0\.1:54322\/postgres$/.test(values.DB_URL || '') ||
    !values.ANON_KEY || !values.SERVICE_ROLE_KEY || values.ANON_KEY === values.SERVICE_ROLE_KEY) {
    throw new Error('LOCAL_QA_ISOLATION_PROOF_FAILED');
}
const secret = randomBytes(48).toString('base64url');
for (const value of [values.ANON_KEY, values.SERVICE_ROLE_KEY, secret]) {
    process.stdout.write('::add-mask::' + value + '\n');
}
const variables = {
    NEXT_PUBLIC_SUPABASE_URL: values.API_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: values.ANON_KEY,
    SUPABASE_SERVICE_ROLE_KEY: values.SERVICE_ROLE_KEY,
    SESSION_SECRET: secret,
    CRM_E2E_BASE_URL: 'http://127.0.0.1:3000',
    CRM_E2E_TEST_TARGET: 'isolated',
    CRM_E2E_BACKEND_ISOLATED: 'true',
    CRM_E2E_ENFORCE_PASS: 'true',
};
appendFileSync(process.env.GITHUB_ENV, Object.entries(variables).map(([k, v]) => k + '=' + v).join('\n') + '\n');
process.stdout.write('CRM_B4_LOCAL_STACK=VERIFIED_LOCAL_ONLY; host=127.0.0.1; no_remote_secrets=true\n');
