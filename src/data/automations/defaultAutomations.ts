import type { Automation } from '@/types/automation';

/**
 * Legacy in-memory defaults are intentionally empty.
 *
 * Automation cards, counters and history must come from persisted tenant data.
 * Product examples belong in explicit recipe/template surfaces, never in the
 * runtime collection where they could be mistaken for real executions.
 */
export const defaultAutomations: Automation[] = [];

export const getAutomationById = (id: string): Automation | undefined => {
    return defaultAutomations.find(a => a.id === id);
};

export const getAutomationsByCategory = (category: string): Automation[] => {
    return defaultAutomations.filter(a => a.category === category);
};

export const getActiveAutomations = (): Automation[] => {
    return defaultAutomations.filter(a => a.enabled);
};
