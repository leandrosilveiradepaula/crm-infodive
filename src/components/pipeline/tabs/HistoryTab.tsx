'use client';

import React from 'react';
import type { Deal } from '@/types/deal';
import { DealActivityTimeline } from '../DealActivityTimeline';

interface HistoryTabProps { deal: Deal }

export const HistoryTab = ({ deal }: HistoryTabProps) => (
    <div className="h-full overflow-y-auto p-6">
        <div className="mb-5">
            <h3 className="ds-type-section-title font-semibold text-foreground">Atividades registradas</h3>
            <p className="ds-type-label mt-1 text-muted-foreground">
                São exibidas apenas as atividades vinculadas a esta oportunidade.
                Alterações de estágio ou valor sem um evento auditável não são apresentadas como histórico.
            </p>
        </div>
        <DealActivityTimeline deal={deal} />
    </div>
);
