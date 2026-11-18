#!/usr/bin/env node
/** Real local Supabase Auth accounts + existing QA SQL fixtures.
 * Never use this against a hosted Supabase project.
 */
import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { appendFile, mkdtemp, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { QA_ACCOUNTS } from '../provision-qa-auth.mjs';

const env = process.env;
if (env.NEXT_PUBLIC_SUPABASE_URL !== 'http://127.0.0.1:54321' ||
    env.CRM_E2E_BASE_URL !== 'http://127.0.0.1:3000' ||
    !env.SUPABASE_SERVICE_ROLE_KEY || !env.GITHUB_ENV || !env.RUNNER_TEMP ||
    env.CRM_E2E_BACKEND_ISOLATED !== 'true') {
    throw new Error('LOCAL_QA_UNSAFE_TARGET');
}
const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
});
function assert(result, code) {
    if (result.error) throw new Error(code);
    return result.data;
}
const fixtures = assert(await admin.from('app_settings')
    .select('organization_id,key,value').eq('key', 'organization'), 'LOCAL_QA_TENANT_QUERY_FAILED');
if (fixtures.length !== 2 ||
    new Set(fixtures.map(x => x.organization_id)).size !== 2) {
    throw new Error('LOCAL_QA_FIXTURE_TENANT_COUNT');
}
const tenant = {};
for (const row of fixtures) {
    if (row.value?.name === 'Empresa QA Fictícia') tenant.primary = row.organization_id;
    else if (row.value?.name === 'Empresa Controle QA') tenant.isolated = row.organization_id;
    else throw new Error('LOCAL_QA_UNKNOWN_TENANT');
}
if (!tenant.primary || !tenant.isolated) throw new Error('LOCAL_QA_TENANT_NAMING');
const old = assert(await admin.auth.admin.listUsers({ page: 1, perPage: 1000 }), 'LOCAL_QA_AUTH_LIST_FAILED');
if (old.users.length !== 0) throw new Error('LOCAL_QA_AUTH_MUST_BE_PRISTINE');

const users = new Map();
const credentials = [];
for (const account of QA_ACCOUNTS) {
    const password = randomBytes(32).toString('base64url') + 'Q9!';
    const created = assert(await admin.auth.admin.createUser({
        email: account.email, password, email_confirm: true,
        app_metadata: { crm_b4_qa_fixture: true },
    }), 'LOCAL_QA_AUTH_CREATE_FAILED');
    if (!created.user?.id) throw new Error('LOCAL_QA_NO_USER_ID');
    users.set(account.email, created.user.id);
    assert(await admin.from('profiles').insert({
        id: created.user.id,
        organization_id: tenant[account.tenant],
        email: account.email,
        full_name: account.name,
        role: account.role,
        roles: account.roles,
        status: 'active',
        quarterly_goals: {},
        commission_rules: {},
    }), 'LOCAL_QA_PROFILE_CREATE_FAILED');
    credentials.push({ email: account.email, password, routes: account.routes });
}
for (const [table, key, value, owner, tenantKey] of [
    ['deals','title','Oportunidade Fictícia Servidores','qa-admin@example.invalid','primary'],
    ['deals','title','Oportunidade Fictícia Licenças','qa-sales@example.invalid','primary'],
    ['deals','title','Oportunidade Controle Isolamento','qa-isolation@example.invalid','isolated'],
    ['scenarios','name','Cenário Fictício','qa-admin@example.invalid','primary'],
]) {
    const field = table === 'deals' ? 'owner_id' : 'user_id';
    const result = await admin.from(table).update({ [field]: users.get(owner) })
        .eq(key, value).eq('organization_id', tenant[tenantKey]).select('id');
    if (result.error) {
        // Print only an allowlisted table name and SQL/PostgREST code, never
        // record contents, credentials or raw error messages.
        const allowed = new Set(['deals', 'scenarios']);
        const safeTable = allowed.has(table) ? table : 'unexpected';
        const code = /^[A-Z0-9]{3,8}$/.test(result.error.code || '') ? result.error.code : 'UNKNOWN';
        throw new Error('LOCAL_QA_ASSIGN_OWNER_FAILED:' + safeTable + ':' + code);
    }
    if (result.data?.length !== 1) throw new Error('LOCAL_QA_OWNER_FIXTURE_MISSING:' + table);
}
const dir = await mkdtemp(join(env.RUNNER_TEMP, 'crm-b4-local-accounts-'));
const path = join(dir, 'accounts.json');
await writeFile(path, JSON.stringify(credentials), { mode: 0o600, flag: 'wx' });
await appendFile(env.GITHUB_ENV, 'CRM_E2E_ACCOUNTS_FILE=' + path + '\n');
process.stdout.write('CRM_B4_LOCAL_AUTH=READY; accounts=' + users.size + '; tenants=2; passwords=redacted\n');
