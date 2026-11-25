import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { automationSummary, automationTriggerLabel, automationActionLabel } from '../src/components/automations/automation-presentation';

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
