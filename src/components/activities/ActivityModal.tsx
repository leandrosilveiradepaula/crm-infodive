'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Activity, ActivityType, ActivityPriority } from '@/types/activity';
import { Loader2, X, Calendar, Clock, MapPin, Users, FileText, Trash2, ChevronDown } from 'lucide-react';
import { getAccountsDropdown, getDealsDropdown } from '@/app/(dashboard)/activities/actions';

interface ActivityModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: Partial<Activity>) => Promise<void>;
    onDelete?: (id: string) => Promise<void>;
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

export function ActivityModal({ isOpen, onClose, onSave, onDelete, activity }: ActivityModalProps) {
    const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
    const [deals, setDeals] = useState<{ id: string; title: string; account_id?: string }[]>([]);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState<Partial<Activity>>(INITIAL_ACTIVITY);

    // Load accounts and deals from server when modal opens
    useEffect(() => {
        if (isOpen) {
            getAccountsDropdown().then(data => setAccounts(data));
            getDealsDropdown().then(data => setDeals(data));
        }
    }, [isOpen]);


    useEffect(() => {
        if (activity) {
            setFormData({
                ...activity,
                // Ensure date/time strings are safe
                dueDate: activity.dueDate || '',
                dueTime: activity.dueTime || '',
            });
        } else {
            setFormData(INITIAL_ACTIVITY);
        }
    }, [activity, isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await onSave(formData);
            onClose();
        } catch (error) {
            console.error(error);
            // alert('Erro ao salvar atividade.'); // Toast handled by parent usually or we add it here
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent showCloseButton={false} className="sm:max-w-2xl bg-card border-border text-foreground p-0 gap-0 overflow-hidden">
                {/* Header with Gradient */}
                <div className="bg-gradient-to-r from-primary to-teal-600 px-8 py-6 flex items-center justify-between border-b border-white/10">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">
                            {activity ? 'Editar Atividade' : 'Nova Atividade'}
                        </h2>
                        <p className="text-blue-100 text-xs mt-1 font-bold uppercase tracking-widest opacity-80">
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
                    <div className="space-y-2">
                        <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Título da Atividade</Label>
                        <Input
                            required
                            className="bg-muted/30 border border-border h-12 text-lg font-bold text-foreground"
                            placeholder="Ex: Reunião de Alinhamento, Follow-up..."
                            value={formData.title}
                            onChange={e => setFormData({ ...formData, title: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Type */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Tipo</Label>
                            <Select
                                value={formData.type}
                                onValueChange={(val: ActivityType) => setFormData(prev => ({ ...prev, type: val }))}
                            >
                                <SelectTrigger className="bg-muted/30 border-border h-12 text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover text-popover-foreground border-border">
                                    <SelectItem value="task">Tarefa</SelectItem>
                                    <SelectItem value="meeting">Reunião</SelectItem>
                                    <SelectItem value="call">Ligação</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="note">Nota</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Priority */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">Prioridade</Label>
                            <Select
                                value={formData.priority}
                                onValueChange={(val: ActivityPriority) => setFormData(prev => ({ ...prev, priority: val }))}
                            >
                                <SelectTrigger className="bg-muted/30 border-border h-12 text-foreground">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-popover text-popover-foreground border-border">
                                    <SelectItem value="low">Baixa</SelectItem>
                                    <SelectItem value="medium">Média</SelectItem>
                                    <SelectItem value="high">Alta</SelectItem>
                                    <SelectItem value="urgent">Urgente 🔥</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Due Date */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" /> Data
                            </Label>
                            <Input
                                type="date"
                                className="bg-muted/30 border-border h-12 text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                                value={formData.dueDate}
                                onChange={e => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>

                        {/* Due Time */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                                <Clock className="h-4 w-4 text-primary" /> Horário
                            </Label>
                            <Input
                                type="time"
                                className="bg-muted/30 border-border h-12 text-foreground [color-scheme:light] dark:[color-scheme:dark]"
                                value={formData.dueTime}
                                onChange={e => setFormData({ ...formData, dueTime: e.target.value })}
                            />
                        </div>
                    </div>

                    {/* Linking Section */}
                    <div className="bg-muted/30 p-6 rounded-2xl space-y-4 border border-border">
                        <h4 className="text-xs font-bold text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                            <Users className="h-4 w-4" /> Vincular Registro
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Account Link */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase px-1">Cliente</Label>
                                <div className="relative">
                                    <select
                                        className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary transition-all text-sm text-foreground hover:bg-muted/50 appearance-none"
                                        value={formData.customerId || ''}
                                        onChange={e => setFormData({ ...formData, customerId: e.target.value })}
                                    >
                                        <option value="" className="bg-card text-foreground">Nenhum Cliente</option>
                                        {accounts.map(acc => (
                                            <option key={acc.id} value={acc.id} className="bg-card text-foreground">{acc.name}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>

                            {/* Deal Link */}
                            <div className="space-y-2">
                                <Label className="text-xs font-bold text-muted-foreground uppercase px-1">Oportunidade (Deal)</Label>
                                <div className="relative">
                                    <select
                                        className="w-full px-4 py-3 bg-card border border-border rounded-xl focus:ring-2 focus:ring-primary transition-all text-sm text-foreground hover:bg-muted/50 appearance-none"
                                        value={formData.dealId || ''}
                                        onChange={e => setFormData({ ...formData, dealId: e.target.value })}
                                    >
                                        <option value="" className="bg-card text-foreground">Nenhum Deal</option>
                                        {deals
                                            .filter(d => !formData.customerId || d.account_id === formData.customerId)
                                            .map(deal => (
                                                <option key={deal.id} value={deal.id} className="bg-card text-foreground">{deal.title}</option>
                                            ))}
                                    </select>
                                    <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" /> Descrição / Notas
                        </Label>
                        <Textarea
                            rows={3}
                            className="bg-muted/30 border border-border min-h-[100px] text-foreground"
                            placeholder="Adicione detalhes, observações ou próximos passos..."
                            value={formData.description}
                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Location (optional) */}
                    {formData.type === 'meeting' && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <Label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1 flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-primary" /> Local / Link da Reunião
                            </Label>
                            <Input
                                className="bg-muted/30 border-border h-12 text-foreground"
                                placeholder="Endereço ou link (Meet, Zoom, Teams)"
                                value={formData.location || ''}
                                onChange={e => setFormData({ ...formData, location: e.target.value })}
                            />
                        </div>
                    )}
                </form>

                {/* Footer */}
                <div className="px-8 py-6 border-t border-border flex items-center justify-between bg-card">
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="px-6 py-6 text-muted-foreground font-bold hover:text-foreground hover:bg-muted transition-all h-auto"
                    >
                        Descartar
                    </Button>
                    <div className="flex gap-3">
                        {activity && onDelete && (
                            <Button
                                variant="ghost"
                                onClick={async () => {
                                    if (confirm('Deseja realmente excluir esta atividade?')) {
                                        await onDelete(activity.id);
                                        onClose();
                                    }
                                }}
                                className="px-6 py-6 text-red-400 font-bold hover:bg-red-500/10 rounded-2xl border border-red-500/20 transition-all flex items-center h-auto hover:text-red-300"
                            >
                                <Trash2 className="h-5 w-5 mr-2" />
                                Excluir
                            </Button>
                        )}
                        <Button
                            onClick={handleSubmit}
                            disabled={loading || !formData.title}
                            className="px-8 py-6 bg-primary text-white font-bold rounded-2xl hover:bg-primary transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-blue-500/20 h-auto"
                        >
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            {loading ? 'Salvando...' : activity ? 'Salvar Tudo' : 'Criar Atividade'}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
