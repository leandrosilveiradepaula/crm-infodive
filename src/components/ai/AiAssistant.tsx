import { useCallback, useEffect, useRef, useState } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { runCRMConsultantChat } from '@/lib/gemini';
import { boundedChatHistory, CHAT_INPUT_LIMIT, readableChatError } from '@/lib/ai-chat-ui-policy';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AiMessage {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
}

interface AiAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    initialQuery?: string | null;
}

const initialMessages: AiMessage[] = [{
    id: 'welcome',
    role: 'assistant',
    content: 'Olá! Posso analisar informações do seu pipeline e ajudar com perguntas sobre oportunidades e próximos passos.',
    timestamp: new Date().toISOString(),
}];

export const AiAssistant = ({ isOpen, onClose, initialQuery }: AiAssistantProps) => {
    const [messages, setMessages] = useState<AiMessage[]>(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const closeButtonRef = useRef<HTMLButtonElement>(null);
    const dialogRef = useRef<HTMLDivElement>(null);
    const inFlight = useRef(false);
    const activeRequest = useRef<AbortController | null>(null);
    const requestGeneration = useRef(0);
    const handledInitialQuery = useRef<string | null>(null);

    const dismiss = useCallback(() => {
        requestGeneration.current += 1;
        activeRequest.current?.abort();
        activeRequest.current = null;
        inFlight.current = false;
        setIsTyping(false);
        onClose();
    }, [onClose]);

    const handleSend = useCallback(async (queryOverride?: string) => {
        const content = (queryOverride ?? inputValue).trim().slice(0, CHAT_INPUT_LIMIT);
        // The synchronous ref blocks duplicate paid requests before React rerenders.
        if (!isOpen || !content || inFlight.current) return;

        inFlight.current = true;
        const generation = ++requestGeneration.current;
        const controller = new AbortController();
        activeRequest.current = controller;
        const newMessage: AiMessage = {
            id: String(Date.now()),
            role: 'user',
            content,
            timestamp: new Date().toISOString(),
        };
        setMessages(previous => [...previous, newMessage]);
        setInputValue('');
        setIsTyping(true);

        try {
            const history = boundedChatHistory([...messages, newMessage]);
            const response = await runCRMConsultantChat(history, controller.signal);
            if (controller.signal.aborted || generation !== requestGeneration.current) return;
            setMessages(previous => [...previous, {
                id: String(Date.now()) + '-response',
                role: 'assistant',
                content: response,
                timestamp: new Date().toISOString(),
            }]);
        } catch (error) {
            if (controller.signal.aborted || generation !== requestGeneration.current) return;
            console.error('[AiAssistant] chat request failed');
            setMessages(previous => [...previous, {
                id: String(Date.now()) + '-error',
                role: 'assistant',
                content: readableChatError(error),
                timestamp: new Date().toISOString(),
            }]);
        } finally {
            if (generation === requestGeneration.current) {
                activeRequest.current = null;
                inFlight.current = false;
                setIsTyping(false);
            }
        }
    }, [inputValue, isOpen, messages]);

    useEffect(() => {
        if (isOpen) messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isOpen]);

    useEffect(() => {
        if (!isOpen) {
            handledInitialQuery.current = null;
            return;
        }
        if (!initialQuery || handledInitialQuery.current === initialQuery) return;
        handledInitialQuery.current = initialQuery;
        const timer = setTimeout(() => void handleSend(initialQuery), 100);
        return () => clearTimeout(timer);
    }, [isOpen, initialQuery, handleSend]);

    useEffect(() => {
        if (!isOpen) return;
        const previouslyFocused = document.activeElement;
        closeButtonRef.current?.focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                dismiss();
                return;
            }
            if (event.key !== 'Tab') return;
            const focusable = Array.from(dialogRef.current?.querySelectorAll<HTMLElement>(
                'button:not(:disabled), input:not(:disabled), [tabindex]:not([tabindex="-1"])'
            ) ?? []);
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => {
            window.removeEventListener('keydown', onKeyDown);
            if (previouslyFocused instanceof HTMLElement) previouslyFocused.focus();
        };
    }, [isOpen, dismiss]);

    useEffect(() => () => {
        requestGeneration.current += 1;
        activeRequest.current?.abort();
    }, []);

    if (!isOpen) return null;

    return (
        <>
            <button
                type="button"
                className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40 lg:hidden"
                aria-label="Fechar assistente"
                onClick={dismiss}
            />
            <div
                ref={dialogRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="crm-assistant-title"
                className={cn(
                    'fixed top-0 right-0 h-full w-full sm:w-[400px] bg-background shadow-2xl z-50 border-l border-border flex flex-col',
                )}
            >
                <div className="p-4 border-b border-primary bg-primary text-primary-foreground flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-foreground/10 rounded-lg">
                            <Bot className="h-6 w-6 text-primary-foreground" aria-hidden="true" />
                        </div>
                        <div>
                            <h2 id="crm-assistant-title" className="font-bold text-lg">Assistente do CRM</h2>
                            <p className="text-xs text-primary-foreground/80">
                                Usa a integração de IA configurada no ambiente
                            </p>
                        </div>
                    </div>
                    <Button
                        ref={closeButtonRef}
                        type="button"
                        onClick={dismiss}
                        variant="ghost"
                        size="icon"
                        className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
                        title="Fechar assistente"
                        aria-label="Fechar assistente"
                    >
                        <X className="h-6 w-6" aria-hidden="true" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background" role="log" aria-live="polite" aria-label="Conversa do assistente">
                    {messages.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={cn(
                                'max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm',
                                msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-muted text-foreground rounded-tl-none',
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-muted p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" aria-hidden="true" />
                                <span className="text-xs text-muted-foreground font-medium">Analisando CRM...</span>
                            </div>
                        </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                <div className="p-4 border-t border-border bg-background">
                    <div className="relative flex items-center">
                        <Input
                            type="text"
                            maxLength={CHAT_INPUT_LIMIT}
                            aria-label="Pergunta para o assistente"
                            value={inputValue}
                            onChange={event => setInputValue(event.target.value)}
                            onKeyDown={event => {
                                if (event.key === 'Enter') {
                                    event.preventDefault();
                                    void handleSend();
                                }
                            }}
                            placeholder="Faça uma pergunta sobre suas oportunidades..."
                            className="w-full pr-12 bg-muted/50 border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                        />
                        <button
                            type="button"
                            onClick={() => void handleSend()}
                            disabled={!inputValue.trim() || isTyping}
                            className="absolute right-2 p-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                            aria-label="Enviar pergunta"
                        >
                            <Send className="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                    <p className="text-center text-xs text-muted-foreground mt-2">
                        Respostas de IA podem conter erros. Confirme informações importantes no CRM.
                    </p>
                </div>
            </div>
        </>
    );
};
