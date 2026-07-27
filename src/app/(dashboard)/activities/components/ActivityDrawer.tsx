'use client';

import { useState, useEffect } from 'react';
import { X, Calendar, Clock, MapPin, Users, FileText, ChevronDown, Trash2 } from 'lucide-react';
import type { Activity, ActivityType, ActivityPriority } from '@/types/activity';
import { getAccountsDropdown, getDealsDropdown } from '../actions';
import { ThemeInput, ThemeSelect, ThemeLabel } from '@/components/ui/theme/ThemeComponents';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';

interface ActivityDrawerProps {
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

export const ActivityDrawer = ({ isOpen, onClose, onSave, onDelete, activity }: ActivityDrawerProps) => {
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

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="w-full sm:max-w-[450px] flex flex-col p-0 gap-0"
            >
                {/* Header with Gradient */}
                <div className="bg-gradient-to-r from-primary to-stage-proposal px-6 py-5 flex items-center justify-between border-b border-border/10 shrink-0">
                    <div>
                        <SheetTitle className="text-xl font-black text-white tracking-tight">
                            {activity ? 'Editar Atividade' : 'Nova Atividade'}
                        </SheetTitle>
                        <SheetDescription className="text-white/80 text-[9px] mt-0.5 font-black uppercase tracking-[0.2em]">
                            {activity ? 'Visualizar e editar detalhes' : 'Agendar nova tarefa ou reunião'}
                        </SheetDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="h-8 w-8 bg-white/10 hover:bg-white/20 rounded-xl transition-all text-white border border-white/10 shrink-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {/* Form Content */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-5">
                        {/* Title */}
                        <div className="space-y-1">
                            <ThemeLabel>Título da Atividade</ThemeLabel>
                            <ThemeInput
                                required
                                placeholder="Ex: Reunião de Alinhamento, Follow-up..."
                                value={formData.title}
                                onChange={e => setFormData({ ...formData, title: e.target.value })}
                                className="text-base font-bold h-10"
                            />
                        </div>

                        {/* Type & Priority */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <ThemeLabel>Tipo</ThemeLabel>
                                <ThemeSelect
                                    value={formData.type}
                                    onChange={e => setFormData({ ...formData, type: e.target.value as ActivityType })}
                                    className="h-10 text-xs"
                                >
                                    <option value="task">Tarefa</option>
                                    <option value="meeting">Reunião</option>
                                    <option value="call">Ligação</option>
                                    <option value="email">Email</option>
                                    <option value="note">Nota</option>
                                </ThemeSelect>
                            </div>

                            <div className="space-y-1">
                                <ThemeLabel>Prioridade</ThemeLabel>
                                <ThemeSelect
                                    value={formData.priority}
                                    onChange={e => setFormData({ ...formData, priority: e.target.value as ActivityPriority })}
                                    className="h-10 text-xs"
                                >
                                    <option value="low">Baixa</option>
                                    <option value="medium">Média</option>
                                    <option value="high">Alta</option>
                                    <option value="urgent">Urgente 🔥</option>
                                </ThemeSelect>
                            </div>
                        </div>

                        {/* Due Date & Time */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <ThemeLabel>Data</ThemeLabel>
                                <ThemeInput
                                    type="date"
                                    value={formData.dueDate}
                                    onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                                    className="h-10 text-xs"
                                />
                            </div>

                            <div className="space-y-1">
                                <ThemeLabel>Horário</ThemeLabel>
                                <ThemeInput
                                    type="time"
                                    value={formData.dueTime}
                                    onChange={e => setFormData({ ...formData, dueTime: e.target.value })}
                                    className="h-10 text-xs"
                                />
                            </div>
                        </div>

                        {/* Linking Section */}
                        <div className="bg-accent/30 p-5 rounded-2xl space-y-3 border border-border/50">
                            <h4 className="text-[10px] font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                                <Users className="h-3.5 w-3.5" /> Vincular Registro
                            </h4>

                            <div className="space-y-3">
                                {/* Account Link */}
                                <div className="space-y-1">
                                    <ThemeLabel className="text-[10px]">Cliente</ThemeLabel>
                                    <ThemeSelect
                                        value={(formData as any).customerId || ''}
                                        onChange={e => setFormData({ ...formData, customerId: e.target.value } as any)}
                                        className="h-9 text-xs"
                                    >
                                        <option value="">Nenhum Cliente</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id}>{acc.name}</option>
                                        ))}
                                    </ThemeSelect>
                                </div>

                                {/* Deal Link */}
                                <div className="space-y-1">
                                    <ThemeLabel className="text-[10px]">Oportunidade (Deal)</ThemeLabel>
                                    <ThemeSelect
                                        value={(formData as any).dealId || ''}
                                        onChange={e => setFormData({ ...formData, dealId: e.target.value } as any)}
                                        className="h-9 text-xs"
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
                                rows={4}
                                className="w-full px-4 py-3 bg-muted/30 border border-border/50 rounded-2xl focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all text-foreground placeholder:text-muted-foreground resize-none text-xs font-medium"
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
                                    className="h-10 text-xs"
                                />
                            </div>
                        )}
                    </div>

                    {/* Sticky Footer */}
                    <div className="px-6 py-4 border-t border-border/10 flex items-center justify-between bg-card shrink-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={onClose}
                            className="text-muted-foreground hover:bg-muted font-bold text-xs h-10 px-4 rounded-xl"
                        >
                            Descartar
                        </Button>
                        <div className="flex gap-2">
                            {activity && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        if (confirm('Deseja realmente excluir esta atividade?')) {
                                            onDelete?.(activity.id);
                                            onClose();
                                        }
                                    }}
                                    className="text-red-400 border-red-500/20 hover:bg-red-500/10 font-bold text-xs h-10 px-4 rounded-xl transition-all flex items-center"
                                >
                                    <Trash2 className="h-4 w-4 mr-1.5" />
                                    Excluir
                                </Button>
                            )}
                            <Button
                                type="submit"
                                disabled={isSaving || !formData.title}
                                className="bg-primary hover:bg-primary/90 text-white font-bold text-xs h-10 px-5 rounded-xl transition-all shadow-md shadow-primary/20"
                            >
                                {isSaving ? 'Salvando...' : activity ? 'Salvar' : 'Criar'}
                            </Button>
                        </div>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
};
