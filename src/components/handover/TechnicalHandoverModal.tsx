
import React, { useEffect, useState, useContext } from 'react';
import { useHandover, type Handover } from '@/hooks/useHandover';
import {
    X,
    CheckSquare,
    FileText,
    Save,
    CheckCircle2,
    Download
} from 'lucide-react';
import type { Deal } from '@/types/deal';
import { generateAcceptanceTermPDF } from '@/utils/pdfGenerator';
import { AuthContext } from '@/components/providers/AuthProvider';

interface TechnicalHandoverModalProps {
    deal: Deal;
    onClose: () => void;
}

export const TechnicalHandoverModal: React.FC<TechnicalHandoverModalProps> = ({ deal, onClose }) => {
    const { fetchHandover, createHandover, updateHandover, loading } = useHandover();
    const { profile, user } = useContext(AuthContext);
    const userEmail = profile?.email || user?.email || undefined;

    const [handover, setHandover] = useState<Handover | null>(null);
    const [checklist, setChecklist] = useState<Record<string, boolean>>({
        'licenses_generated': false,
        'hardware_shipped': false,
        'access_credentials_created': false,
        'onboarding_scheduled': false,
        'documentation_sent': false
    });

    useEffect(() => {
        loadHandover();
    }, [deal.id]);

    const loadHandover = async () => {
        const data = await fetchHandover(deal.id);
        if (data) {
            setHandover(data);
            setChecklist(prev => ({ ...prev, ...(data.checklist_data || {}) }));
        }
    };

    const handleCreateHandover = async () => {
        const newHandover = await createHandover({
            deal_id: deal.id,
            status: 'pending',
            checklist_data: checklist
        });
        if (newHandover) setHandover(newHandover);
    };

    const handleSave = async () => {
        if (!handover) return;

        // Check if all items are done to auto-complete
        const allDone = Object.values(checklist).every(v => v);
        const status = allDone ? 'completed' : 'in_progress';
        const completedAt = allDone && !handover.completed_at ? new Date().toISOString() : handover.completed_at;

        await updateHandover(handover.id, {
            checklist_data: checklist,
            status,
            completed_at: completedAt
        });
        onClose();
    };

    const toggleCheckItem = (key: string) => {
        setChecklist(prev => ({ ...prev, [key]: !prev[key] }));
    };

    const checklistItems = [
        { key: 'licenses_generated', label: 'Licenças Geradas' },
        { key: 'hardware_shipped', label: 'Hardware Enviado / Entregue' },
        { key: 'access_credentials_created', label: 'Credenciais de Acesso Criadas' },
        { key: 'onboarding_scheduled', label: 'Onboarding Agendado' },
        { key: 'documentation_sent', label: 'Documentação Técnica Enviada' }
    ];

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
            <div className="bg-card border border-border rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-6 border-b border-border bg-muted/50">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-500/10 rounded-xl">
                            <CheckSquare className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-foreground">Handover Técnico</h2>
                            <p className="text-sm text-muted-foreground">
                                {deal.title} • {deal.company}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-muted rounded-lg transition-colors text-muted-foreground hover:text-foreground">
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-8">
                    {!handover ? (
                        <div className="text-center py-12">
                            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                            <h3 className="text-lg font-medium text-foreground mb-2">Iniciar Processo de Handover</h3>
                            <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                Este processo criará um checklist técnico para acompanhar a entrega do projeto.
                            </p>
                            <button
                                onClick={handleCreateHandover}
                                disabled={loading}
                                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
                            >
                                {loading ? 'Criando...' : 'Iniciar Handover'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            <div>
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Checklist de Entrega</h3>
                                <div className="space-y-3">
                                    {checklistItems.map(item => (
                                        <div
                                            key={item.key}
                                            onClick={() => toggleCheckItem(item.key)}
                                            className={`
                                                flex items-center p-4 rounded-xl border transition-all cursor-pointer select-none
                                                ${checklist[item.key]
                                                    ? 'bg-emerald-500/10 border-emerald-500/50'
                                                    : 'bg-card border-border hover:border-border/80 hover:bg-muted/50'
                                                }
                                            `}
                                        >
                                            <div className={`
                                                h-6 w-6 rounded-lg border-2 flex items-center justify-center mr-4 transition-colors
                                                ${checklist[item.key]
                                                    ? 'bg-emerald-500 border-emerald-500 text-white'
                                                    : 'border-muted-foreground/30'
                                                }
                                            `}>
                                                {checklist[item.key] && <CheckCircle2 className="h-4 w-4" />}
                                            </div>
                                            <span className={`font-medium ${checklist[item.key] ? 'text-foreground' : 'text-muted-foreground'}`}>
                                                {item.label}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-muted/30 rounded-xl p-6 border border-border">
                                <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">Documentação</h3>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-foreground font-medium">Termo de Aceite</p>
                                        <p className="text-sm text-muted-foreground">Gere o documento para assinatura do cliente</p>
                                    </div>
                                    <button
                                        onClick={() => generateAcceptanceTermPDF({
                                            dealTitle: deal.title,
                                            customerName: deal.company || 'Cliente',
                                            items: (deal.deal_products || []).map(p => ({
                                                name: p.name,
                                                quantity: p.quantity,
                                                description: p.description
                                            })),
                                            date: new Date().toLocaleDateString(),
                                            checklist: checklist,
                                            technicalLeadName: userEmail || 'Técnico Responsável'
                                        })}
                                        className="flex items-center gap-2 px-4 py-2 bg-background hover:bg-muted border border-border rounded-lg text-sm text-foreground transition-colors"
                                    >
                                        <Download className="h-4 w-4" />
                                        Baixar PDF
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {handover && (
                    <div className="p-6 border-t border-border bg-muted/50 flex justify-end gap-3">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
                        >
                            <Save className="h-4 w-4" />
                            Salvar Progresso
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

