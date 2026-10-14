// Tipos para o sistema de automações
export type TriggerType =
    | 'deal_moved'
    | 'deal_created'
    | 'activity_created'
    | 'proposal_sent'
    | 'time_based'
    | 'field_updated'
    | 'deal_stagnant'
    | 'proposal_not_viewed'
    | 'deal_value_zero'
    | 'deal_no_products';

export type ActionType =
    | 'create_task'
    | 'send_email'
    | 'send_notification'
    | 'update_field'
    | 'create_activity'
    | 'move_deal'
    | 'assign_to';

export type ConditionOperator =
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'greater_than'
    | 'less_than'
    | 'is_empty'
    | 'is_not_empty';

export type LogicOperator = 'AND' | 'OR';

export interface Trigger {
    type: TriggerType;
    config: {
        stage?: string;
        days?: number;
        field?: string;
        value?: any;
        [key: string]: any;
    };
}

export interface Condition {
    field: string;
    operator: ConditionOperator;
    value: any;
    logic: LogicOperator;
}

export interface Action {
    type: ActionType;
    config: {
        title?: string;
        description?: string;
        template?: string;
        field?: string;
        value?: any;
        assignTo?: string;
        [key: string]: any;
    };
    delay?: number; // em minutos
}

export interface AutomationExecution {
    id: string;
    automationId: string;
    executedAt: string;
    status: 'running' | 'success' | 'failed' | 'skipped';
    trigger: string;
    actions: string[];
    error?: string;
}

export interface Automation {
    id: string;
    name: string;
    description: string;
    enabled: boolean;
    category: 'followup' | 'alert' | 'welcome' | 'reminder' | 'escalation' | 'celebration' | 'custom';
    trigger: Trigger;
    conditions: Condition[];
    actions: Action[];
    createdBy: string;
    createdAt: string;
    updatedAt: string;
    lastRun?: string;
    executionCount: number;
    successCount: number;
    failureCount: number;
}

export interface EmailTemplate {
    id: string;
    name: string;
    subject: string;
    body: string;
    variables: string[];
    category: 'welcome' | 'followup' | 'proposal' | 'thank_you' | 'reengagement' | 'reminder';
}

export interface AutomationStats {
    total: number;
    active: number;
    inactive: number;
    totalExecutions: number;
    successRate: number;
    timeSaved: number; // em horas
}
