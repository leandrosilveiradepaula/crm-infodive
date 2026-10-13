'use client';

import { useRef, useState, type FormEvent } from 'react';
import { X, FileText } from 'lucide-react';
import type { Contract } from '@/types/contract';
import { persistedContractText } from '@/lib/contract-content';
import { saveContractDraft } from '@/app/(dashboard)/contracts/actions';

interface ContractDraftEditorProps {
    contract: Contract;
    onClose: () => void;
    onSaved: () => void;
}

/** Editing is deliberately draft-only: no simulated signing, PDF or party clauses. */
export function ContractDraftEditor({ contract, onClose, onSaved }: ContractDraftEditorProps) {
    const initialText = persistedContractText(contract.content_json);
    const [title, setTitle] = useState(contract.title);
    const [text, setText] = useState(initialText ?? '');
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inFlight = useRef(false);

    const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        if (inFlight.current) return;
        if (contract.status !== 'draft' || !contract.updatedAt) {
            setError('Este registro não pode ser editado. Recarregue a lista.');
            return;
        }
        if (!title.trim() || title.length > 500 || !text.trim() || text.length > 100000) {
            setError('Informe um título (até 500 caracteres) e texto (até 100.000 caracteres).');
            return;
        }
        inFlight.current = true;
        setSaving(true);
        setError(null);
        try {
            const result = await saveContractDraft(contract.id, title, text, contract.updatedAt);
            if (!result.success) {
                setError(result.error ?? 'Não foi possível salvar o rascunho.');
                return;
            }
            onSaved();
        } catch {
            setError('Erro de comunicação. As alterações não foram confirmadas; tente novamente.');
        } finally {
            inFlight.current = false;
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
            <section role="dialog" aria-modal="true" aria-labelledby="contract-draft-title"
                className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border bg-card p-5 md:p-7 shadow-2xl">
                <header className="flex items-start justify-between gap-4 mb-5">
                    <div>
                        <h2 id="contract-draft-title" className="font-bold text-lg">Editar rascunho</h2>
                        <p className="text-sm text-muted-foreground">Empresa: {contract.company}</p>
                    </div>
                    <button type="button" onClick={onClose} disabled={saving}
                        aria-label="Fechar editor" className="rounded-lg p-2 hover:bg-muted disabled:opacity-40">
                        <X className="h-5 w-5" />
                    </button>
                </header>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <label className="block text-sm font-medium">
                        Título
                        <input aria-label="Título do rascunho" value={title} onChange={event => setTitle(event.target.value)}
                            maxLength={500} required disabled={saving}
                            className="mt-2 w-full rounded-lg border border-border bg-background p-3" />
                    </label>
                    <label className="block text-sm font-medium">
                        Conteúdo do rascunho
                        <textarea aria-label="Conteúdo do rascunho" value={text} onChange={event => setText(event.target.value)}
                            maxLength={100000} rows={12} required disabled={saving}
                            placeholder="Escreva o conteúdo. Nenhuma cláusula é inserida automaticamente."
                            className="mt-2 w-full rounded-lg border border-border bg-background p-3 font-mono text-sm" />
                    </label>
                    {initialText === null && (
                        <p role="status" className="flex gap-2 text-sm text-muted-foreground">
                            <FileText className="h-4 w-4 shrink-0" />
                            Não há texto de documento armazenado neste rascunho. Escreva o conteúdo antes de salvar.
                        </p>
                    )}
                    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
                    <p className="text-xs text-muted-foreground">
                        Somente rascunho. Este editor não envia, assina ou certifica documentos.
                        Se outra pessoa alterar o registro, a gravação será recusada.
                    </p>
                    <footer className="flex justify-end gap-3">
                        <button type="button" disabled={saving} onClick={onClose}
                            className="rounded-lg border border-border px-4 py-2 disabled:opacity-40">Cancelar</button>
                        <button type="submit" disabled={saving || !title.trim() || !text.trim()}
                            className="rounded-lg bg-primary px-5 py-2 text-primary-foreground disabled:opacity-50">
                            {saving ? 'Salvando...' : 'Salvar alterações'}
                        </button>
                    </footer>
                </form>
            </section>
        </div>
    );
}
