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
