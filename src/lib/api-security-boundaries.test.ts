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

describe('AI authorization contract', () => {
    it('requires clients:import permission before invoking any paid import provider', () => {
        const source = readFileSync('src/app/api/customers/import/route.ts','utf8');
        expect(source).toContain("requirePermission('clients:import')");
        expect(source).toContain('status: forbidden ? 403 : 401');
        expect(source.indexOf("requirePermission('clients:import')")).toBeLessThan(source.indexOf('await req.json()'));
        expect(source.indexOf("requirePermission('clients:import')")).toBeLessThan(source.indexOf('model.generateContent(prompt)'));
    });
    it('filters Gemini chat context to owned deals for roles without view_all', () => {
        const source = readFileSync('src/app/api/gemini/chat/route.ts','utf8');
        expect(source).toContain('await getAiDealScope(userId, organizationId)');
        expect(source).toContain("if (!canViewAll) dealQuery = dealQuery.eq('owner_id', userId)");
        expect(source.indexOf("getAiDealScope(userId, organizationId)")).toBeLessThan(source.indexOf("guardPaidAiRequest"));
    });
    it('never accepts client-provided commercial facts for AI diagnosis', () => {
        const source = readFileSync('src/app/api/gemini/analyze-deal/route.ts','utf8');
        expect(source).toContain("if (!canViewAll) dealQuery = dealQuery.eq('owner_id', userId)");
        expect(source).toContain("if (!canViewAll) updateQuery = updateQuery.eq('owner_id', userId)");
        expect(source).toContain(".eq('deal_id', deal.id)");
        expect(source).toContain(".eq('organization_id', organizationId)");
        expect(source.indexOf("const { data: deal, error: dealError }")).toBeLessThan(source.indexOf('guardPaidAiRequest'));
        expect(source).not.toContain('const { deal, activities } = await request.json()');
    });
});
