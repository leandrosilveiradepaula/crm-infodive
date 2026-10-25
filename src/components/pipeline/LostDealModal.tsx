
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
            <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity" onClick={onClose} />

            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-scale-in border border-border">
                <div className="px-6 py-5 border-b border-border flex justify-between items-center bg-red-500/5">
                    <div className="flex items-center gap-2">
                        <div className="bg-red-500/20 p-2 rounded-lg">
                            <AlertCircle className="h-5 w-5 text-red-500" />
                        </div>
                        <h3 className="text-foreground font-black text-lg tracking-tight">Marcar como Perdido</h3>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <div className="p-6">
                    <p className="text-sm text-muted-foreground mb-6 font-bold uppercase tracking-widest text-xs">
                        Por que perdemos a oportunidade <span className="text-foreground">{deal.title}</span>?
                        <br />Isso nos ajuda a melhorar nossas vendas.
                    </p>

                    <div className="space-y-4">
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block mb-2 ml-1">Motivo Principal</label>
                        <div className="grid grid-cols-2 gap-2">
                            {LOSS_REASONS.map(reason => (
                                <button
                                    key={reason.id}
                                    onClick={() => setSelectedReason(reason.id)}
                                    className={`
                                        flex items-center gap-2 p-3 rounded-xl border text-xs font-bold uppercase tracking-widest transition-all
                                        ${selectedReason === reason.id
                                            ? 'border-red-500 bg-red-500/10 text-red-500 ring-1 ring-red-500 shadow-lg shadow-red-500/20'
                                            : 'border-border bg-muted/30 hover:border-red-500/30 hover:bg-muted text-muted-foreground'
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
                        <label className="text-xs font-black text-muted-foreground uppercase tracking-widest block ml-1">Observações Adicionais</label>
                        <textarea
                            className="w-full p-4 bg-muted/30 border border-border rounded-2xl focus:border-red-500 outline-none text-sm font-bold text-foreground placeholder:text-muted-foreground min-h-[100px] transition-all"
                            placeholder="Descreva detalhes sobre a perda..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="mt-6 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3.5 bg-muted/30 border border-border text-muted-foreground font-black rounded-2xl hover:bg-muted/50 transition-all uppercase text-xs tracking-widest"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={() => onConfirm(selectedReason, notes)}
                            disabled={!selectedReason}
                            className={`
                                flex-1 py-3.5 text-white font-black rounded-2xl shadow-2xl transition-all flex items-center justify-center gap-2 uppercase text-xs tracking-widest
                                ${selectedReason
                                    ? 'bg-red-600 hover:bg-red-700 shadow-red-500/20'
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
