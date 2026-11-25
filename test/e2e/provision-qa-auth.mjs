import { createClient } from '@supabase/supabase-js';
import { randomBytes } from 'node:crypto';
import { appendFile, mkdtemp, writeFile } from 'node:fs/promises';
import { basename, join } from 'node:path';

/**
 * CRM #214 B4 — protected, QA-only user provisioning. Never run against
 * the CRM original. Uses Supabase Auth Admin API, not direct auth.users SQL.
 * Passwords rotate per protected CI run and never enter source, stdout or artifacts.
 */
const QA_URL = 'https://lwpjiufsetnpjuoyline.supabase.co';
const primaryName = 'Empresa QA Fictícia';
const isolatedName = 'Empresa Controle QA';

export const QA_ACCOUNTS = Object.freeze([
    {
        email: 'qa-admin@example.invalid',
        name: 'QA Administrador Fictício',
        role: 'admin',
        roles: ['admin'],
        tenant: 'primary',
        routes: [
            '/dashboard', '/pipeline', '/leads', '/contacts', '/customers', '/activities',
            '/contracts', '/proposals', '/products', '/sales', '/sales-orders',
            '/reports', '/goals', '/goals-commissions', '/automations', '/inbox',
            '/service-desk', '/service-desk/knowledge', '/integrations', '/settings',
            '/price-lists', '/design-preview',
        ],
    },
    {
        email: 'qa-manager@example.invalid',
        name: 'QA Gestor Fictício',
        role: 'manager',
        roles: ['manager'],
        tenant: 'primary',
        routes: ['/dashboard', '/pipeline', '/leads', '/contacts', '/customers', '/activities', '/contracts', '/products', '/reports'],
    },
    {
        email: 'qa-sales@example.invalid',
        name: 'QA Comercial Fictício',
        role: 'vendedor',
        roles: ['sales'],
        tenant: 'primary',
        routes: ['/dashboard', '/pipeline', '/leads', '/contacts', '/customers', '/activities', '/products'],
    },
    {
        email: 'qa-isolation@example.invalid',
        name: 'QA Isolamento Fictício',
        role: 'admin',
        roles: ['admin'],
        tenant: 'isolated',
        routes: ['/dashboard', '/pipeline', '/customers', '/products'],
    },
]);

export function requireQaConfiguration(env) {
    if (env.CRM_B4_BACKEND_ISOLATED !== 'true') throw Error('ISOLATION_NOT_APPROVED');
    if (env.CRM_B4_SUPABASE_URL !== QA_URL) throw Error('NOT_THE_APPROVED_QA_PROJECT');
    if (!env.CRM_B4_SUPABASE_SERVICE_ROLE_KEY ||
        !['sb_secret_', 'eyJ'].some((prefix) => env.CRM_B4_SUPABASE_SERVICE_ROLE_KEY.startsWith(prefix))) {
        throw Error('QA_ADMIN_SECRET_MISSING');
    }
    if (!env.RUNNER_TEMP || !env.GITHUB_ENV) throw Error('PROTECTED_CI_REQUIRED');
}

function assertNoError(value, code) {
    if (value.error) throw Error(code);
    return value.data;
}

function getTenantMap(settings) {
    if (!Array.isArray(settings) || settings.length !== 2) throw Error('QA_TENANT_COUNT_MISMATCH');
    const primary = settings.filter((row) => row.key === 'organization' && row.value?.name === primaryName);
    const isolated = settings.filter((row) => row.key === 'organization' && row.value?.name === isolatedName);
    if (primary.length !== 1 || isolated.length !== 1 ||
        primary[0].organization_id === isolated[0].organization_id ||
        ![primary[0].organization_id, isolated[0].organization_id].every((id) =>
            /^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id))) {
        throw Error('QA_TENANT_MANIFEST_MISMATCH');
    }
    return { primary: primary[0].organization_id, isolated: isolated[0].organization_id };
}

async function assignFixture(client, table, nameColumn, name, organizationId, payload) {
    const changed = assertNoError(await client.from(table)
        .update(payload).eq('organization_id', organizationId)
        .eq(nameColumn, name).select('id'), 'QA_FIXTURE_ASSIGNMENT_FAILED');
    if (changed?.length !== 1) throw Error('QA_FIXTURE_COUNT_MISMATCH');
}

