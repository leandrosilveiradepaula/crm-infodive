import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('automation runtime fail-closed surface', () => {
    it('never presents mocked execution history', () => {
        const history = readFileSync('src/components/automations/HistorySheet.tsx', 'utf8');
        expect(history).not.toContain('cliente@email.com');
        expect(history).not.toContain('TIMEOUT');
        expect(history).not.toContain('Configurar Notificações de Erro');
        expect(history).toContain('Nenhuma execução verificada');
    });

    it('saves automation configuration as a draft until the executor exists', () => {
        const modal = readFileSync('src/components/automations/NewAutomationModal.tsx', 'utf8');
        const service = readFileSync('src/services/AutomationService.ts', 'utf8');
        expect(modal).toContain('enabled: false');
        expect(modal).toContain('Salvar Configuração');
        expect(service).toContain('A execução automática está bloqueada');
        expect(service).toContain('enabled: false');
    });
});
