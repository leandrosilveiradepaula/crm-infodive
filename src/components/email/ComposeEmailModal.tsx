import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, Send, Paperclip } from 'lucide-react';
import { toast } from 'sonner';

interface ComposeEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    replyTo?: { email: string; subject: string };
}

export function ComposeEmailModal({ isOpen, onClose, replyTo }: ComposeEmailModalProps) {
    const [to, setTo] = useState(replyTo?.email || '');
    const [subject, setSubject] = useState(replyTo ? `Re: ${replyTo.subject}` : '');
    const [body, setBody] = useState('');
    const [sending, setSending] = useState(false);

    if (!isOpen) return null;

    const handleSend = async () => {
        if (!to || !subject || !body) {
            toast.error('Preencha os campos obrigatórios (Para, Assunto e Mensagem).');
            return;
        }

        setSending(true);
        try {
            const res = await fetch('/api/email/send', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ to, subject, body }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao enviar email');
            }

            toast.success('Email enviado com sucesso!');
            onClose();
        } catch (error: any) {
            console.error('Error sending email:', error);
            toast.error(error.message);
        } finally {
            setSending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="w-full max-w-2xl bg-card border border-border rounded-xl shadow-lg flex flex-col overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-border bg-muted/20">
                    <h3 className="font-semibold text-lg">Nova Mensagem</h3>
                    <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 rounded-full">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Body */}
                <div className="flex flex-col flex-1 p-0">
                    <div className="flex items-center border-b border-border px-4 py-2">
                        <span className="text-muted-foreground w-16 text-sm">Para:</span>
                        <Input
                            value={to}
                            onChange={(e) => setTo(e.target.value)}
                            className="flex-1 border-0 shadow-none focus-visible:ring-0 px-2"
                            placeholder="email@exemplo.com"
                        />
                    </div>
                    <div className="flex items-center border-b border-border px-4 py-2">
                        <span className="text-muted-foreground w-16 text-sm">Assunto:</span>
                        <Input
                            value={subject}
                            onChange={(e) => setSubject(e.target.value)}
                            className="flex-1 border-0 shadow-none focus-visible:ring-0 px-2"
                            placeholder="Assunto da mensagem"
                        />
                    </div>
                    <Textarea
                        value={body}
                        onChange={(e) => setBody(e.target.value)}
                        className="flex-1 min-h-[300px] border-0 shadow-none focus-visible:ring-0 resize-none p-4 rounded-none"
                        placeholder="Escreva sua mensagem aqui..."
                    />
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between p-4 border-t border-border bg-muted/20">
                    <div>
                        <Button variant="ghost" size="icon" className="text-muted-foreground" title="Anexar arquivo (em breve)">
                            <Paperclip className="h-5 w-5" />
                        </Button>
                    </div>
                    <div className="flex space-x-2">
                        <Button variant="outline" onClick={onClose}>
                            Descartar
                        </Button>
                        <Button onClick={handleSend} disabled={sending}>
                            {sending ? 'Enviando...' : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Enviar
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
