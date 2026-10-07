import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('automation builder truthfulness', () => {
  it('creates only actions supported by the current runtime', () => {
    const modal = readFileSync('src/components/automations/NewAutomationModal.tsx', 'utf8');
    expect(modal).toContain("type: 'create_task'");
    expect(modal).not.toContain("type: 'send_notification'");
    expect(modal).toContain("step === 3 && !(formData.actions?.length)");
  });

  it('does not announce persistence success when server actions fail', () => {
    const page = readFileSync('src/app/(dashboard)/automations/client-page.tsx', 'utf8');
    expect(page).toContain('if (!result.success)');
    expect(page).toContain("throw new Error(message)");
    expect(page).toContain("Não foi possível excluir a automação.");
    expect(page).toContain("Não foi possível duplicar a automação.");
  });
});
