
import React, { useState } from 'react';
import { X, AlertCircle } from 'lucide-react';
import type { Deal } from '@/types/deal';

interface LostDealModalProps {
    deal: Deal;
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, notes: string) => void;
}

const LOSS_REASONS = [
    { id: 'price', label: 'Preço / Orçamento', icon: '💰' },
    { id: 'competitor', label: 'Concorrência', icon: '⚔️' },
    { id: 'feature', label: 'Feature / Requisito Técnico', icon: '⚙️' },
    { id: 'timing', label: 'Timing / Projeto Adiado', icon: '⏳' },
    { id: 'ghosted', label: 'Sem Resposta (Ghosting)', icon: '👻' },
    { id: 'other', label: 'Outro Motivo', icon: '📝' }
];

export const LostDealModal: React.FC<LostDealModalProps> = ({ deal, isOpen, onClose, onConfirm }) => {
    const [selectedReason, setSelectedReason] = useState<string>('');
    const [notes, setNotes] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 ds-overlay-backdrop backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div role="dialog" aria-modal="true" aria-label="Registrar perda da oportunidade" className="relative bg-card rounded-[var(--radius-panel)] shadow-overlay-ui w-full max-w-md overflow-hidden transform transition-all animate-scale-in border border-border">
                <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-destructive-subtle">
                    <div className="flex items-center gap-2">
                        <div className="bg-destructive-subtle p-2 rounded-[var(--radius-panel)]">
                            <AlertCircle className="h-5 w-5 text-destructive-readable" />
                        </div>
                        <h3 className="text-foreground font-[var(--ds-type-metric-weight)] ds-type-section-title tracking-tight">Marcar como Perdido</h3>
                    </div>
                    <button aria-label="Fechar registro da perda" onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="ds-type-body text-muted-foreground mb-6 font-[var(--ds-type-control-weight)] uppercase tracking-widest ds-type-metadata">
                        Por que perdemos a oportunidade <span className="text-foreground">{deal.title}</span>?
                        <br />Isso nos ajuda a melhorar nossas vendas.
                    </p>

                    <div className="space-y-4">
                        <label className="ds-type-metadata font-[var(--ds-type-metric-weight)] text-muted-foreground uppercase tracking-widest block mb-2 ml-1">Motivo Principal</label>
                        <div className="grid grid-cols-2 gap-2">
                            {LOSS_REASONS.map(reason => (
                                <button
                                    key={reason.id}
                                    aria-pressed={selectedReason === reason.id} onClick={() => setSelectedReason(reason.id)}
                                    className={`
                                        flex items-center gap-2 p-3 rounded-[var(--radius-panel)] border ds-type-metadata font-[var(--ds-type-control-weight)] uppercase tracking-widest transition-all
                                        ${selectedReason === reason.id
                                            ? 'border-destructive bg-destructive-subtle text-destructive-readable ring-1 ring-destructive shadow-card-ui'
                                            : 'border-border bg-muted/30 hover:border-destructive/30 hover:bg-muted text-muted-foreground'
                                        }
                                    `}
                                >
                                    <span>{reason.icon}</span>
                                    <span>{reason.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mt-8 space-y-2">
                        <label className="ds-type-metadata font-[var(--ds-type-metric-weight)] text-muted-foreground uppercase tracking-widest block ml-1">Observações Adicionais</label>
                        <textarea
                            aria-label="Observações adicionais da perda"
                            className="w-full p-4 bg-muted/30 border border-border rounded-[var(--radius-panel)] focus:border-destructive outline-none ds-type-body font-[var(--ds-type-control-weight)] text-foreground placeholder:text-muted-foreground min-h-[100px] transition-all"
                            placeholder="Descreva detalhes sobre a perda..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 bg-muted/30 border border-border text-muted-foreground font-[var(--ds-type-metric-weight)] rounded-[var(--radius-panel)] hover:bg-muted/50 transition-all uppercase ds-type-metadata tracking-widest"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => onConfirm(selectedReason, notes)}
                            disabled={!selectedReason}
                            className={`
                                flex-1 py-3.5 font-[var(--ds-type-metric-weight)] rounded-[var(--radius-panel)] shadow-overlay-ui transition-all flex items-center justify-center gap-2 uppercase ds-type-metadata tracking-widest
                                ${selectedReason
                                    ? 'bg-destructive text-destructive-foreground hover:bg-destructive/90'
                                    : 'bg-muted/50 text-muted-foreground cursor-not-allowed border border-border'
                                }
                            `}
                        >
                            Confirmar Perda
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