export async function provisionQaAuth(env, clientFactory = createClient) {
    requireQaConfiguration(env);
    const client = clientFactory(QA_URL, env.CRM_B4_SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });

    const settings = assertNoError(await client.from('app_settings')
        .select('organization_id,key,value').eq('key', 'organization'), 'QA_TENANT_QUERY_FAILED');
    const tenants = getTenantMap(settings);

    // A dirty or wrong Auth project must not be used as a QA bootstrap target.
    const response = client.auth.admin.listUsers({ page: 1, perPage: 1000 });
    const userList = assertNoError(await response, 'QA_AUTH_LIST_FAILED');
    if (!Array.isArray(userList?.users) || userList.users.length >= 1000 ||
        userList.users.some((user) => !QA_ACCOUNTS.some((a) => a.email === user.email))) {
        throw Error('QA_AUTH_CONTAINS_UNEXPECTED_USERS');
    }
    const existingUsers = new Map(userList.users.map((user) => [user.email, user]));
    // Fail before making changes if any existing user is not an approved CI fixture.
    for (const account of QA_ACCOUNTS) {
        const user = existingUsers.get(account.email);
        if (user && (user.app_metadata?.crm_b4_qa_fixture !== true ||
            !user.email_confirmed_at || !user.id)) {
            throw Error('QA_EXISTING_USER_NOT_OURS');
        }
    }
    const ids = new Map();
    const credentials = [];
    for (const account of QA_ACCOUNTS) {
        // Unique per run. Credentials only live in this protected runner's memory
        // and a private, ephemeral, permission-0600 file.
        const password = randomBytes(32).toString('base64url') + 'Q9!';
        const current = existingUsers.get(account.email);
        let id;
        if (current) {
            const changed = assertNoError(await client.auth.admin.updateUserById(
                current.id, { password, email_confirm: true },
            ), 'QA_AUTH_PASSWORD_ROTATION_FAILED');
            id = changed.user?.id;
        } else {
            const created = assertNoError(await client.auth.admin.createUser({
                email: account.email,
                password,
                email_confirm: true,
                app_metadata: { crm_b4_qa_fixture: true },
            }), 'QA_AUTH_CREATION_FAILED');
            id = created.user?.id;
        }
        if (!id || !/^[\da-f]{8}-(?:[\da-f]{4}-){3}[\da-f]{12}$/i.test(id)) {
            throw Error('QA_AUTH_RETURNED_INVALID_ID');
        }
        ids.set(account.email, id);
        credentials.push({ email: account.email, password, routes: account.routes });
    }

    const profileIds = [...ids.values()];
    const stored = assertNoError(await client.from('profiles')
        .select('id,organization_id,email,role,status').in('id', profileIds), 'QA_PROFILE_LOOKUP_FAILED');
    for (const account of QA_ACCOUNTS) {
        const id = ids.get(account.email);
        const org = tenants[account.tenant];
        const row = stored?.find((p) => p.id === id);
        if (row) {
            if (row.organization_id !== org || row.role !== account.role ||
                row.email !== account.email || row.status !== 'active') {
                throw Error('QA_PROFILE_NOT_MATCHING_APPROVED_FIXTURE');
            }
        } else {
            assertNoError(await client.from('profiles').insert({
                id, organization_id: org, email: account.email, full_name: account.name,
                role: account.role, roles: account.roles, status: 'active',
                commission_rules: {}, quarterly_goals: {},
            }), 'QA_PROFILE_INSERT_FAILED');
        }
    }

    await assignFixture(client, 'deals', 'title', 'Oportunidade Fictícia Servidores',
        tenants.primary, { owner_id: ids.get('qa-admin@example.invalid') });
    await assignFixture(client, 'deals', 'title', 'Oportunidade Fictícia Licenças',
        tenants.primary, { owner_id: ids.get('qa-sales@example.invalid') });
    await assignFixture(client, 'deals', 'title', 'Oportunidade Controle Isolamento',
        tenants.isolated, { owner_id: ids.get('qa-isolation@example.invalid') });
    await assignFixture(client, 'scenarios', 'name', 'Cenário Fictício',
        tenants.primary, { user_id: ids.get('qa-admin@example.invalid') });

    const directory = await mkdtemp(join(env.RUNNER_TEMP, 'crm-b4-qa-auth-'));
    const file = join(directory, 'accounts.json');
    await writeFile(file, JSON.stringify(credentials), { mode: 0o600, flag: 'wx' });
    await appendFile(env.GITHUB_ENV, 'CRM_E2E_ACCOUNTS_FILE=' + file + '\n');
    return { createdOrRotated: credentials.length, tenantCount: 2 };
}

if (basename(process.argv[1] || '') === 'provision-qa-auth.mjs') {
    provisionQaAuth(process.env).then(({ createdOrRotated, tenantCount }) => {
        process.stdout.write('CRM_QA_AUTH_PROVISION=READY; profiles=' + createdOrRotated +
            '; tenants=' + tenantCount + '; passwords=redacted\n');
    }).catch((error) => {
        // Never print raw SDK failures: they may contain credentials or emails.
        const known = /^QA_|^PROTECTED_CI_REQUIRED$|^ISOLATION_NOT_APPROVED$|^NOT_THE_APPROVED_QA_PROJECT$/.test(error?.message || '');
        process.stderr.write('CRM_QA_AUTH_PROVISION=BLOCKED: ' +
            (known ? error.message : 'UNEXPECTED_ERROR') + '\n');
        process.exitCode = 2;
    });
}
