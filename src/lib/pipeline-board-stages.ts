import type { PipelineStage } from '@/services/SettingsService';
import type { Deal } from '@/types/deal';

// Never infer terminal outcomes from editable labels or positional indices.
export interface BoardStage {
    id: string;
    title: string;
    color: string;
    bg: string;
    probability?: number;
    historical?: boolean;
}
export const TERMINAL_STAGES: BoardStage[] = [
    { id: 'won', title: 'Ganho', color: 'border-success', bg: 'bg-success/5', probability: 100 },
    { id: 'lost', title: 'Perdido', color: 'border-destructive', bg: 'bg-destructive/5', probability: 0 },
];
const LEGACY: Record<string, { key: string; probability: number }> = {
    'qualificação': { key: 'qualification', probability: 30 },
    'proposta': { key: 'proposal', probability: 50 },
    'negociação': { key: 'negotiation', probability: 75 },
};
const normal = (value: string) => value.trim().toLocaleLowerCase('pt-BR');
export function configuredBoardStages(configured: PipelineStage[], deals: Pick<Deal, 'stage'>[]): BoardStage[] {
    const seen = new Set<string>();
    const custom: BoardStage[] = [];
    for (const stage of configured) {
        const translated = LEGACY[normal(stage.name)];
        // Terminal states stay system-controlled, never driven by a display name.
        if (normal(stage.name) === 'ganho' || normal(stage.name) === 'fechado ganho' ||
            normal(stage.name) === 'perdido') continue;
        // Persisted custom stages use their immutable UUID, not an editable label.
        // The synthetic defaults have non-UUID IDs and keep legacy statuses.
        const id = translated?.key || (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(stage.id)
            ? stage.id : stage.name.trim());
        if (!id || seen.has(id) || id === 'won' || id === 'lost') continue;
        seen.add(id);
        custom.push({ id, title: stage.name, color: 'border-primary', bg: 'bg-primary/5',
            probability: translated?.probability });
    }
    // Existing deals must never silently disappear or move to qualification.
    for (const deal of deals) {
        const id = deal.stage || 'qualification';
        if (seen.has(id) || id === 'won' || id === 'lost') continue;
        seen.add(id);
        const title = id === 'qualification' ? 'Qualificação (legado)' :
            id === 'proposal' ? 'Proposta (legado)' :
            id === 'negotiation' ? 'Negociação (legado)' : id + ' (histórico)';
        custom.push({ id, title, color: 'border-muted-foreground', bg: 'bg-muted/20', historical: true });
    }
    if (!custom.length) {
        custom.push(...[
            { id: 'qualification', title: 'Qualificação', probability: 30 },
            { id: 'proposal', title: 'Proposta', probability: 50 },
            { id: 'negotiation', title: 'Negociação', probability: 75 },
        ].map(s => ({...s,color:'border-primary',bg:'bg-primary/5'})));
    }
    return [...custom, ...TERMINAL_STAGES];
}
export function isConfiguredMove(target: string, configured: PipelineStage[]): boolean {
    if (target === 'won' || target === 'lost') return true;
    return configuredBoardStages(configured, []).some(s => s.id === target && !s.historical);
}
