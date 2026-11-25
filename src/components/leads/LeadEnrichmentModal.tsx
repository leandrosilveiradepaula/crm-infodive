'use client';

import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useDialogBackgroundInert } from '@/components/ui/useDialogBackgroundInert';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface ResearchResult {
    summary: string;
    tags: string[];
    talking_points: string[];
}

interface LeadEnrichmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEnrich: (data: any) => void;
    initialCompany?: string;
    initialWebsite?: string;
}

export const LeadEnrichmentModal = ({ isOpen, onClose, onEnrich, initialCompany = '', initialWebsite = '' }: LeadEnrichmentModalProps) => {
    const [company, setCompany] = useState(initialCompany);
    const [website, setWebsite] = useState(initialWebsite);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<ResearchResult | null>(null);
    const opener = useRef<HTMLElement | null>(null);
    useDialogBackgroundInert(isOpen);

    const handleResearch = async () => {
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
            toast.success('Sugestões geradas.');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (result) {
            onEnrich(result);
            onClose();
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={open => { if (!open && !loading) onClose(); }}>
            <DialogContent
                showCloseButton={false}
                className="flex w-[calc(100%_-_2rem)] max-w-lg max-h-[90dvh] flex-col gap-0 overflow-hidden bg-card p-0"
                onInteractOutside={event => event.preventDefault()}
                onEscapeKeyDown={event => { if (loading) event.preventDefault(); }}
                onOpenAutoFocus={() => {
                    opener.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
                }}
                onCloseAutoFocus={event => {
                    event.preventDefault();
                    const target = opener.current;
                    if (target?.isConnected) requestAnimationFrame(() => target.focus());
                }}
            >
                <header className="shrink-0 space-y-2 border-b border-border p-4 sm:p-6">
                    <DialogTitle className="leading-snug">Pesquisa comercial</DialogTitle>
                    <DialogDescription>Gere sugestões de abordagem com IA a partir do nome da empresa. Nenhum dado é gravado no lead.</DialogDescription>
                </header>
                <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4 sm:p-6">
                    <p className="text-body-ui leading-relaxed text-foreground">
                        As sugestões usam o conhecimento do modelo, não uma pesquisa verificada na internet. Confira as informações antes de usá-las.
                    </p>
                    {!result ? (
                        <>
                            <div className="space-y-1">
                                <label htmlFor="lead-research-company" className="text-label-ui font-medium">Empresa</label>
                                <Input id="lead-research-company" value={company} onChange={event => setCompany(event.target.value)} disabled={loading} />
                            </div>
                            <div className="space-y-1">
                                <label htmlFor="lead-research-website" className="text-label-ui font-medium">Website (opcional)</label>
                                <Input id="lead-research-website" value={website} onChange={event => setWebsite(event.target.value)} placeholder="exemplo.com.br" disabled={loading} />
                            </div>
                        </>
                    ) : (
                        <>
                            <section className="space-y-2">
                                <h3 className="text-section-title font-semibold">Resumo sugerido</h3>
                                <p className="break-words text-body-ui text-muted-foreground">{result.summary}</p>
                            </section>
                            <section className="space-y-2">
                                <h3 className="text-section-title font-semibold">Setores e tecnologias sugeridos</h3>
                                <div className="flex flex-wrap gap-2">{result.tags?.map((tag, i) => <span key={i} className="break-all rounded-[var(--radius-control)] border border-border bg-surface-subtle px-2 py-1 text-body-ui text-foreground">{tag}</span>)}</div>
                            </section>
                            <section className="space-y-2">
                                <h3 className="text-section-title font-semibold">Pontos de conversa</h3>
                                <ul className="list-disc space-y-2 pl-5 text-body-ui text-foreground">{result.talking_points?.map((point, i) => <li className="break-words" key={i}>{point}</li>)}</ul>
                            </section>
                        </>
                    )}
                </div>
                <footer className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-border p-4 sm:p-6">
                    <Button type="button" variant="outline" onClick={onClose} disabled={loading}>Fechar</Button>
                    {result ? (
                        <>
                            <Button type="button" variant="outline" onClick={() => setResult(null)}>Nova consulta</Button>
                            <Button type="button" onClick={handleApply}>Concluir consulta</Button>
                        </>
                    ) : (
                        <Button type="button" onClick={handleResearch} disabled={loading || !company.trim()}>
                            <Sparkles aria-hidden="true" /> {loading ? 'Gerando sugestões...' : 'Gerar sugestões'}
                        </Button>
                    )}
                </footer>
            </DialogContent>
        </Dialog>
    );
};
