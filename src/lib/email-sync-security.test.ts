import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('email sync tenant boundaries', () => {
  it('scopes privileged contact and blacklist lookups to the active organization', () => {
    const source = readFileSync('src/app/api/email/sync/route.ts', 'utf8');

    for (const table of ['account_contacts', 'contact_blacklists']) {
      const start = source.indexOf(`.from('${table}')`);
      expect(start).toBeGreaterThanOrEqual(0);
      const end = source.indexOf(';', start);
      const query = source.slice(start, end);
      expect(query).toContain(".eq('organization_id', orgId)");
      expect(query).toContain(".in('email', uniqueSenders)");
    }
  });
});
