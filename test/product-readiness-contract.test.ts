import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
const source = (path: string) => readFileSync(path,'utf8');
describe('Complementary product readiness contract', () => {
    it('uses real versioned RPC bodies only on isolated local QA and retains service-only ACL', () => {
        const setup = source('test/e2e/local-qa/bootstrap-product-journeys.mjs');
        for (const name of ['get_deal_room_by_token','get_proposal_by_public_token','get_next_proposal_number']) expect(setup).toContain(name);
        expect(setup).toContain("http://127.0.0.1:54321");
        expect(setup).toContain('FROM PUBLIC, anon, authenticated');
        expect(setup).toContain('TO service_role');
        expect(setup).toContain("text.slice(start, end + 3)");
    });
    it('handles public route parameters and nullable room data', () => {
        expect(source('src/app/portal/[id]/page.tsx')).toContain('await params');
        const portal=source('src/components/portal/DealRoomPortal.tsx');
        expect(portal).toContain('Array.isArray(deal.products)');
        expect(portal).toContain("deal.owner ||");
    });
    it('renders the current editor data format while keeping legacy fallback', () => {
        const page=source('src/app/proposals/public/[token]/page.tsx');
        expect(page).toContain('proposal.content.activeSections');
        expect(page).toContain('sectionOrder');
        expect(page).toContain('ProposalCustomNotesPage');
        expect(source('src/app/api/proposals/public/[token]/route.ts')).toContain('data.content_json ?? data.content');
        expect(source('src/services/ProposalService.ts')).toContain('p.content_json ?? p.content');
        expect(source('src/components/proposals/editor/ProposalEditorClient.tsx')).toContain('flex-col xl:flex-row');
    });
    it('keeps the old gates and fails closed on the added real browser checks', () => {
        const workflow=source('.github/workflows/crm-b4-local-authenticated.yml');
        expect(workflow).toContain('node test/e2e/run-authenticated-smoke.mjs');
        expect(workflow).toContain('node test/e2e/run-product-journeys.mjs || status=1');
        const runner=source('test/e2e/run-product-journeys.mjs');
        expect(runner).toContain('CROSS_TENANT_UNEXPECTED_WRITE');
        expect(runner).toContain('DRAFT_REOPEN_CONTENT');
        expect(runner).toContain('ORDER_AMOUNT_CHANGED');
        expect(runner).toContain('PRODUCT_QA_AXE_FINDINGS');
        expect(runner).not.toContain('route.fulfill(');
    });
    it('preserves contrast and accessible real order actions in complementary pages', () => {
        expect(source('src/app/(dashboard)/sales/tabs/OrdersTab.tsx')).toContain('aria-label="Ações do pedido"');
        const editor = source('src/components/proposals/editor/ProposalEditorClient.tsx');
        expect(editor).toContain('bg-primary hover:bg-primary/90 text-primary-foreground');
        expect(editor).not.toContain("!section.enabled ? 'opacity-40'");
        expect(source('src/app/proposals/public/[token]/page.tsx')).toContain("viewed: { label: 'Visualizada', color: 'bg-info-subtle text-foreground' }");
        const portal = source('src/components/portal/DealRoomPortal.tsx');
        expect(portal).toContain('<AvatarFallback');
        expect(portal).not.toContain('href="#"');
        const runner=source('test/e2e/run-product-journeys.mjs');
        expect(runner).toContain('DEAL_FORM_INVALID');
        expect(runner).toContain('DEAL_FORM_VALUES');
        expect(runner).toContain('CRM_PRODUCT_QA_AXE_DETAIL=');
    });
    it('does not certify or automatically export the environment-bound original', () => {
        const audit=source('scripts/audit-reusable-base.mjs');
        expect(audit).toContain('NOT_AUTHORIZED_AND_NOT_CREATED');
        expect(audit).toContain('BLOCKED_FOR_DIRECT_CLONE');
        expect(audit).toContain('environmentVariableNames');
    });
});
