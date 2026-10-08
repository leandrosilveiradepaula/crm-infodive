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

    it('shows accurate stats instead of claiming execution is blocked or reporting a false zero percent', () => {
        const page = readFileSync('src/app/(dashboard)/automations/client-page.tsx', 'utf8');
        expect(page).toContain('Fluxos ativos');
        expect(page).toContain('Fluxos pausados');
        expect(page).toContain('Contadores persistidos');
        expect(page).toContain("const activeCount = initialAutomations.filter(");
        expect(page).toContain("Sem execuções registradas");
        expect(page).toContain("        : '—';");
        expect(page).not.toContain('value: "Bloqueada"');
    });

    it('distinguishes fetch errors from empty history and ignores stale responses', () => {
        const page = readFileSync('src/app/(dashboard)/automations/client-page.tsx', 'utf8');
        const history = readFileSync('src/components/automations/HistorySheet.tsx', 'utf8');
        expect(page).toContain('setHistoryError(');
        expect(page).toContain('setHistory([])');
        expect(page).toContain('historyRequest.current === request');
        expect(page).toContain('error={historyError}');
        expect(history).toContain('role="alert"');
        expect(history).toContain('Não foi possível carregar o histórico');
    });

    it('guards duplicated actions, network failures and modal submission with truthful status', () => {
        const page = readFileSync('src/app/(dashboard)/automations/client-page.tsx', 'utf8');
        const modal = readFileSync('src/components/automations/NewAutomationModal.tsx', 'utf8');
        expect(page).toContain('if (pendingAction.current) return');
        expect(page).toContain('disabled={pendingActionId !== null}');
        expect(page).toContain('Falha de conexão ao salvar');
        expect(modal).toContain('if (submitInFlight.current) return');
        expect(modal).toContain('aria-busy={loading}');
        expect(modal).toContain('O fluxo permanece ativo ao salvar');
        expect(modal).toContain('O fluxo será salvo pausado');
        expect(modal).not.toContain('A ativação automática fica bloqueada');
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
