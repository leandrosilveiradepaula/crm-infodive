import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('automation runtime fail-closed surface', () => {
    it('never presents mocked execution history', () => {
        const history = readFileSync('src/components/automations/HistorySheet.tsx', 'utf8');
        expect(history).not.toContain('cliente@email.com');
        expect(history).not.toContain('TIMEOUT');
        expect(history).not.toContain('Configurar Notificações de Erro');
        expect(history).toContain('Nenhuma execução verificada');
        expect(history).toContain('Em andamento');
        expect(history).toContain('Ações planejadas: ');
        expect(history).not.toContain("'Ações: ' + execution.actions");
        const service = readFileSync('src/services/AutomationService.ts', 'utf8');
        expect(service).toContain('status: item.status,');
        expect(service).not.toContain("item.status === 'running' ? 'skipped'");
    });

    it('only exposes runtime-backed triggers and actions and preserves explicit enablement', () => {
        const modal = readFileSync('src/components/automations/NewAutomationModal.tsx', 'utf8');
        const service = readFileSync('src/services/AutomationService.ts', 'utf8');
        const options = readFileSync('src/data/automations/automationOptions.tsx', 'utf8');
        expect(modal).toContain("enabled: initialData?.enabled ?? false");
        expect(modal).toContain('Salvar Configuração');
        expect(service).toContain('enabled: Boolean(item.enabled)');
        expect(options).toContain("id: 'deal_created'");
        expect(options).toContain("id: 'deal_moved'");
        expect(options).toContain("id: 'create_task'");
        expect(options).not.toContain("id: 'send_email'");
        expect(options).not.toContain("id: 'move_deal'");
    });
});
