'use client';

import { useState } from 'react';
import { Campaign } from '@/types/goal';
import { createCampaign, updateCampaign, deleteCampaign } from '@/app/(dashboard)/goals-commissions/actions';
import { Trash2, Plus, Save, Loader2, X, Check, Megaphone } from 'lucide-react';
import { ThemeCurrencyInput } from '@/components/ui/theme/ThemeComponents';
import { toast } from 'sonner';
import { FilterBar } from '@/components/layout/FilterBar';

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
        <div className="grid grid-cols-12 gap-4 px-5 py-3 items-center hover:bg-muted/30 transition-all duration-300 group">
            <div className="col-span-6">
                <input
                    type="text"
                    className={`bg-muted/30 border rounded-2xl px-4 h-11 text-sm font-bold text-foreground outline-none w-full transition-all ${hasChanges ? 'border-primary ring-1 ring-primary' : 'border-border focus:ring-1 focus:ring-primary'
                        }`}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
            </div>
            <div className="col-span-1">
                <input
                    type="number"
                    className={`bg-muted/30 border rounded-2xl px-3 h-11 text-center text-sm font-black text-blue-500 outline-none w-full transition-all ${hasChanges ? 'border-primary ring-1 ring-primary' : 'border-border focus:ring-1 focus:ring-primary'
                        }`}
                    value={percent}
                    onChange={(e) => setPercent(e.target.value === '' ? '' : Number(e.target.value))}
                    onFocus={(e) => e.target.select()}
                />
            </div>
            <div className="col-span-2">
                <ThemeCurrencyInput
                    className={`h-11 w-full bg-muted/30 border rounded-2xl px-4 text-left text-sm font-black text-emerald-500 outline-none transition-all pl-9 ${hasChanges ? 'border-primary ring-1 ring-primary' : 'border-border focus:ring-1 focus:ring-primary'}`}
                    value={absolute || 0}
                    onChange={(e) => setAbsolute(Number(e.target.value))}
                />
            </div>
            <div className="col-span-2 text-center">
                <button
                    onClick={handleToggleStatus}
                    className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all border shadow-sm ${campaign.active
                        ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20'
                        : 'bg-muted text-muted-foreground border-border hover:bg-muted/80 opacity-60'
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
                            className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                            title="Salvar Alterações"
                        >
                            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
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
        <div className="space-y-6">
            <FilterBar>
                <div className="flex-1 grid grid-cols-12 gap-3 items-end">
                    <div className="col-span-6 relative group">
                        <Megaphone className="absolute left-3 top-[34px] h-3.5 w-3.5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <label className="block text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-2 pl-1">
                            Nova Campanha
                        </label>
                        <input
                            type="text"
                            placeholder="Nome da campanha (ex: Black Friday)"
                            className="w-full pl-9 h-11 bg-muted/30 border border-border rounded-2xl focus:ring-1 focus:ring-primary outline-none transition-all text-foreground placeholder-muted-foreground font-bold text-sm"
                            value={newCampaignName}
                            onChange={(e) => setNewCampaignName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') handleCreate();
                            }}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[10px] font-black text-muted-foreground mb-2 uppercase tracking-widest pl-1">
                            Percentual (%)
                        </label>
                        <input
                            type="number"
                            min="0"
                            max="100"
                            step="0.1"
                            className="w-full px-4 h-11 bg-muted/30 border border-border rounded-2xl focus:ring-1 focus:ring-primary outline-none transition-all text-foreground font-black text-sm text-center"
                            value={newCampaignPercent}
                            onChange={(e) => setNewCampaignPercent(e.target.value === '' ? '' : Number(e.target.value))}
                            onFocus={(e) => e.target.select()}
                        />
                    </div>
                    <div className="col-span-2">
                        <label className="block text-[10px] font-black text-muted-foreground mb-2 uppercase tracking-widest pl-1">
                            Valor Fixo (R$)
                        </label>
                        <ThemeCurrencyInput
                            className="w-full h-11 px-4 bg-muted/30 border border-border rounded-2xl pl-9 text-left focus:ring-1 focus:ring-primary outline-none transition-all text-foreground font-black text-sm"
                            value={newCampaignAbsolute || 0}
                            onChange={(e) => setNewCampaignAbsolute(Number(e.target.value))}
                        />
                    </div>
                    <div className="col-span-2 pb-0">
                        <button
                            onClick={handleCreate}
                            disabled={!newCampaignName.trim() || isCreating}
                            className="w-full h-11 bg-primary text-white font-black rounded-2xl hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed uppercase text-[10px] tracking-widest flex items-center justify-center gap-2"
                        >
                            {isCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                            {isCreating ? 'CRIANDO...' : 'CRIAR'}
                        </button>
                    </div>
                </div>
            </FilterBar>

            <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
                <div className="grid grid-cols-12 gap-4 px-5 py-3 border-b border-border text-[10px] font-black text-muted-foreground uppercase tracking-widest bg-muted/10">
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

