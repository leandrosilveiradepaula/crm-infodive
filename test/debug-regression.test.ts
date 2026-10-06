import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { expect, test } from 'vitest';

const debugPageSource = readFileSync(
    resolve(process.cwd(), 'src/app/debug/page.tsx'),
    'utf8',
);

test('/debug permits authenticated diagnostics only after resolving a session', () => {
    expect(debugPageSource).toMatch(/const session = await requireSessionContext\(\)\.catch\(\(\) => null\);/);
    assert.match(debugPageSource, /session\s*\?\s*await createAdminClient\(\)/);
    assert.match(debugPageSource, /export const dynamic = 'force-dynamic';/);
});

test('/debug diagnostics are restricted to the authenticated organization', () => {
    assert.match(
        debugPageSource,
        /\.eq\('organization_id', session\.organizationId\)/);
    expect(debugPageSource).toMatch(/Organization account count: \{accountCount \?\? 0\}/);
});

test('/debug preserves a redacted diagnostic for unauthenticated access', () => {
    expect(debugPageSource).toMatch(/\{ count: null, error: \{ message: 'No session available for database diagnostics' \} as any \}/);
    expect(debugPageSource).toMatch(/Database diagnostic unavailable\./);
});

test('/debug does not render representative raw business records or database errors', () => {
    const forbiddenOutputFields = [
        'account.name',
        'account.email',
        'account.cnpj',
        'account.description',
        'dbError.message',
        'JSON.stringify(account',
        'JSON.stringify(dbError',
    ];

    for (const field of forbiddenOutputFields) {
        expect(debugPageSource).not.toMatch(new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }

    expect(debugPageSource).not.toMatch(/\.select\('\*'\)(?!, \{ count: 'exact', head: true \}\))/);
});
