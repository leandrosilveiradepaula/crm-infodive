import { describe, expect, it } from 'vitest';
import { boundedChatHistory, CHAT_INPUT_LIMIT, CHAT_HISTORY_LIMIT, readableChatError } from './ai-chat-ui-policy';

describe('Gemini assistant client message policy', () => {
    it('only sends the last ten nonempty messages in order', () => {
        const input = Array.from({ length: 15 }, (_, index) => ({
            role: index % 2 ? 'assistant' as const : 'user' as const,
            content: 'message-' + index,
        }));
        const history = boundedChatHistory(input);
        expect(history).toHaveLength(CHAT_HISTORY_LIMIT);
        expect(history[0].content).toBe('message-5');
        expect(history[9].content).toBe('message-14');
    });

    it('truncates content to the API request limit', () => {
        const history = boundedChatHistory([{ role: 'user', content: 'x'.repeat(CHAT_INPUT_LIMIT + 123) }]);
        expect(history[0].content).toHaveLength(CHAT_INPUT_LIMIT);
    });

    it('does not send whitespace-only messages', () => {
        expect(boundedChatHistory([{ role: 'user', content: '   ' }])).toEqual([]);
    });
    it('only displays approved operational error messages', () => {
        expect(readableChatError(new Error('Integração de IA não configurada.')))
            .toBe('Integração de IA não configurada.');
        expect(readableChatError(new Error('provider secret:abc123')))
            .toBe('Não foi possível consultar o assistente agora. Tente novamente.');
        expect(readableChatError({ internal: 'details' }))
            .toBe('Não foi possível consultar o assistente agora. Tente novamente.');
    });

});
