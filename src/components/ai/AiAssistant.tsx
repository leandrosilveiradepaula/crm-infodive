import { useState, useRef, useEffect } from 'react';
import { Bot, Send, X, Sparkles, TrendingUp, AlertTriangle, ChevronRight, Loader2 } from 'lucide-react';
import { mockAiHistory, mockInsights, type AiMessage } from '@/data/mockAiData';
import { useDeals } from '@/hooks/useDeals';
import { runCRMConsultantChat } from '@/lib/gemini';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface AiAssistantProps {
    isOpen: boolean;
    onClose: () => void;
    initialQuery?: string | null;
}

export const AiAssistant = ({ isOpen, onClose, initialQuery }: AiAssistantProps) => {
    const { deals, loading } = useDeals();
    const [messages, setMessages] = useState<AiMessage[]>(mockAiHistory);
    const [inputValue, setInputValue] = useState('');
    const [isTyping, setIsTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isOpen]);

    // Handle Initial Query from Command Bar
    useEffect(() => {
        if (isOpen && initialQuery) {
            setInputValue(initialQuery);
            // Small timeout to allow state update before sending
            const timer = setTimeout(() => {
                handleSend(initialQuery);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [isOpen, initialQuery]);

    const buildContext = () => {
        if (!deals || deals.length === 0) return "Nenhum deal encontrado no CRM.";
        const dealContext = deals.slice(0, 15).map(d =>
            `- Deal: **${d.title}** (${d.company})\n  Valor: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(d.value)}\n  Estágio: ${d.stage}\n  Probabilidade: ${d.probability}%\n  Dias no estágio: ${d.days_in_stage}\n  Fechamento: ${d.expected_close_date || 'N/A'}`
        ).join('\n');

        return `TOTAL DE DEALS: ${deals.length}\nVALOR TOTAL NO PIPELINE: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deals.reduce((acc, d) => acc + d.value, 0))}\n\nLISTA DE DEALS RECENTES:\n${dealContext}`;
    };

    const handleSend = async (queryOverride?: string) => {
        const textToSend = queryOverride || inputValue;
        if (!textToSend.trim()) return;

        const newUserMsg: AiMessage = {
            id: Date.now().toString(),
            role: 'user',
            content: textToSend,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, newUserMsg]);
        setInputValue('');
        setIsTyping(true);

        try {
            const context = buildContext();

            // Format history for the AI function (remove IDs and timestamps)
            const historyForAi = messages.map(m => ({ role: m.role, content: m.content }));

            const responseText = await runCRMConsultantChat([...historyForAi, { role: 'user', content: newUserMsg.content }], context);

            const botResponse: AiMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: responseText,
                timestamp: new Date().toISOString()
            };
            setMessages(prev => [...prev, botResponse]);
        } catch (error) {
            console.error("Erro no chat AI:", error);
            const errorResponse: AiMessage = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: "Desculpe, tive um problema ao analisar seus dados. Tente novamente em instantes.",
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
            {/* Backdrop for mobile */}
            <div
                className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className={cn(
                "fixed top-0 right-0 h-full w-full sm:w-[400px] bg-background shadow-2xl z-50 transform transition-transform duration-300 ease-in-out border-l border-border flex flex-col",
                isOpen ? 'translate-x-0' : 'translate-x-full'
            )}>
                {/* Header */}
                <div className="p-4 border-b border-primary bg-primary text-primary-foreground flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-foreground/10 rounded-lg">
                            <Bot className="h-6 w-6 text-primary-foreground" />
                        </div>
                        <div>
                            <h2 className="font-bold text-lg">IBM Watson AI</h2>
                            <p className="text-xs text-primary-foreground/80 flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                                Online e pronto para ajudar
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={onClose}
                        variant="ghost"
                        size="icon"
                        className="text-primary-foreground hover:text-primary-foreground hover:bg-primary-foreground/10"
                        title="Fechar Watson AI"
                    >
                        <X className="h-6 w-6" />
                    </Button>
                </div>

                {/* Insights Section */}
                <div className="p-4 bg-muted/30 border-b border-border">
                    <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3 flex items-center gap-2">
                        <Sparkles className="h-3 w-3 text-primary" />
                        Insights Prioritários
                    </h3>
                    <div className="space-y-3">
                        {mockInsights.map(insight => (
                            <div key={insight.id} className="bg-card p-3 rounded-lg border border-border shadow-sm hover:shadow-md transition-shadow cursor-pointer group">
                                <div className="flex justify-between items-start mb-1">
                                    <div className="flex items-center gap-2">
                                        {insight.type === 'opportunity' && <TrendingUp className="h-4 w-4 text-emerald-500" />}
                                        {insight.type === 'risk' && <AlertTriangle className="h-4 w-4 text-destructive" />}
                                        <span className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">
                                            {insight.title}
                                        </span>
                                    </div>
                                    {insight.score && (
                                        <span className={cn(
                                            "text-xs font-bold px-1.5 py-0.5 rounded",
                                            insight.score > 70 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-destructive/10 text-destructive'
                                        )}>
                                            {insight.score}
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    {insight.description}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-background">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={cn(
                                "max-w-[85%] p-3 rounded-2xl text-sm leading-relaxed shadow-sm",
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

                {/* Input Area */}
                <div className="p-4 border-t border-border bg-background">
                    <div className="relative flex items-center">
                        <Input
                            type="text"
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Faça uma pergunta sobre seus leads..."
                            className="w-full pr-12 bg-muted/50 border-input focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground"
                        />
                        <button
                            onClick={() => handleSend()}
                            disabled={!inputValue.trim() || isTyping}
                            className="absolute right-2 p-1.5 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary transition-colors"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                    <p className="text-center text-[10px] text-muted-foreground mt-2">
                        O Watson AI pode cometer erros. Verifique informações importantes.
                    </p>
                </div>
            </div>
        </>
    );
};
