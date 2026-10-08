import type { TriggerType, ActionType } from '@/types/automation';
import { Zap, CheckCircle, TrendingUp } from 'lucide-react';

export const triggerOptions: { id: TriggerType; label: string; icon: any; description: string }[] = [
    { id: 'deal_created', label: 'Novo Deal Criado', icon: Zap, description: 'Quando uma oportunidade é adicionada ao pipeline' },
    { id: 'deal_moved', label: 'Deal Mudou de Etapa', icon: TrendingUp, description: 'Quando um deal avança ou recua no funil' },
];

export const actionOptions: { id: ActionType; label: string; icon: any; description: string }[] = [
    { id: 'create_task', label: 'Criar Tarefa', icon: CheckCircle, description: 'Cria uma tarefa vinculada à oportunidade' },
];
