import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';

const debugPageSource = readFileSync(
    resolve(process.cwd(), 'src/app/debug/page.tsx'),
    'utf8',
);

test('/debug permits authenticated diagnostics only after resolving a session', () => {
    assert.match(debugPageSource, /const session = await requireSessionContext\(\)\.catch\(\(\) => null\);/);
    assert.match(debugPageSource, /session\s*\?\s*await createAdminClient\(\)/);
    assert.match(debugPageSource, /export const dynamic = 'force-dynamic';/);
});

test('/debug diagnostics are restricted to the authenticated organization', () => {
    assert.match(
        debugPageSource,
        /\.eq\('organization_id', session\.organizationId\)/,
    );
    assert.match(
        debugPageSource,
        /Organization account count: \{accountCount \?\? 0\}/,
    );
});

test('/debug preserves a redacted diagnostic for unauthenticated access', () => {
    assert.match(
        debugPageSource,
        /\{ count: null, error: \{ message: 'No session available for database diagnostics' \} as any \}/,
    );
    assert.match(
        debugPageSource,
        /Database diagnostic unavailable\./,
    );
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
        assert.doesNotMatch(debugPageSource, new RegExp(field.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
    }

    assert.doesNotMatch(debugPageSource, /\.select\('\*'\)(?!, \{ count: 'exact', head: true \}\)/);
});
