'use client';

import React from 'react';
import { CalendarClock, History } from 'lucide-react';
import type { Deal } from '@/types/deal';
import type { Activity } from '@/types/activity';

type Props = { deal: Deal; compact?: boolean };

const STATUS: Record<Activity['status'], string> = {
    pending: 'Pendente',
    in_progress: 'Em andamento',
    completed: 'Concluída',
    cancelled: 'Cancelada',
};

function activityDate(value: string | undefined): string {
    if (!value) return 'Data não informada';
    const date = new Date(value);
    return Number.isNaN(date.getTime())
        ? 'Data não informada'
        : new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'UTC' }).format(date);
}

export function DealActivityTimeline({ deal, compact = false }: Props) {
    // Never fabricate events. The view intentionally uses the deal's actual
    // related activities only; an absent array is a legitimate empty state.
    const recorded = Array.isArray(deal.deal_activities) ? deal.deal_activities : [];
    const sorted = [...recorded].filter(item => item && typeof item.title === 'string')
        .sort((a, b) => {
            const left = new Date(a.createdAt || '').getTime();
            const right = new Date(b.createdAt || '').getTime();
            return (Number.isFinite(right) ? right : 0) - (Number.isFinite(left) ? left : 0);
        });
    const items = compact ? sorted.slice(0, 3) : sorted;

    return (
        <div data-qa-region="deal-activity-timeline" className="space-y-3">
            {items.length ? items.map(item => (
                <article key={item.id} className="rounded-[var(--radius-panel)] border border-border bg-card p-4 shadow-control-ui">
                    <div className="flex items-start justify-between gap-3">
                        <h4 className="ds-type-body font-semibold text-foreground">{item.title}</h4>
                        <span className="ds-type-metadata shrink-0 text-muted-foreground">
                            {activityDate(item.createdAt)}
                        </span>
                    </div>
                    {item.description && (
                        <p className="ds-type-label mt-2 text-muted-foreground">{item.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-2 ds-type-metadata text-muted-foreground">
                        <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>{STATUS[item.status] || 'Status não informado'}</span>
                    </div>
                </article>
            )) : (
                <div className="rounded-[var(--radius-panel)] border border-border bg-card p-5 text-muted-foreground shadow-control-ui">
                    <div className="flex items-center gap-2">
                        <History className="h-4 w-4" aria-hidden="true" />
                        <p className="ds-type-body font-semibold text-foreground">Nenhuma atividade registrada</p>
                    </div>
                    <p className="ds-type-label mt-2">
                        Esta oportunidade não possui atividades disponíveis nesta visualização.
                    </p>
                </div>
            )}
            {compact && sorted.length > items.length && (
                <p className="ds-type-metadata text-muted-foreground">
                    Exibindo {items.length} de {sorted.length} atividades registradas.
                </p>
            )}
        </div>
    );
}
