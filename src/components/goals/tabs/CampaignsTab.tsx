'use client';

import { useState } from 'react';
import { Campaign } from '@/types/goal';
import { createCampaign, updateCampaign, deleteCampaign } from '@/app/(dashboard)/goals-commissions/actions';
import { Trash2, Plus, Save, Loader2, X, Check } from 'lucide-react';
import { ThemeCurrencyInput } from '@/components/ui/theme/ThemeComponents';
import { toast } from 'sonner';

interface CampaignsTabProps {
    campaigns: Campaign[];
}

function CampaignRow({ campaign }: { campaign: Campaign }) {
    const [name, setName] = useState(campaign.name);
    const [percent, setPercent] = useState<string | number>(campaign.commission_percent || 0);
    const [absolute, setAbsolute] = useState<string | number>(campaign.commission_absolute || 0);
    const [isSaving, setIsSaving] = useState(false);

    const hasChanges = name !== campaign.name ||
        Number(percent) !== (campaign.commission_percent || 0) ||
        Number(absolute) !== (campaign.commission_absolute || 0);

    const handleSave = async () => {
        if (!name.trim()) {
            toast.error('O nome da campanha não pode ser vazio');
            return;
        }

        setIsSaving(true);
        const result = await updateCampaign(campaign.id, {
            name,
            commission_percent: Number(percent),
            commission_absolute: Number(absolute)
        });

        setIsSaving(false);

        if (result.success) {
            toast.success('Campanha salva com sucesso!');
        } else {
            toast.error('Erro ao salvar: ' + result.error);
        }
    };

    const handleCancel = () => {
        setName(campaign.name);
        setPercent(campaign.commission_percent || 0);
        setAbsolute(campaign.commission_absolute || 0);
    };

    const handleToggleStatus = async () => {
        const newStatus = !campaign.active;
        const result = await updateCampaign(campaign.id, { active: newStatus });
        if (result.success) {
            toast.success(`Campanha ${newStatus ? 'ativada' : 'desativada'}`);
        } else {
            toast.error('Erro ao atualizar status');
        }
    };

    const handleDelete = async () => {
        if (confirm('Tem certeza que deseja excluir esta campanha?')) {
            const result = await deleteCampaign(campaign.id);
            if (result.success) {
                toast.success('Campanha excluída');
            } else {
                toast.error('Erro ao excluir: ' + result.error);
            }
        }
    };

    return (
        <div className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-muted/50 transition-all duration-300 group">
            <div className="col-span-6">
                <input
                    type="text"
                    className={`bg-background border rounded-xl px-4 py-2.5 text-sm font-bold text-foreground outline-none w-full transition-all ${hasChanges ? 'border-primary ring-1 ring-primary' : 'border-border focus:ring-2 focus:ring-primary'
                        }`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
            <div className="col-span-1">
                <input
                    type="number"
                    className={`bg-background border rounded-xl px-3 py-2.5 text-center text-sm font-bold text-blue-500 outline-none w-full transition-all ${hasChanges ? 'border-primary ring-1 ring-primary' : 'border-border focus:ring-2 focus:ring-primary'
                        }`}
                    value={percent}
                    onChange={(e) => setPercent(e.target.value === '' ? '' : Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                />
            </div>
            <div className="col-span-2">
                <ThemeCurrencyInput
                    className={`w-full bg-background border rounded-xl px-2 py-2.5 h-auto text-left text-sm font-bold text-emerald-500 outline-none transition-all pl-8 ${hasChanges ? 'border-primary ring-1 ring-primary' : 'border-border focus:ring-2 focus:ring-primary'}`}
                    value={absolute || 0}
                    onChange={(e) => setAbsolute(Number(e.target.value))}
                />
            </div>
            <div className="col-span-2 text-center">
                <button
                    onClick={handleToggleStatus}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${campaign.active
                        ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-muted text-muted-foreground border border-border hover:bg-muted/80'
                        }`}
                >
                    {campaign.active ? 'Ativa' : 'Inativa'}
                </button>
            </div>
            <div className="col-span-1 text-right flex items-center justify-end gap-2">
                {hasChanges ? (
                    <>
                        <button
                            onClick={handleSave}
                            disabled={isSaving}
                            className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary transition-all shadow-lg shadow-primary/20"
                            title="Salvar Alterações"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                        </button>
                        <button
                            onClick={handleCancel}
                            className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all border border-transparent hover:border-border"
                            title="Cancelar Alterações"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </>
                ) : (
                    <button
                        onClick={handleDelete}
                        className="p-2.5 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all border border-transparent hover:border-red-500/20 opacity-0 group-hover:opacity-100"
                        title="Excluir Campanha"
                    >
                        <Trash2 className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
}

export function CampaignsTab({ campaigns }: CampaignsTabProps) {
    const [newCampaignName, setNewCampaignName] = useState('');
    const [newCampaignPercent, setNewCampaignPercent] = useState<string | number>(0);
    const [newCampaignAbsolute, setNewCampaignAbsolute] = useState<string | number>(0);

    const [isCreating, setIsCreating] = useState(false);

    const handleCreate = async () => {
        if (!newCampaignName.trim()) {
            toast.error('O nome da campanha é obrigatório');
            return;
        }

        setIsCreating(true);
        try {
            const result = await createCampaign({
                name: newCampaignName,
                description: '',
                start_date: null,
                end_date: null,
                active: true,
                commission_percent: newCampaignPercent === '' ? 0 : Number(newCampaignPercent),
                commission_absolute: newCampaignAbsolute === '' ? 0 : Number(newCampaignAbsolute)
            });

            if (result.success) {
                toast.success('Campanha criada com sucesso!');
                setNewCampaignName('');
                setNewCampaignPercent(0);
                setNewCampaignAbsolute(0);
            } else {
                toast.error('Erro ao criar campanha: ' + result.error);
            }
        } catch (error) {
            toast.error('Erro ao criar campanha');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <div className="flex-1 grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-6">
                        <label className="block text-sm font-medium text-foreground mb-2">
                            Nova Campanha
                        </label>
                        <input
                            type="text"
                            placeholder="Nome da campanha (ex: Black Friday)"
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground placeholder-muted-foreground font-medium"
                            value={newCampaignName}
                            onChange={(e) => setNewCampaignName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreate();
                            }}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[10px] font-black text-muted-foreground mb-2 uppercase tracking-widest">
                            Percentual (%)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all text-foreground font-bold"
                            value={newCampaignPercent}
                            onChange={(e) => setNewCampaignPercent(e.target.value === '' ? '' : Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[10px] font-black text-muted-foreground mb-2 uppercase tracking-widest">
                            Valor Fixo (R$)
                        </label>
                        <ThemeCurrencyInput
                            className="w-full h-auto px-4 py-2.5 bg-background border border-border rounded-xl pl-8 text-left focus:ring-2 focus:ring-primary outline-none transition-all text-foreground font-bold"
                            value={newCampaignAbsolute || 0}
                            onChange={(e) => setNewCampaignAbsolute(Number(e.target.value))}
                        />
                    </div>
                    <div className="col-span-2">
                        <button
                            onClick={handleCreate}
                            disabled={!newCampaignName.trim() || isCreating}
                            className="w-full h-[46px] mt-6 bg-primary text-white font-black rounded-xl hover:bg-primary transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                        >
                            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            {isCreating ? 'CRIANDO...' : 'CRIAR'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="bg-card rounded-3xl border border-border overflow-hidden">
                <div className="grid grid-cols-12 gap-4 p-5 border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                    <div className="col-span-6">Campanha</div>
                    <div className="col-span-1 text-center">%</div>
                    <div className="col-span-2 text-center">R$ Fixo</div>
                    <div className="col-span-2 text-center">Status</div>
                    <div className="col-span-1 text-right">Ações</div>
                </div>
                <div className="divide-y divide-border">
                    {campaigns.map((campaign) => (
                        <CampaignRow key={campaign.id} campaign={campaign} />
                    ))}
                    {campaigns.length === 0 && (
                        <div className="p-8 text-center text-muted-foreground col-span-12 font-medium">
                            Nenhuma campanha cadastrada.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
