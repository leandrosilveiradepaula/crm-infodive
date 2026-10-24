import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

function bodyOf(source: string, name: string): string {
    const start = source.indexOf('export async function ' + name + '(');
    if (start < 0) throw new Error('Missing server action ' + name);
    const end = source.indexOf('\n}', start);
    if (end < 0) throw new Error('Missing server action closing brace: ' + name);
    return source.slice(start, end);
}

describe('CRM account and contact server-side RBAC contract', () => {
    const customers = readFileSync('src/app/(dashboard)/customers/actions.ts', 'utf8');
    const contacts = readFileSync('src/app/(dashboard)/contacts/actions.ts', 'utf8');

    it('requires client read permission for both read actions', () => {
        expect(bodyOf(customers, 'getAccounts')).toContain("requirePermission('clients:view_all')");
        expect(bodyOf(contacts, 'getContacts')).toContain("requirePermission('clients:view_all')");
    });

    it('requires dedicated create/edit/delete rights for account mutations', () => {
        const actions = {
            createAccount: 'clients:create',
            updateAccount: 'clients:edit',
            deleteAccount: 'clients:delete',
            bulkCreateAccounts: 'clients:import',
        };
        for (const [name, permission] of Object.entries(actions)) {
            expect(bodyOf(customers, name)).toContain(`requirePermission('${permission}')`);
            expect(bodyOf(customers, name)).not.toContain('requireSessionContext()');
        }
    });

    it('requires explicit write permissions for every contact mutation', () => {
        const actions = {
            createContact: 'clients:create',
            updateContact: 'clients:edit',
            deleteContact: 'clients:delete',
        };
        for (const [name, permission] of Object.entries(actions)) {
            expect(bodyOf(contacts, name)).toContain(`requirePermission('${permission}')`);
            expect(bodyOf(contacts, name)).not.toContain('requireSessionContext()');
        }
    });

    it('never bypasses server authorization through plain session context in these actions', () => {
        expect(customers).not.toContain('requireSessionContext');
        expect(contacts).not.toContain('requireSessionContext');
    });
});
