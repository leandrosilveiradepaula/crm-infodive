import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { checkAutomations } from './automations';
import {
    defaultAutomations,
    getActiveAutomations,
    getAutomationById,
    getAutomationsByCategory,
} from '../data/automations/defaultAutomations';

describe('automation fake-data hardening', () => {
    it('does not report success from the disabled legacy compatibility hook', async () => {
        await expect(checkAutomations({})).resolves.toBe(false);
    });

    it('does not ship fake automation counters as runtime data', () => {
        expect(defaultAutomations).toEqual([]);
        expect(getActiveAutomations()).toEqual([]);
        expect(getAutomationsByCategory('followup')).toEqual([]);
        expect(getAutomationById('auto-001')).toBeUndefined();
    });

    it('does not label every edit as AI-generated', () => {
        const source = readFileSync('src/components/automations/NewAutomationModal.tsx', 'utf8');
        expect(source).not.toContain('Sugerido por IA');
        expect(source).not.toContain('text-[9px]');
        expect(source).not.toContain('text-[10px]');
        expect(source).not.toContain('text-[11px]');
    });
});
