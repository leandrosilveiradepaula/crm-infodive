import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, FileText, ChevronDown, Trash2 } from 'lucide-react';
import type { Activity, ActivityType, ActivityPriority } from '@/types/activity';
import { getAccountsDropdown, getDealsDropdown } from '../actions';
import { ThemeInput, ThemeSelect, ThemeLabel } from '@/components/ui/theme/ThemeComponents';

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (activity: any) => Promise<any>;
    onDelete?: (id: string) => Promise<any>;
    activity?: Activity | null;
}

const INITIAL_ACTIVITY: Partial<Activity> = {
    title: '',
    description: '',
    type: 'task',
    status: 'pending',
    priority: 'medium',
    dueDate: new Date().toISOString().split('T')[0],
    dueTime: '09:00',
    assignedTo: 'Admin',
};

export const ActivityModal = ({ isOpen, onClose, onSave, onDelete, activity }: ActivityModalProps) => {
    const [accounts, setAccounts] = useState<any[]>([]);
    const [deals, setDeals] = useState<any[]>([]);
    const [formData, setFormData] = useState<Partial<Activity>>(INITIAL_ACTIVITY);
    const [isSaving, setIsSaving] = useState(false);

    // Fetch dropdown data
    useEffect(() => {
        if (isOpen) {
            getAccountsDropdown().then(data => setAccounts(data));
            getDealsDropdown().then(data => setDeals(data));
        }
    }, [isOpen]);

    useEffect(() => {
        if (activity) {
            setFormData(activity);
        } else {
            setFormData(INITIAL_ACTIVITY);
        }
    }, [activity, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            await onSave(formData);
            onClose();
        } catch (err) {
            console.error('Error saving activity:', err);
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-card rounded-3xl w-full max-w-2xl overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300 border border-border">
                {/* Header with Gradient */}
                <div className="bg-gradient-to-r from-primary to-stage-proposal px-8 py-6 flex items-center justify-between border-b border-border/10">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                            {activity ? 'Editar Atividade' : 'Nova Atividade'}
                        </h2>
                        <p className="text-white/80 text-[10px] mt-1 font-black uppercase tracking-[0.2em]">
                            {activity ? 'Visualizar e editar detalhes' : 'Agendar nova tarefa ou reunião'}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 bg-card/10 hover:bg-card/20 rounded-xl transition-all text-white border border-white/10"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* Title */}
                    <div className="space-y-1">
                        <ThemeLabel>Título da Atividade</ThemeLabel>
                        <ThemeInput
                            required
                            placeholder="Ex: Reunião de Alinhamento, Follow-up..."
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                            className="text-lg font-bold"
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Type */}
                        <div className="space-y-1">
                            <ThemeLabel>Tipo</ThemeLabel>
                            <ThemeSelect
                                value={formData.type}
                                onChange={e => setFormData({ ...formData, type: e.target.value as ActivityType })}
                            >
                                <option value="task">Tarefa</option>
                                <option value="meeting">Reunião</option>
                                <option value="call">Ligação</option>
                                <option value="email">Email</option>
                                <option value="note">Nota</option>
                            </ThemeSelect>
                        </div>

                        {/* Priority */}
                        <div className="space-y-1">
                            <ThemeLabel>Prioridade</ThemeLabel>
                            <ThemeSelect
                                value={formData.priority}
                                onChange={e => setFormData({ ...formData, priority: e.target.value as ActivityPriority })}
                            >
                                <option value="low">Baixa</option>
                                <option value="medium">Média</option>
                                <option value="high">Alta</option>
                                <option value="urgent">Urgente 🔥</option>
                            </ThemeSelect>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Due Date */}
                        <div className="space-y-1">
                            <ThemeLabel>Data</ThemeLabel>
                            <ThemeInput
                                type="date"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>

                        {/* Due Time */}
                        <div className="space-y-1">
                            <ThemeLabel>Horário</ThemeLabel>
                            <ThemeInput
                                type="time"
                                value={formData.dueTime}
                                onChange={e => setFormData({ ...formData, dueTime: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Linking Section */}
                    <div className="bg-accent/30 p-6 rounded-3xl space-y-4 border border-border/50">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                            <Users className="h-4 w-4" /> Vincular Registro
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Account Link */}
                            <div className="space-y-1">
                                <ThemeLabel>Cliente</ThemeLabel>
                                <ThemeSelect
                                    value={(formData as any).customerId || ''}
                                    onChange={e => setFormData({ ...formData, customerId: e.target.value } as any)}
                                >
                                    <option value="">Nenhum Cliente</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </ThemeSelect>
                            </div>

                            {/* Deal Link */}
                            <div className="space-y-1">
                                <ThemeLabel>Oportunidade (Deal)</ThemeLabel>
                                <ThemeSelect
                                    value={(formData as any).dealId || ''}
                                    onChange={e => setFormData({ ...formData, dealId: e.target.value } as any)}
                                >
                                    <option value="">Nenhum Deal</option>
                                    {deals.map(deal => (
                                        <option key={deal.id} value={deal.id}>{deal.title}</option>
                                    ))}
                                </ThemeSelect>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-1">
                        <ThemeLabel>Descrição / Notas</ThemeLabel>
                        <textarea
                            rows={3}
                            className="w-full px-5 py-3.5 bg-muted/30 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground resize-none text-[13px] font-bold"
                            placeholder="Adicione detalhes, observações ou próximos passos..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Location (optional) */}
                    {formData.type === 'meeting' && (
                        <div className="space-y-1">
                            <ThemeLabel>Local / Link da Reunião</ThemeLabel>
                            <ThemeInput
                                placeholder="Endereço ou link (Meet, Zoom, Teams)"
                                value={(formData as any).location || ''}
                                onChange={e => setFormData({ ...formData, location: e.target.value } as any)}
                            />
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-border/10 flex items-center justify-between bg-card">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-muted-foreground font-bold hover:text-white transition-all"
                    >
                        Descartar
                    </button>
                    <div className="flex gap-3">
                        {activity && (
                            <button
                                type="button"
                                onClick={() => {
                                    if (confirm('Deseja realmente excluir esta atividade?')) {
                                        onDelete?.(activity.id);
                                        onClose();
                                    }
                                }}
                                className="px-6 py-3 text-red-400 font-bold hover:bg-red-500/10 rounded-2xl border border-red-500/20 transition-all flex items-center"
                            >
                                <Trash2 className="h-5 w-5 mr-2" />
                                Excluir
                            </button>
                        )}
                        <button
                            onClick={handleSubmit}
                            disabled={isSaving || !formData.title}
                            className="px-8 py-3 bg-primary text-white font-bold rounded-2xl hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/20"
                        >
                            {isSaving ? 'Salvando...' : activity ? 'Salvar Tudo' : 'Criar Atividade'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
