export const CHAT_INPUT_LIMIT = 4000;
export const CHAT_HISTORY_LIMIT = 10;

export type ChatHistoryItem = { role: 'user' | 'assistant'; content: string };

/** Match the Gemini chat route bounds before sending client-side history. */
export function boundedChatHistory(messages: ChatHistoryItem[]): ChatHistoryItem[] {
    return messages
        .filter(message => (message.role === 'user' || message.role === 'assistant') &&
            typeof message.content === 'string' && Boolean(message.content.trim()))
        .slice(-CHAT_HISTORY_LIMIT)
        .map(message => ({
            role: message.role,
            content: message.content.slice(0, CHAT_INPUT_LIMIT),
        }));
}

const APPROVED_CHAT_ERRORS = new Set([
    'Pergunta inválida.',
    'Integração de IA não configurada.',
    'Muitas mensagens em pouco tempo.',
    'Não foi possível carregar o contexto do CRM.',
    'A integração de IA está indisponível no momento.',
    'A integração de IA retornou uma resposta vazia.',
]);

/** Do not reveal arbitrary server/provider error strings in the assistant. */
export function readableChatError(error: unknown): string {
    if (error instanceof Error && APPROVED_CHAT_ERRORS.has(error.message)) {
        return error.message;
    }
    return 'Não foi possível consultar o assistente agora. Tente novamente.';
}
