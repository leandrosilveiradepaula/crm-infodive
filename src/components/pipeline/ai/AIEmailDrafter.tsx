
import { useState } from 'react';
import { Mail, Sparkles, Copy, Check, Loader2, X } from 'lucide-react';
import { generateFollowUpEmail } from '@/lib/gemini';
import type { Deal } from '@/types/deal';

interface AIEmailDrafterProps {
    deal: Deal;
    onClose: () => void;
}

export const AIEmailDrafter = ({ deal, onClose }: AIEmailDrafterProps) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [copied, setCopied] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        try {
            setLoading(true);
            setError(null);
            const generatedEmail = await generateFollowUpEmail(deal);
            setEmail(generatedEmail);
        } catch (err: any) {
            setError(err.message || 'Erro ao gerar email');
        } finally {
            setLoading(false);
        }
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(email);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-[70] p-4">
            <div className="bg-card rounded-[40px] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col border border-border animate-in zoom-in-95 duration-300">
                {/* Header */}
                <div className="p-8 border-b border-border flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600">
                    <div className="flex items-center gap-5">
                        <div className="w-14 h-14 rounded-2xl bg-card/20 flex items-center justify-center backdrop-blur-xl border border-white/20 shadow-2xl">
                            <Sparkles className="h-7 w-7 text-white animate-pulse" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">AI Email Drafter</h2>
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mt-1">Inteligência Artificial Generativa</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-12 w-12 rounded-2xl bg-card/10 flex items-center justify-center text-white/80 hover:text-white hover:bg-card/20 transition-all border border-white/10"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-10 custom-scrollbar bg-background">
                    {!email && !loading && (
                        <div className="flex flex-col items-center justify-center h-full text-center py-20 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="relative mb-10">
                                <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full scale-150 animate-pulse"></div>
                                <div className="w-24 h-24 rounded-[32px] bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center relative z-10 shadow-2xl">
                                    <Mail className="h-10 w-10 text-white" />
                                </div>
                            </div>
                            <h3 className="text-2xl font-black text-foreground mb-3 uppercase tracking-tighter">Gere um Email de Follow-up</h3>
                            <p className="text-sm text-muted-foreground max-w-md mb-10 leading-relaxed font-bold">
                                Nossa IA analisará o status atual da oportunidade para <strong>{deal.company}</strong> e criará uma abordagem altamente persuasiva.
                            </p>
                            <button
                                onClick={handleGenerate}
                                className="px-10 py-4 bg-foreground text-card rounded-[20px] font-black text-xs uppercase tracking-[0.2em] hover:bg-primary hover:text-white transition-all flex items-center gap-3 shadow-[0_20px_40px_rgba(0,0,0,0.3)] hover:-translate-y-1 active:translate-y-0"
                            >
                                <Sparkles className="h-4 w-4" />
                                Iniciar Geração IA
                            </button>
                        </div>
                    )}

                    {loading && (
                        <div className="flex flex-col items-center justify-center h-full py-20 text-center animate-in fade-in duration-300">
                            <div className="relative mb-8">
                                <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full animate-ping"></div>
                                <Loader2 className="h-16 w-16 text-primary animate-spin relative z-10" />
                            </div>
                            <p className="text-lg font-black text-foreground uppercase tracking-widest mb-2">Compondo Mensagem...</p>
                            <p className="text-[11px] text-muted-foreground uppercase font-black tracking-widest">Otimizando gatilhos mentais e tom de voz</p>
                        </div>
                    )}

                    {error && (
                        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-[24px] text-rose-300 text-sm flex items-start gap-4 animate-in shake duration-500">
                            <X className="h-5 w-5 mt-0.5 flex-shrink-0" />
                            <div>
                                <p className="font-black text-white uppercase tracking-tighter mb-1">Erro na Geração</p>
                                <p className="opacity-80">{error}</p>
                            </div>
                        </div>
                    )}

                    {email && !loading && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-primary rounded-full"></div>
                                    <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Conteúdo Sugerido</label>
                                </div>
                                <button
                                    onClick={handleCopy}
                                    className="flex items-center gap-2 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-primary hover:bg-primary/10 rounded-xl transition-all border border-primary/20"
                                >
                                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                    {copied ? 'Copiado!' : 'Copiar Texto'}
                                </button>
                            </div>
                            <div className="relative group">
                                <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-600/20 to-transparent rounded-[32px] blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                                <textarea
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full h-[350px] p-8 bg-card border border-border rounded-[32px] focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none font-sans text-sm text-foreground leading-relaxed shadow-2xl relative z-10"
                                    placeholder="O email gerado aparecerá aqui..."
                                />
                            </div>
                            <div className="flex items-center gap-3 px-4 py-3 bg-muted/10 rounded-2xl border border-border">
                                <div className="p-1.5 bg-primary/10 rounded-lg">
                                    <Sparkles className="h-4 w-4 text-primary" />
                                </div>
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                    Dica: Refine o texto para alinhar com sua proximidade ao stakeholder.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {email && !loading && (
                    <div className="p-8 border-t border-border bg-card flex items-center justify-between gap-6">
                        <button
                            onClick={handleGenerate}
                            className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-2xl transition-all border border-border"
                        >
                            Refazer com IA
                        </button>
                        <div className="flex gap-4">
                            <button
                                onClick={onClose}
                                className="px-8 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all underline underline-offset-8 decoration-border"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCopy}
                                className="px-10 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-[0_15px_30px_rgba(0,102,255,0.3)] hover:-translate-y-1 active:translate-y-0 flex items-center gap-3"
                            >
                                <Copy className="h-4 w-4" /> Copiar para o Clipboard
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
