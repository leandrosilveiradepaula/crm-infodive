import type { Automation } from '@/types/automation';

export const defaultAutomations: Automation[] = [
    {
        id: 'auto-001',
        name: 'Follow-up Automático',
        description: 'Cria tarefa de follow-up quando deal fica 3 dias sem atividade',
        enabled: true,
        category: 'followup',
        trigger: {
            type: 'time_based',
            config: {
                days: 3,
                condition: 'no_activity'
            }
        },
        conditions: [
            {
                field: 'status',
                operator: 'not_equals',
                value: 'closed',
                logic: 'AND'
            }
        ],
        actions: [
            {
                type: 'create_task',
                config: {
                    title: 'Follow-up com cliente',
                    description: 'Entrar em contato para dar continuidade ao deal'
                }
            },
            {
                type: 'send_notification',
                config: {
                    message: 'Deal {{deal_name}} precisa de follow-up'
                }
            }
        ],
        createdBy: 'Sistema',
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00',
        executionCount: 45,
        successCount: 43,
        failureCount: 2
    },
    {
        id: 'auto-002',
        name: 'Alerta de Deal Estagnado',
        description: 'Notifica responsável quando deal fica 7+ dias na mesma etapa',
        enabled: true,
        category: 'alert',
        trigger: {
            type: 'deal_stagnant',
            config: {
                days: 7
            }
        },
        conditions: [
            {
                field: 'value',
                operator: 'greater_than',
                value: 10000,
                logic: 'AND'
            }
        ],
        actions: [
            {
                type: 'send_notification',
                config: {
                    message: '⚠️ Deal {{deal_name}} está estagnado há 7 dias'
                }
            },
            {
                type: 'send_email',
                config: {
                    template: 'stagnant_deal_alert',
                    subject: 'Deal requer atenção'
                }
            }
        ],
        createdBy: 'Sistema',
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00',
        executionCount: 12,
        successCount: 12,
        failureCount: 0
    },
    {
        id: 'auto-003',
        name: 'Boas-vindas a Novo Lead',
        description: 'Envia email de boas-vindas quando novo lead é criado',
        enabled: true,
        category: 'welcome',
        trigger: {
            type: 'deal_created',
            config: {}
        },
        conditions: [],
        actions: [
            {
                type: 'send_email',
                config: {
                    template: 'welcome_lead',
                    subject: 'Bem-vindo à IBM/Lenovo'
                }
            },
            {
                type: 'create_task',
                config: {
                    title: 'Primeira ligação',
                    description: 'Fazer contato inicial com o lead'
                },
                delay: 60 // 1 hora depois
            }
        ],
        createdBy: 'Sistema',
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00',
        executionCount: 28,
        successCount: 28,
        failureCount: 0
    },
    {
        id: 'auto-004',
        name: 'Lembrete de Reunião',
        description: 'Notifica participantes 1 hora antes da reunião',
        enabled: true,
        category: 'reminder',
        trigger: {
            type: 'time_based',
            config: {
                minutes: 60,
                before: 'meeting'
            }
        },
        conditions: [],
        actions: [
            {
                type: 'send_notification',
                config: {
                    message: '📅 Reunião em 1 hora: {{meeting_title}}'
                }
            }
        ],
        createdBy: 'Sistema',
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00',
        executionCount: 67,
        successCount: 67,
        failureCount: 0
    },
    {
        id: 'auto-005',
        name: 'Proposta Não Visualizada',
        description: 'Envia lembrete se proposta não for visualizada em 2 dias',
        enabled: true,
        category: 'followup',
        trigger: {
            type: 'proposal_not_viewed',
            config: {
                days: 2
            }
        },
        conditions: [],
        actions: [
            {
                type: 'send_email',
                config: {
                    template: 'proposal_reminder',
                    subject: 'Lembrete: Proposta Comercial'
                }
            },
            {
                type: 'create_task',
                config: {
                    title: 'Ligar sobre proposta',
                    description: 'Cliente não visualizou a proposta ainda'
                }
            }
        ],
        createdBy: 'Sistema',
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00',
        executionCount: 8,
        successCount: 8,
        failureCount: 0
    },
    {
        id: 'auto-006',
        name: 'Celebração de Deal Ganho',
        description: 'Envia email de agradecimento e notifica equipe quando deal é fechado',
        enabled: true,
        category: 'celebration',
        trigger: {
            type: 'deal_moved',
            config: {
                stage: 'won'
            }
        },
        conditions: [],
        actions: [
            {
                type: 'send_email',
                config: {
                    template: 'thank_you',
                    subject: 'Obrigado pela confiança!'
                }
            },
            {
                type: 'send_notification',
                config: {
                    message: '🎉 Deal fechado: {{deal_name}} - {{deal_value}}'
                }
            }
        ],
        createdBy: 'Sistema',
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00',
        executionCount: 5,
        successCount: 5,
        failureCount: 0
    },
    {
        id: 'auto-007',
        name: 'Escalonamento Automático',
        description: 'Notifica gerente quando deal grande fica sem atividade',
        enabled: true,
        category: 'escalation',
        trigger: {
            type: 'time_based',
            config: {
                days: 5,
                condition: 'no_activity'
            }
        },
        conditions: [
            {
                field: 'value',
                operator: 'greater_than',
                value: 100000,
                logic: 'AND'
            }
        ],
        actions: [
            {
                type: 'send_notification',
                config: {
                    message: '🚨 Deal de alto valor requer atenção: {{deal_name}}',
                    notifyManager: true
                }
            },
            {
                type: 'send_email',
                config: {
                    template: 'escalation_alert',
                    subject: 'Deal de Alto Valor - Ação Necessária',
                    to: 'manager'
                }
            }
        ],
        createdBy: 'Sistema',
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00',
        executionCount: 3,
        successCount: 3,
        failureCount: 0
    },
    {
        id: 'auto-008',
        name: 'Alerta: Oportunidade sem Valor',
        description: 'Notifica responsável quando oportunidade é criada com valor R$ 0',
        enabled: false,
        category: 'alert',
        trigger: {
            type: 'deal_value_zero',
            config: {}
        },
        conditions: [],
        actions: [
            {
                type: 'send_notification',
                config: {
                    message: '⚠️ Oportunidade "{{deal_name}}" criada sem valor. Adicione produtos e defina o valor!'
                }
            },
            {
                type: 'create_task',
                config: {
                    title: 'Definir valor da oportunidade',
                    description: 'Adicionar produtos e calcular o valor total da oportunidade "{{deal_name}}"'
                },
                delay: 30 // 30 minutos depois
            }
        ],
        createdBy: 'Sistema',
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00',
        executionCount: 0,
        successCount: 0,
        failureCount: 0
    },
    {
        id: 'auto-009',
        name: 'Alerta: Oportunidade sem Produtos',
        description: 'Notifica responsável quando oportunidade não possui produtos cadastrados',
        enabled: false,
        category: 'alert',
        trigger: {
            type: 'deal_no_products',
            config: {}
        },
        conditions: [],
        actions: [
            {
                type: 'send_notification',
                config: {
                    message: '📦 Oportunidade "{{deal_name}}" não possui produtos. Adicione itens para gerar proposta!'
                }
            },
            {
                type: 'create_task',
                config: {
                    title: 'Cadastrar produtos na oportunidade',
                    description: 'Adicionar produtos/serviços à oportunidade "{{deal_name}}"'
                },
                delay: 60 // 1 hora depois
            }
        ],
        createdBy: 'Sistema',
        createdAt: '2024-01-01T00:00:00',
        updatedAt: '2024-01-01T00:00:00',
        executionCount: 0,
        successCount: 0,
        failureCount: 0
    }
];

export const getAutomationById = (id: string): Automation | undefined => {
    return defaultAutomations.find(a => a.id === id);
};

export const getAutomationsByCategory = (category: string): Automation[] => {
    return defaultAutomations.filter(a => a.category === category);
};

export const getActiveAutomations = (): Automation[] => {
    return defaultAutomations.filter(a => a.enabled);
};
