import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('automation runtime service contract', () => {
    it('is tenant scoped and idempotent by event key', () => {
        const source = readFileSync('src/services/AutomationRuntimeService.ts', 'utf8');
        expect(source).toContain("event.organizationId !== organizationId");
        expect(source).toContain("unique");
        expect(source).toContain("duplicate_event");
        expect(source).toContain(".eq('organization_id', organizationId)");
    });

    it('executes only create_task through ActivityService', () => {
        const source = readFileSync('src/services/AutomationRuntimeService.ts', 'utf8');
        expect(source).toContain("action.type !== 'create_task'");
        expect(source).toContain('ActivityService.createActivity');
        expect(source).toContain("source: 'automation'");
    });

    it('persists success failure and skipped execution outcomes', () => {
        const source = readFileSync('src/services/AutomationRuntimeService.ts', 'utf8');
        for (const status of ["'success'", "'failed'", "'skipped'", "'running'"]) {
            expect(source).toContain(status);
        }
        expect(source).toContain('sanitizeError');
        expect(source).toContain('execution_count');
        expect(source).toContain('success_count');
        expect(source).toContain('failure_count');
    });

    it('is connected to deal_created and deal_moved events', () => {
        const actions = readFileSync('src/app/(dashboard)/pipeline/actions.ts', 'utf8');
        expect(actions).toContain('AutomationRuntimeService.executeEvent');
        expect(actions).toContain("type: 'deal_created'");
        expect(actions).toContain("type: 'deal_moved'");
    });

    it('keeps persisted execution history server-side and UI backed', () => {
        const service = readFileSync('src/services/AutomationService.ts', 'utf8');
        const actions = readFileSync('src/app/(dashboard)/automations/actions.ts', 'utf8');
        const history = readFileSync('src/components/automations/HistorySheet.tsx', 'utf8');
        expect(service).toContain(".from('automation_executions')");
        expect(actions).toContain('getAutomationHistory');
        expect(history).toContain('executions.map');
        expect(history).toContain('Nenhuma execução verificada');
    });
});
