import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('notification affordance hardening', () => {
  it('wires the header bell to the real notification center', () => {
    const header = readFileSync('src/components/layout/Header.tsx', 'utf8');
    expect(header).toContain('NotificationCenter');
    expect(header).toContain('useNotifications');
    expect(header).not.toContain('<Bell');
    expect(header).not.toContain('top-1.5 right-1.5 h-2 w-2 bg-red-500');
  });

  it('keeps notification controls accessible and avoids sub-12px text', () => {
    const center = readFileSync('src/components/layout/NotificationCenter.tsx', 'utf8');
    expect(center).toContain("aria-label={unreadCount > 0");
    expect(center).toContain('Fechar notificações');
    expect(center).toContain('Remover notificação');
    expect(center).not.toMatch(/text-\[(?:9|10|11)px\]/);
  });
});
