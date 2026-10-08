import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const component = readFileSync('src/components/ai/AiAssistant.tsx', 'utf8');
const client = readFileSync('src/lib/gemini.ts', 'utf8');
const header = readFileSync('src/components/layout/Header.tsx', 'utf8');

describe('assistant client request and accessibility contract', () => {
    it('rejects concurrent sends synchronously and bounds client input', () => {
        expect(component).toContain('inFlight.current');
        expect(component).toContain('if (!isOpen || !content || inFlight.current) return');
        expect(component).toContain('maxLength={CHAT_INPUT_LIMIT}');
        expect(component).toContain('boundedChatHistory([...messages, newMessage])');
    });

    it('passes cancellation signal and ignores responses from an old request', () => {
        expect(component).toContain('new AbortController()');
        expect(component).toContain('runCRMConsultantChat(history, controller.signal)');
        expect(component).toContain('controller.signal.aborted || generation !== requestGeneration.current');
        expect(component).toContain('activeRequest.current?.abort()');
        const functionStart = client.indexOf('export const runCRMConsultantChat');
        const functionEnd = client.indexOf('export const parseContactSignature', functionStart);
        const chatFunction = client.slice(functionStart, functionEnd);
        expect(chatFunction).toContain('signal?: AbortSignal');
        expect(chatFunction).toContain('signal,');
    });

    it('does not render arbitrary provider error text', () => {
        expect(component).toContain('readableChatError(error)');
        expect(component).not.toContain('error instanceof Error\n');
    });

    it('exposes dialog semantics, keyboard focus and Escape close', () => {
        expect(component).toContain('role="dialog"');
        expect(component).toContain('aria-modal="true"');
        expect(component).toContain('aria-labelledby="crm-assistant-title"');
        expect(component).toContain("event.key === 'Escape'");
        expect(component).toContain("event.key !== 'Tab'");
        expect(component).toContain('previouslyFocused.focus()');
        expect(header).toContain('onClose={closeAssistant}');
    });
});
