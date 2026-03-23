'use client';
import React, { useState, useEffect } from 'react';
import {
    MessageCircle,
    Mail,
    Phone,
    Linkedin,
    Send,
    Paperclip,
    Check,
    CheckCheck,
    Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
    id: string;
    type: 'whatsapp' | 'email' | 'linkedin' | 'note';
    direction: 'inbound' | 'outbound';
    content: string;
    timestamp: Date;
    senderName?: string;
    details?: string; // e.g. "Sent to client@ibm.com"
}

export const SmartTimeline: React.FC<{ dealId: string }> = ({ dealId }) => {
    const [filter, setFilter] = useState<'all' | 'whatsapp' | 'email'>('all');
    const [messages, setMessages] = useState<Message[]>([
        // Mock Data for Demo
        {
            id: '1',
            type: 'email',
            direction: 'outbound',
            content: 'Enviada proposta comercial v2 para revisão. Aguardamos feedback até a próxima terça-feira.',
            timestamp: new Date(Date.now() - 86400000 * 2), // 2 days ago
            senderName: 'Leandro Silveira',
            details: 'Assunto: Proposta Lenovo ISG - Revisão v2'
        },
        {
            id: '2',
            type: 'whatsapp',
            direction: 'inbound',
            content: 'Oi Leandro, recebi a proposta. O valor do Storage ficou um pouco acima, conseguimos ajustar?',
            timestamp: new Date(Date.now() - 3600000 * 4), // 4 hours ago
            senderName: 'Marcos (CTO)',
        },
        {
            id: '3',
            type: 'whatsapp',
            direction: 'outbound',
            content: 'Vou verificar com o time de pricing agora mesmo e te retorno Marcos. Segura as pontas!',
            timestamp: new Date(Date.now() - 3600000 * 3.5),
            senderName: 'Leandro Silveira',
        }
    ]);
    const [newMessage, setNewMessage] = useState('');

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'whatsapp': return <MessageCircle className="h-4 w-4" />;
            case 'email': return <Mail className="h-4 w-4" />;
            case 'linkedin': return <Linkedin className="h-4 w-4" />;
            default: return <Clock className="h-4 w-4" />;
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'whatsapp': return 'bg-green-500';
            case 'email': return 'bg-blue-500';
            case 'linkedin': return 'bg-primary/90';
            default: return 'bg-gray-500';
        }
    };

    const handleSend = () => {
        if (!newMessage.trim()) return;
        const msg: Message = {
            id: Date.now().toString(),
            type: 'whatsapp', // Default for "Quick Reply"
            direction: 'outbound',
            content: newMessage,
            timestamp: new Date(),
            senderName: 'Leandro Silveira'
        };
        setMessages([...messages, msg]);
        setNewMessage('');
    };

    const filteredMessages = messages.filter(m => filter === 'all' || m.type === filter);

    return (
        <div className="flex flex-col h-[600px] bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
            {/* Header / Tabs */}
            <div className="flex items-center justify-between p-5 border-b border-border bg-gradient-to-r from-gray-50 to-white">
                <h3 className="font-bold text-foreground flex items-center gap-2">
                    <Clock className="h-4 w-4 text-primary" />
                    Timeline Inteligente
                </h3>
                <div className="flex bg-muted/50 p-1 rounded-lg border border-border">
                    {['all', 'whatsapp', 'email'].map(t => (
                        <button
                            key={t}
                            onClick={() => setFilter(t as any)}
                            className={`px-4 py-1.5 text-xs font-bold rounded-md capitalize transition-all ${filter === t
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            {t === 'all' ? 'Todos' : t}
                        </button>
                    ))}
                </div>
            </div>

            {/* Message Stream */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-muted/50">
                <AnimatePresence initial={false}>
                    {filteredMessages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${msg.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[80%] flex gap-3 ${msg.direction === 'outbound' ? 'flex-row-reverse' : 'flex-row'}`}>
                                {/* Avatar/Icon */}
                                <div className={`flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-white shadow-md ${getTypeColor(msg.type)}`}>
                                    {getTypeIcon(msg.type)}
                                </div>

                                {/* Bubble */}
                                <div className={`flex flex-col ${msg.direction === 'outbound' ? 'items-end' : 'items-start'}`}>
                                    <div className={`
                                        p-4 rounded-2xl text-sm relative shadow-sm
                                        ${msg.direction === 'outbound'
                                            ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                            : 'bg-card text-card-foreground border border-border rounded-tl-sm'}
                                    `}>
                                        <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>

                                        {msg.details && (
                                            <div className="mt-2 pt-2 border-t border-border text-[10px] opacity-70">
                                                {msg.details}
                                            </div>
                                        )}
                                    </div>

                                    {/* Meta */}
                                    <div className="flex items-center gap-2 mt-1.5 px-1">
                                        <span className="text-[10px] text-muted-foreground font-medium">
                                            {msg.senderName} • {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                        {msg.direction === 'outbound' && (
                                            <CheckCheck className="h-3 w-3 text-primary" />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>

            {/* Input Area */}
            <div className="p-4 bg-card border-t border-border">
                <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Responder via:</span>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-600 dark:text-green-400 rounded-lg text-[10px] font-bold border border-green-200 dark:border-green-500/20 hover:bg-green-500/20 transition-colors">
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                    </button>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 text-primary dark:text-blue-400 rounded-lg text-[10px] font-bold border border-blue-200 dark:border-blue-500/20 hover:bg-blue-500/20 transition-colors">
                        <Mail className="h-3 w-3" /> Email
                    </button>
                </div>
                <div className="relative">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                        placeholder="Digite sua mensagem..."
                        className="w-full bg-muted border border-border rounded-xl pl-4 pr-12 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                        rows={2}
                    />
                    <div className="absolute right-2 bottom-2 flex gap-1">
                        <button className="p-2 text-muted-foreground hover:text-foreground transition-colors rounded-lg hover:bg-muted">
                            <Paperclip className="h-4 w-4" />
                        </button>
                        <button
                            onClick={handleSend}
                            className="p-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors shadow-sm"
                        >
                            <Send className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
