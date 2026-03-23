export interface AiMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

export interface AiInsight {
    id: string;
    type: 'opportunity' | 'risk' | 'action';
    title: string;
    description: string;
    score?: number;
}

export const mockAiHistory: AiMessage[] = [
    {
        id: '1',
        role: 'assistant',
        content: 'Olá! Sou seu assistente de vendas da IBM/Lenovo. Como posso ajudar você a fechar mais negócios hoje?',
        timestamp: new Date(Date.now() - 3600000).toISOString()
    }
];

export const mockInsights: AiInsight[] = [
    {
        id: '1',
        type: 'opportunity',
        title: 'Alta probabilidade de fechamento',
        description: 'O deal "Expansão Data Center" tem 85% de chance de fechar esta semana baseado em interações recentes.',
        score: 85
    },
    {
        id: '2',
        type: 'risk',
        title: 'Deal estagnado',
        description: 'O cliente "TechSolutions" não interage há 7 dias. Sugiro enviar um case de sucesso.',
        score: 30
    },
    {
        id: '3',
        type: 'action',
        title: 'Tarefa pendente',
        description: 'Você tem uma reunião com o CTO da "Inovação Corp" amanhã. Gostaria que eu preparasse um resumo?',
    }
];
