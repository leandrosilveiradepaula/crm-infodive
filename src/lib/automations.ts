// Legacy compatibility hook. The old implementation returned true without
// executing any automation, which could make callers believe work happened.
export const checkAutomations = async (_data: unknown): Promise<boolean> => {
    console.warn('[Automations] legacy compatibility hook is disabled; use AutomationService-backed flows');
    return false;
};
