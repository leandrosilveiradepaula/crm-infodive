import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('audit log security boundary', () => {
  it('requires the dedicated server-side permission to read audit logs', () => {
    const source = readFileSync('src/app/(dashboard)/settings/audit-actions.ts', 'utf8');
    expect(source).toContain("requirePermission('settings:view_audit')");
    expect(source).not.toContain('requireSessionContext');
  });

  it('does not expose a client-callable audit-log insert action', () => {
    const actionSource = readFileSync('src/app/(dashboard)/settings/audit-actions.ts', 'utf8');
    const hookSource = readFileSync('src/hooks/useAuditLogs.ts', 'utf8');

    expect(actionSource).not.toContain('export async function createAuditLog');
    expect(hookSource).not.toContain('createAuditLog');
    expect(hookSource).not.toContain('addLog');
  });
});
