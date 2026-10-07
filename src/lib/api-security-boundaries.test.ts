import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('API security boundaries', () => {
  it('requires authentication and payload bounds before parse-company can call Gemini', () => {
    const source = readFileSync('src/app/api/gemini/parse-company/route.ts', 'utf8');
    expect(source).toContain('await requireSessionContext()');
    expect(source).toContain('20_000');
    expect(source).toContain('8_000_000');
    expect(source).toContain("status: 413");
    expect(source).toContain("status: 401");
  });

  it('requires deals:edit on proposal routes that persist or allocate proposal state', () => {
    for (const path of [
      'src/app/api/proposals/generate-pdf/route.ts',
      'src/app/api/proposals/save-draft/route.ts',
      'src/app/api/proposals/generate-number/route.ts'
    ]) {
      const source = readFileSync(path, 'utf8');
      expect(source).toContain("requirePermission('deals:edit')");
      expect(source).not.toContain('requireSessionContext()');
      expect(source).toContain("status: 403");
    }
  });

  it('keeps tokenized public proposal endpoints explicitly public', () => {
    const publicProposal = readFileSync('src/app/api/proposals/public/[token]/route.ts', 'utf8');
    const signProposal = readFileSync('src/app/api/proposals/sign/route.ts', 'utf8');
    expect(publicProposal).toContain("rpc('get_proposal_by_public_token'");
    expect(signProposal).toContain("supabase.rpc('sign_proposal'");
  });
});
