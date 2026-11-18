import { describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { QA_ACCOUNTS, requireQaConfiguration, provisionQaAuth } from './e2e/provision-qa-auth.mjs';

const project = 'https://lwpjiufsetnpjuoyline.supabase.co';
const primary = '11111111-1111-4111-8111-111111111111';
const isolated = '22222222-2222-4222-8222-222222222222';

function fixtureEnvironment(dir) {
    const envFile = join(dir, 'GITHUB_ENV');
    writeFileSync(envFile, '');
    return {
        CRM_B4_SUPABASE_URL: project,
        CRM_B4_BACKEND_ISOLATED: 'true',
        CRM_B4_SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_synthetic_test_not_a_real_key',
        RUNNER_TEMP: dir,
        GITHUB_ENV: envFile,
    };
}

function fakeProtectedClient() {
    const users = [];
    const profiles = [];
    const fixtureUpdates = [];
    let rotations = 0;
    let creations = 0;
    const client = {
        auth: {
            admin: {
                async listUsers() { return { data: { users: [...users] }, error: null }; },
                async createUser({ email, password, email_confirm, app_metadata }) {
                    expect(password.length).toBeGreaterThan(30);
                    expect(email_confirm).toBe(true);
                    expect(app_metadata).toEqual({ crm_b4_qa_fixture: true });
                    const n = users.length + 1;
                    const user = {
                        id: '33333333-3333-4333-8333-' + String(n).padStart(12, '0'),
                        email, app_metadata, email_confirmed_at: '2026-11-18T01:00:00Z',
                    };
                    users.push(user);
                    creations += 1;
                    return { data: { user }, error: null };
                },
                async updateUserById(id, { password }) {
                    expect(password.length).toBeGreaterThan(30);
                    rotations += 1;
                    return { data: { user: users.find((u) => u.id === id) }, error: null };
                },
            },
        },
        from(table) {
            if (table === 'app_settings') return {
                select() {
                    return {
                        async eq() {
                            return {
                                data: [
                                    { key: 'organization', organization_id: primary, value: { name: 'Empresa QA Fictícia' } },
                                    { key: 'organization', organization_id: isolated, value: { name: 'Empresa Controle QA' } },
                                ],
                                error: null,
                            };
                        },
                    };
                },
            };
            if (table === 'profiles') return {
                select() {
                    return { async in(_, ids) { return { data: profiles.filter((p) => ids.includes(p.id)), error: null }; } };
                },
                async insert(row) { profiles.push(row); return { data: null, error: null }; },
            };
            if (table === 'deals' || table === 'scenarios') return {
                update(payload) {
                    return {
                        eq(first, org) {
                            return {
                                eq(second, name) {
                                    return {
                                        async select() {
                                            fixtureUpdates.push({ table, payload, org, name });
                                            return { data: [{ id: 'fixture' }], error: null };
                                        },
                                    };
                                },
                            };
                        },
                    };
                },
            };
            throw Error('Unexpected table requested from fake QA project: ' + table);
        },
    };
    return { client, users, profiles, fixtureUpdates, counts: () => ({ creations, rotations }) };
}

describe('protected QA-only Supabase Auth provisioner (offline)', () => {
    it('rejects wrong projects, missing protected credentials and absent isolation before network calls', () => {
        const cfg = {
            CRM_B4_BACKEND_ISOLATED: 'true',
            CRM_B4_SUPABASE_URL: project,
            CRM_B4_SUPABASE_SERVICE_ROLE_KEY: 'sb_secret_fake',
            RUNNER_TEMP: '/tmp',
            GITHUB_ENV: '/tmp/no-file',
        };
        expect(() => requireQaConfiguration({ ...cfg, CRM_B4_BACKEND_ISOLATED: 'false' }))
            .toThrow('ISOLATION_NOT_APPROVED');
        expect(() => requireQaConfiguration({ ...cfg, CRM_B4_SUPABASE_URL: 'https://production.supabase.co' }))
            .toThrow('NOT_THE_APPROVED_QA_PROJECT');
        expect(() => requireQaConfiguration({ ...cfg, CRM_B4_SUPABASE_SERVICE_ROLE_KEY: '' }))
            .toThrow('QA_ADMIN_SECRET_MISSING');
        expect(QA_ACCOUNTS).toHaveLength(4);
        expect(new Set(QA_ACCOUNTS.map((a) => a.email)).size).toBe(4);
        expect(QA_ACCOUNTS.every((a) => a.email.endsWith('@example.invalid'))).toBe(true);
    });

    it('creates four confirmed users, segregates the two tenants and rotates ephemeral credentials on rerun', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'crm-b4-auth-unit-'));
        try {
            const env = fixtureEnvironment(dir);
            const fake = fakeProtectedClient();
            const first = await provisionQaAuth(env, () => fake.client);
            expect(first).toEqual({ createdOrRotated: 4, tenantCount: 2 });
            expect(fake.counts()).toEqual({ creations: 4, rotations: 0 });
            expect(fake.profiles).toHaveLength(4);
            expect(fake.profiles.filter((p) => p.organization_id === primary)).toHaveLength(3);
            expect(fake.profiles.filter((p) => p.organization_id === isolated)).toHaveLength(1);
            expect(fake.fixtureUpdates).toHaveLength(4);

            const lines1 = readFileSync(env.GITHUB_ENV, 'utf8').trim().split('\n');
            const filename1 = lines1[0].replace(/^CRM_E2E_ACCOUNTS_FILE=/, '');
            expect((statSync(filename1).mode & 0o077)).toBe(0);
            const creds1 = JSON.parse(readFileSync(filename1, 'utf8'));
            expect(creds1).toHaveLength(4);
            expect(creds1.every((x) => x.password.length > 30 && x.routes.length > 0)).toBe(true);

            await provisionQaAuth(env, () => fake.client);
            expect(fake.counts()).toEqual({ creations: 4, rotations: 4 });
            expect(fake.profiles).toHaveLength(4);
            const lines2 = readFileSync(env.GITHUB_ENV, 'utf8').trim().split('\n');
            const filename2 = lines2[1].replace(/^CRM_E2E_ACCOUNTS_FILE=/, '');
            const creds2 = JSON.parse(readFileSync(filename2, 'utf8'));
            expect(creds2.map((x) => x.password)).not.toEqual(creds1.map((x) => x.password));
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });

    it('refuses any pre-existing Auth user that is not a QA fixture', async () => {
        const dir = mkdtempSync(join(tmpdir(), 'crm-b4-auth-negative-'));
        try {
            const env = fixtureEnvironment(dir);
            const fake = fakeProtectedClient();
            fake.users.push({
                id: '33333333-3333-4333-8333-000000000001',
                email: 'real-user@company.example',
                app_metadata: {},
                email_confirmed_at: '2026-11-18T01:00:00Z',
            });
            await expect(provisionQaAuth(env, () => fake.client))
                .rejects.toThrow('QA_AUTH_CONTAINS_UNEXPECTED_USERS');
            expect(fake.counts().creations).toBe(0);
        } finally {
            rmSync(dir, { recursive: true, force: true });
        }
    });
});
