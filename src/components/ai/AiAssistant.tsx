import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Loader2 } from 'lucide-react';
import { runCRMConsultantChat } from '@/lib/gemini';
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
    timestamp: new Date().toISOString()
}];

export const AiAssistant = ({ isOpen, onClose, initialQuery }: AiAssistantProps) => {
    const [messages, setMessages] = useState<AiMessage[]>(initialMessages);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    useEffect(() => {
        if (isOpen && initialQuery) {
            setInputValue(initialQuery);
            const timer = setTimeout(() => {
                handleSend(initialQuery);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, initialQuery]);

    const handleSend = async (queryOverride?: string) => {
        const textToSend = queryOverride || inputValue;
        if (!textToSend.trim() || isTyping) return;

        const newUserMsg: AiMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: textToSend.trim(),
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const historyForAi = [...messages, newUserMsg].map(m => ({
                role: m.role,
                content: m.content
            }));
            const responseText = await runCRMConsultantChat(historyForAi);
            const botResponse: AiMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, botResponse]);
        } catch (error) {
            console.error('[AiAssistant] chat request failed');
            const errorResponse: AiMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: error instanceof Error
                    ? error.message
                    : 'Não foi possível consultar o assistente agora.',
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, errorResponse]);
        } finally {
            setIsTyping(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                onClick={onClose}
            />

            <div className={cn(
                'fixed top-0 right-0 h-full w-full sm:w-[400px] bg-background shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-border flex flex-col',
                isOpen ? 'translate-x-0' : 'translate-x-full'
            )}>
                <div className="p-4 border-b border-primary bg-primary text-primary-foreground flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-foreground/10 rounded-lg">
                            <Bot className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">Assistente do CRM</h2>
                            <p className="text-xs text-primary-foreground/80">
                                Usa a integração de IA configurada no ambiente
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        size="icon"
                        className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
                        title="Fechar assistente"
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={cn(
                                'max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm',
                                msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-tr-none'
                                    : 'bg-muted text-foreground rounded-tl-none'
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    ))}
                    {isTyping && (
                        <div className="flex justify-start">
                            <div className="bg-muted p-4 rounded-2xl rounded-tl-none flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
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
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Faça uma pergunta sobre suas oportunidades..."
                            className="w-full pr-12 bg-muted/50 border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!inputValue.trim() || isTyping}
                            className="absolute right-2 p-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
                            aria-label="Enviar pergunta"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-muted-foreground mt-2">
                        Respostas de IA podem conter erros. Confirme informações importantes no CRM.
                    </p>
                </div>
            </div>
        </>
    );
};
