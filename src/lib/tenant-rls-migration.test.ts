import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const migration = readFileSync(
  'supabase/migrations/20261007023000_harden_tenant_rls_profile_context.sql',
  'utf8',
);

describe('tenant RLS profile context migration', () => {
  it('never authorizes from user-editable metadata', () => {
    expect(migration).not.toContain("user_metadata'");
    expect(migration).not.toContain("request.jwt.claims");
    expect(migration).toContain('FROM public.profiles AS p');
    expect(migration).toContain('p.id = auth.uid()');
  });

  it('makes tenant lookup fail closed and private from anon', () => {
    expect(migration).toContain('SECURITY DEFINER');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.current_user_organization_id() FROM PUBLIC');
    expect(migration).toContain('REVOKE ALL ON FUNCTION public.current_user_organization_id() FROM anon');
    expect(migration).toContain("COALESCE(p.status, 'active') <> 'inactive'");
  });

  it('rebuilds tenant policies using the server-controlled profile helper', () => {
    expect(migration).toContain('organization_id = public.current_user_organization_id()');
    expect(migration).toContain("'accounts','products','deals'");
    expect(migration).toContain('Users can manage their api keys');
    expect(migration).toContain('Users can upload invoices to their organization folder');
  });

  it('keeps audit logs server-owned and inaccessible to direct authenticated writes', () => {
    expect(migration).toContain('REVOKE ALL ON TABLE public.audit_logs FROM anon');
    expect(migration).toContain('REVOKE ALL ON TABLE public.audit_logs FROM authenticated');
    expect(migration).not.toContain('CREATE POLICY "Tenant Isolation Profile"\n      ON public.audit_logs');
  });

  it('keeps privileged inserts explicit rather than inventing a default tenant', () => {
    expect(migration).toContain("ELSIF NEW.organization_id IS NULL THEN");
    expect(migration).toContain("RAISE EXCEPTION 'Missing organization_id:");
    expect(migration).not.toContain("b4366e33-b8d5-4cbc-a7a7-8bd607031931");
  });
});
