import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/app/(dashboard)/integrations/actions.ts', 'utf8');

function action(name: string): string {
    const start = source.indexOf('export async function ' + name + '(');
    if (start < 0) throw new Error('Missing integration server action: ' + name);
    const end = source.indexOf('\n}', start);
    if (end < 0) throw new Error('Unterminated integration server action: ' + name);
    return source.slice(start, end);
}

describe('integration actions fail-closed persistence contract', () => {
    it('requires explicit integration management permission on every action', () => {
        for (const name of [
            'getIntegrations', 'toggleIntegrationStatus', 'getApiKeys',
            'createApiKey', 'revokeApiKey', 'deleteApiKey',
            'getWebhooks', 'createWebhook', 'deleteWebhook',
        ]) {
            expect(action(name)).toContain("requirePermission('integrations:manage')");
        }
    });

    it('rejects missing or malformed list results, never silently replacing errors with empty lists', () => {
        for (const name of ['getIntegrations', 'getApiKeys', 'getWebhooks']) {
            expect(action(name)).toContain('!Array.isArray(data)');
            expect(action(name)).toContain('throw new Error(');
            expect(action(name)).not.toContain('if (error) return []');
        }
    });

    it('reports toggle success only when a scoped integration row changed', () => {
        const value = action('toggleIntegrationStatus');
        expect(value).toContain("!['connected', 'disconnected', 'error'].includes(currentStatus)");
        expect(value).toContain(".eq('organization_id', organizationId)");
        expect(value).toContain(".select('id').maybeSingle()");
        expect(value).toContain('if (error || !updated)');
    });

    it('requires a persisted row on creation and handles invalid key names', () => {
        const key = action('createApiKey');
        const webhook = action('createWebhook');
        expect(key).toContain('name.length > 120');
        expect(key).toContain('if (error || !inserted)');
        expect(webhook).toContain('if (error || !inserted)');
        expect(key).toContain(".select('id').maybeSingle()");
        expect(webhook).toContain(".select('id').maybeSingle()");
    });

    it('rejects zero-row API key revocation/deletion and webhook deletion', () => {
        for (const name of ['revokeApiKey', 'deleteApiKey', 'deleteWebhook']) {
            const value = action(name);
            expect(value).toContain(".eq('organization_id', organizationId)");
            expect(value).toContain(".select('id').maybeSingle()");
            expect(value).toMatch(/if \(error \|\| !(deleted|updated)\)/);
        }
    });
});
