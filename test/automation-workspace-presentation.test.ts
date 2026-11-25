import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { automationSummary, automationTriggerLabel, automationActionLabel, requireConfirmedAutomationMutation } from '../src/components/automations/automation-presentation';

describe('Automation workspace after Design System integration', () => {
    it('uses actual persisted execution counts and distinguishes no runs from zero success', () => {
        expect(automationSummary([])).toEqual({ active: 0, inactive: 0, executions: 0, successRate: null });
        expect(automationSummary([{ enabled: false, executionCount: 0, successCount: 0 }])).toEqual({ active: 0, inactive: 1, executions: 0, successRate: null });
        expect(automationSummary([{ enabled: true, executionCount: 5, successCount: 0 }]).successRate).toBe(0);
        expect(automationSummary([
            { enabled: true, executionCount: 2, successCount: 2 },
            { enabled: false, executionCount: 8, successCount: 3 },
        ])).toEqual({ active: 1, inactive: 1, executions: 10, successRate: 50 });
    });
    it('rejects an unconfirmed server mutation, even when the promise resolves', () => {
        expect(() => requireConfirmedAutomationMutation({ success: true })).not.toThrow();
        expect(() => requireConfirmedAutomationMutation({ success: false })).toThrow();
        expect(() => requireConfirmedAutomationMutation(undefined)).toThrow();
    });
    it('never presents invented history or confirms an unverified execution', () => {
        const history = readFileSync('src/components/automations/HistorySheet.tsx', 'utf8');
        const page = readFileSync('src/app/(dashboard)/automations/client-page.tsx', 'utf8');
        const wizard = readFileSync('src/components/automations/NewAutomationModal.tsx', 'utf8');
        expect(history).toContain('Histórico detalhado indisponível');
        expect(history).toContain("summary.successRate === null ? '—'");
        expect(history).not.toContain('cliente@email.com');
        expect(history).not.toContain('TIMEOUT');
        expect(history).not.toContain('Configurar Notificações de Erro');
        expect(page).toContain('requireConfirmedAutomationMutation(result)');
        expect(page).toContain('requireConfirmedAutomationMutation(await toggleAutomation');
        expect(page).toContain('requireConfirmedAutomationMutation(await deleteAutomation');
        expect(page).toContain('requireConfirmedAutomationMutation(await createAutomation(copy))');
        expect(wizard).toContain('setSaveError(true)');
        expect(wizard).toContain('role="alert"');
        expect(wizard).toContain('Isso não confirma a execução automática');
    });
    it('translates known action and trigger IDs without changing persisted identifiers', () => {
        expect(automationTriggerLabel('deal_stagnant')).toBe('Oportunidade estagnada');
        expect(automationActionLabel('send_email')).toBe('Enviar e-mail');
        expect(automationActionLabel('create_task')).toBe('Criar tarefa');
        expect(automationActionLabel('custom_future_action')).toBe('custom future action');
    });
    it('keeps a single directly accessible model library and distinct list and draft inputs', () => {
        const page = readFileSync('src/app/(dashboard)/automations/client-page.tsx', 'utf8');
        expect(page).toContain('aria-label="Biblioteca de receitas"');
        expect(page).toContain('href="#automation-modelos"');
        expect(page).toContain('value={builderPrompt}');
        expect(page).toContain('value={searchTerm}');
        expect(page).not.toContain('setShowGallery');
        expect(page).not.toContain('42h');
        expect(page).not.toContain('Gerar com IA');
        expect(page.indexOf('Fluxos de trabalho')).toBeLessThan(page.indexOf('Biblioteca de modelos'));
        expect(page).toContain('await createAutomation(automation)');
        expect(page).toContain('await updateAutomation(automation.id, automation)');
    });
    it('isolates the dashboard shell for both automation dialogs and verifies actual focus restoration', () => {
        const wizard = readFileSync('src/components/automations/NewAutomationModal.tsx', 'utf8');
        const history = readFileSync('src/components/automations/HistorySheet.tsx', 'utf8');
        const runner = readFileSync('test/e2e/run-authenticated-smoke.mjs', 'utf8');
        expect(wizard).toContain('useDialogBackgroundInert(true)');
        expect(history).toContain('useDialogBackgroundInert(open && Boolean(automation))');
        expect(runner).toContain('await assertAutomationDialogIsolation(page, editor)');
        expect(runner).toContain('await assertAutomationDialogIsolation(page, historyDialog)');
        expect(runner).toContain('AUTOMATION_BACKGROUND_FOCUS_ACCEPTED');
        expect(runner).toContain('AUTOMATION_HISTORY_DIALOG_CLIPPING');
    });
    it('uses the shared dialog and keeps edits non-mutating until explicit save', () => {
        const wizard = readFileSync('src/components/automations/NewAutomationModal.tsx', 'utf8');
        expect(wizard).toContain("from '@/components/ui/dialog'");
        expect(wizard).toContain('onCloseAutoFocus=');
        expect(wizard).toContain('htmlFor="automation-name"');
        expect(wizard).toContain('aria-pressed={action.type === type.id}');
        expect(wizard).toContain('enabled: initialData?.enabled ?? true');
        expect(wizard).toContain('newActions[idx] = { ...newActions[idx], type: type.id };');
        expect(wizard).toContain('config: { ...newActions[idx].config, title: e.target.value }');
        expect(wizard).not.toContain('newActions[idx].config.title =');
        expect(wizard).toContain('await onSave({');
    });
});
