'use client';
import { useState } from 'react';
import { Sparkles, Loader2, Check, X, Building2, Globe, FileText, Hash, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface LeadEnrichmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialCompany?: string;
    initialWebsite?: string;
}

export const LeadEnrichmentModal = ({ isOpen, onClose, initialCompany = '', initialWebsite = '' }: LeadEnrichmentModalProps) => {
    const [company, setCompany] = useState(initialCompany);
    const [website, setWebsite] = useState(initialWebsite);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<any>(null);

    const handleEnrich = async () => {
        if (!company) {
            toast.error('Informe o nome da empresa');
            return;
        }

        setLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/gemini/enrich', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company, website })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Falha ao enriquecer lead');
            }

            setResult(data);
            toast.success('Lead enriquecido com sucesso!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleCopyInsights = async () => {
        if (!result) return;

        const content = [
            result.summary ? `Resumo: ${result.summary}` : '',
            Array.isArray(result.tags) && result.tags.length ? `Tags: ${result.tags.join(', ')}` : '',
            Array.isArray(result.talking_points) && result.talking_points.length
                ? `Pontos de conversa:\n- ${result.talking_points.join('\n- ')}`
                : ''
        ].filter(Boolean).join('\n\n');

        try {
            await navigator.clipboard.writeText(content);
            toast.success('Insights copiados para a área de transferência.');
        } catch {
            toast.error('Não foi possível copiar os insights.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-card border border-border w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-8 border-b border-border bg-gradient-to-r from-primary/10 via-stage-proposal/5 to-transparent relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-full bg-primary/5 blur-3xl rounded-full -mr-16 pointer-events-none" />
                    <div className="flex items-center justify-between relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-inner">
                                <Sparkles className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h2 className="text-xl font-black text-foreground tracking-tight">Pesquisa de Leads</h2>
                                <p className="text-xs text-primary font-black uppercase tracking-[0.2em] mt-0.5">Análise assistida por IA</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-teal-100 dark:hover:bg-card/5 rounded-full text-muted-foreground hover:text-foreground transition-colors" aria-label="Fechar pesquisa de leads" title="Fechar">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {!result ? (
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Empresa</label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={company}
                                        onChange={(e) => setCompany(e.target.value)}
                                        placeholder="Ex: Lenovo"
                                        className="w-full bg-muted/30 border border-border rounded-xl py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">Website (Opcional)</label>
                                <div className="relative">
                                    <Globe className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <input
                                        type="text"
                                        value={website}
                                        onChange={(e) => setWebsite(e.target.value)}
                                        placeholder="Ex: lenovo.com"
                                        className="w-full bg-muted/30 border border-border rounded-xl py-3 pl-10 pr-4 text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all font-bold"
                                    />
                                </div>
                            </div>

                            <button
                                onClick={handleEnrich}
                                disabled={loading || !company}
                                className="w-full py-4 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary/20 uppercase text-xs tracking-widest active:scale-95"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Pesquisando...
                                    </>
                                ) : (
                                    <>
                                        <Sparkles className="h-4 w-4 fill-white/20" />
                                        Enriquecer Dados
                                    </>
                                )}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* Summary Section */}
                            <div className="bg-muted/30 p-4 rounded-xl border border-border">
                                <h3 className="flex items-center gap-2 text-xs font-black text-foreground mb-2 uppercase tracking-widest">
                                    <FileText className="h-4 w-4 text-primary" />
                                    Resumo Executivo
                                </h3>
                                <p className="text-sm text-muted-foreground leading-relaxed bg-background p-3 rounded-lg border border-border">
                                    {result.summary}
                                </p>
                            </div>

                            {/* Tags Section */}
                            <div>
                                <h3 className="flex items-center gap-2 text-xs font-black text-foreground mb-3 uppercase tracking-widest">
                                    <Hash className="h-4 w-4 text-stage-proposal" />
                                    Principais Tecnologias / Setores
                                </h3>
                                <div className="flex flex-wrap gap-2">
                                    {result.tags?.map((tag: string, i: number) => (
                                        <span key={i} className="px-3 py-1.5 bg-stage-proposal/10 text-stage-proposal text-xs font-black uppercase tracking-wider rounded-lg border border-stage-proposal/20">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Talking Points Section */}
                            <div>
                                <h3 className="flex items-center gap-2 text-xs font-black text-foreground mb-3 uppercase tracking-widest">
                                    <MessageSquare className="h-4 w-4 text-success" />
                                    Pontos de Conversa (Ice Breakers)
                                </h3>
                                <ul className="space-y-2">
                                    {result.talking_points?.map((point: string, i: number) => (
                                        <li key={i} className="flex gap-3 text-sm text-muted-foreground bg-muted/30 p-4 rounded-2xl border border-border font-medium">
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-success/10 text-success flex items-center justify-center text-xs font-black border border-success/20">
                                                {i + 1}
                                            </span>
                                            {point}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {result && (
                    <div className="p-4 border-t border-border bg-muted/30 flex gap-3">
                        <button
                            onClick={() => setResult(null)}
                            className="flex-1 py-3 text-muted-foreground font-bold hover:text-foreground hover:bg-muted rounded-xl transition-all uppercase text-xs tracking-wider"
                        >
                            Voltar
                        </button>
                        <button
                                                            onClick={handleCopyInsights}
                                                            className="flex-1 py-4 bg-primary text-white font-black rounded-xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 flex items-center justify-center gap-2 uppercase text-xs tracking-[0.2em] active:scale-95"
                                                        >
                                                            <Check className="h-4 w-4" />
                                                            Copiar Insights
                                                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
