import type { Automation, TriggerType, ActionType } from '@/types/automation';

const triggerLabels: Record<TriggerType, string> = {
    deal_moved: 'Oportunidade movida',
    deal_created: 'Oportunidade criada',
    activity_created: 'Atividade criada',
    proposal_sent: 'Proposta enviada',
    time_based: 'Horário programado',
    field_updated: 'Campo atualizado',
    deal_stagnant: 'Oportunidade estagnada',
    proposal_not_viewed: 'Proposta não visualizada',
    deal_value_zero: 'Oportunidade sem valor',
    deal_no_products: 'Oportunidade sem produtos',
};

const actionLabels: Record<ActionType, string> = {
    create_task: 'Criar tarefa',
    send_email: 'Enviar e-mail',
    send_notification: 'Enviar notificação',
    update_field: 'Atualizar campo',
    create_activity: 'Criar atividade',
    move_deal: 'Mover oportunidade',
    assign_to: 'Atribuir responsável',
};

export function automationTriggerLabel(type: string) {
    return triggerLabels[type as TriggerType] ?? type.replaceAll('_', ' ');
}

export function automationActionLabel(type: string) {
    return actionLabels[type as ActionType] ?? type.replaceAll('_', ' ');
}

export function automationSummary(flows: Pick<Automation, 'enabled' | 'executionCount' | 'successCount'>[]) {
    const active = flows.filter(flow => flow.enabled).length;
    const executions = flows.reduce((sum, flow) => sum + (flow.executionCount || 0), 0);
    const successes = flows.reduce((sum, flow) => sum + (flow.successCount || 0), 0);
    return { active, inactive: flows.length - active, executions, successRate: executions > 0 ? successes / executions * 100 : null };
}
