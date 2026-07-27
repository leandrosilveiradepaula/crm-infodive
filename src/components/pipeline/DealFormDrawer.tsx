'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createDeal, updateDeal } from '@/app/(dashboard)/pipeline/actions';
import { getAccounts } from '@/app/(dashboard)/pipeline/actions';
import { Loader2, Target, Calendar, AlignLeft, Building2, AlertCircle, X } from 'lucide-react';
import { type Deal } from '@/types/deal';
import { useRouter } from 'next/navigation';
import { ThemeInput, ThemeLabel, ThemeSectionHeader, ThemePanel, ThemeCurrencyInput } from '@/components/ui/theme/ThemeComponents';

interface DealFormDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    deal?: Deal | null;
}

export function DealFormDrawer({ open, onOpenChange, deal }: DealFormDrawerProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<{ id: string, name: string }[]>([]);
    const [accountError, setAccountError] = useState(false);
    const [valueError, setValueError] = useState(false);

    const [formData, setFormData] = useState<Partial<Deal>>({
        title: deal?.title || '',
        account_id: deal?.account_id || '',
        company: deal?.company || '',
        value: deal?.value || undefined,
        stage: deal?.stage || 'qualification',
        probability: deal?.probability || 20,
        expected_close_date: deal?.expected_close_date || '',
        description: deal?.description || ''
    });

    // Reset/Update form data when deal prop changes or drawer opens
    useEffect(() => {
        if (open) {
            setFormData({
                title: deal?.title || '',
                account_id: deal?.account_id || '',
                company: deal?.company || '',
                value: deal?.value || undefined,
                stage: deal?.stage || 'qualification',
                probability: deal?.probability || 20,
                expected_close_date: deal?.expected_close_date || '',
                description: deal?.description || ''
            });
            setLoading(false);
            setAccountError(false);
            setValueError(false);

            getAccounts().then(data => setAccounts(data));
        }
    }, [deal, open]);

    const isEditing = !!deal;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.account_id) {
            setAccountError(true);
            return;
        }

        if (!formData.value || Number(formData.value) <= 0) {
            setValueError(true);
            return;
        }

        setAccountError(false);
        setValueError(false);
        setLoading(true);

        try {
            if (isEditing && deal) {
                await updateDeal(deal.id, formData);
            } else {
                await createDeal(formData);
            }
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            console.error('Error saving deal:', error);
            alert('Erro ao salvar oportunidade.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="w-full sm:max-w-[580px] flex flex-col p-0 gap-0"
            >
                {/* ── Header ── */}
                <div className="border-b border-border px-6 py-4 shrink-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <Target className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-lg font-bold text-foreground tracking-tight">
                                    {isEditing ? 'Editar Oportunidade' : 'Nova Oportunidade'}
                                </SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                                    {isEditing
                                        ? 'Atualize os detalhes da negociação em andamento.'
                                        : 'Preencha os dados para iniciar uma nova negociação no pipeline.'}
                                </SheetDescription>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:bg-muted"
                            onClick={() => onOpenChange(false)}
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* ── Form Content ── */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-5">

                        {/* ── Informações Básicas ── */}
                        <ThemePanel className="border-dashed">
                            <ThemeSectionHeader title="Informações Básicas" iconColor="bg-blue-500" />

                            <div className="space-y-4 mt-4">
                                {/* Título */}
                                <div className="space-y-1">
                                    <ThemeLabel htmlFor="title">Título do Projeto</ThemeLabel>
                                    <ThemeInput
                                        id="title"
                                        value={formData.title}
                                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ex: Renovação Datacenter"
                                        required
                                    />
                                </div>

                                {/* Cliente */}
                                <div className="space-y-1">
                                    <ThemeLabel htmlFor="company">Cliente / Empresa</ThemeLabel>
                                    <Select
                                        value={formData.account_id || ''}
                                        onValueChange={(val) => {
                                            const selectedAccount = accounts.find(a => a.id === val);
                                            setFormData({
                                                ...formData,
                                                account_id: val,
                                                company: selectedAccount ? selectedAccount.name : ''
                                            });
                                            setAccountError(false);
                                        }}
                                    >
                                        <SelectTrigger className={`bg-card w-full text-foreground h-[34px] rounded-md text-xs font-bold focus:ring-1 border ${accountError ? 'border-red-500 focus:ring-red-500' : 'border-border focus:ring-blue-500'}`}>
                                            <div className="flex items-center gap-2 truncate">
                                                <Building2 className={`w-4 h-4 shrink-0 ${accountError ? 'text-red-500' : 'text-muted-foreground'}`} />
                                                <SelectValue placeholder="Selecione um cliente..." />
                                            </div>
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground rounded-md max-h-[200px]">
                                            {accounts.length === 0 ? (
                                                <div className="p-2 text-xs text-muted-foreground text-center">Nenhum cliente encontrado</div>
                                            ) : (
                                                accounts.map((acc) => (
                                                    <SelectItem key={acc.id} value={acc.id}>
                                                        {acc.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                    {accountError && (
                                        <div className="flex items-center gap-1.5 mt-1.5 text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span className="text-[11px] font-semibold">Selecione um cliente para vincular à oportunidade.</span>
                                        </div>
                                    )}
                                </div>

                                {/* Valor */}
                                <div className="space-y-1">
                                    <ThemeLabel htmlFor="value">Valor Estimado</ThemeLabel>
                                    <ThemeCurrencyInput
                                        id="value"
                                        value={formData.value || ''}
                                        onChange={(e) => {
                                            setFormData({ ...formData, value: Number(e.target.value) });
                                            setValueError(false);
                                        }}
                                        placeholder="0,00"
                                        required
                                        className={valueError ? 'border-red-500 focus:ring-red-500' : ''}
                                    />
                                    {valueError && (
                                        <div className="flex items-center gap-1.5 mt-1.5 text-red-500 animate-in fade-in slide-in-from-top-1 duration-200">
                                            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                            <span className="text-[11px] font-semibold">O valor estimado deve ser maior que zero.</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </ThemePanel>

                        {/* ── Status & Previsão ── */}
                        <ThemePanel className="border-dashed">
                            <ThemeSectionHeader title="Status & Previsão" iconColor="bg-emerald-500" />

                            <div className="space-y-4 mt-4">
                                {/* Estágio */}
                                <div className="space-y-1">
                                    <ThemeLabel htmlFor="stage">Estágio do Funil</ThemeLabel>
                                    <Select
                                        value={formData.stage}
                                        onValueChange={(val) => setFormData({ ...formData, stage: val })}
                                    >
                                        <SelectTrigger className="bg-card border-border text-foreground h-[34px] rounded-md text-xs font-bold focus:ring-1 focus:ring-blue-500 border w-full">
                                            <SelectValue placeholder="Selecione o estágio" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-popover border-border text-popover-foreground rounded-md">
                                            <SelectItem value="qualification">Qualificação</SelectItem>
                                            <SelectItem value="proposal">Proposta</SelectItem>
                                            <SelectItem value="negotiation">Negociação</SelectItem>
                                            <SelectItem value="won">Ganho</SelectItem>
                                            <SelectItem value="lost">Perdido</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {/* Probabilidade */}
                                    <div className="space-y-1">
                                        <ThemeLabel htmlFor="probability">Probabilidade (%)</ThemeLabel>
                                        <div className="relative">
                                            <ThemeInput
                                                id="probability"
                                                type="number"
                                                min="0"
                                                max="100"
                                                value={formData.probability}
                                                onChange={(e) => setFormData({ ...formData, probability: Number(e.target.value) })}
                                                className="pr-8"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-muted-foreground pointer-events-none">%</span>
                                        </div>
                                    </div>

                                    {/* Fechamento */}
                                    <div className="space-y-1">
                                        <ThemeLabel htmlFor="expected_close_date">Fechamento</ThemeLabel>
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                            <ThemeInput
                                                id="expected_close_date"
                                                type="date"
                                                value={formData.expected_close_date ? new Date(formData.expected_close_date).toISOString().split('T')[0] : ''}
                                                onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                                                className="pl-9 w-full"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Probability bar */}
                                <div className="pt-1">
                                    <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                        <div
                                            className={`h-full transition-all duration-500 rounded-full ${
                                                (formData.probability || 0) < 30 ? 'bg-red-500' :
                                                (formData.probability || 0) < 70 ? 'bg-amber-500' :
                                                'bg-emerald-500'
                                            }`}
                                            style={{ width: `${formData.probability || 0}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </ThemePanel>

                        {/* ── Descrição ── */}
                        <div className="space-y-1">
                            <ThemeLabel htmlFor="description">Descrição / Notas Adicionais</ThemeLabel>
                            <div className="relative">
                                <AlignLeft className="absolute left-3 top-3 w-4 h-4 text-muted-foreground pointer-events-none" />
                                <textarea
                                    id="description"
                                    value={formData.description || ''}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="flex min-h-[90px] w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-xs font-bold text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus:ring-1 focus:ring-primary transition-all resize-none shadow-sm"
                                    placeholder="Descreva os detalhes importantes, necessidades do cliente e próximos passos..."
                                />
                            </div>
                        </div>
                    </div>

                    {/* ── Sticky Footer ── */}
                    <div className="border-t border-border px-6 py-4 bg-muted/10 shrink-0 flex items-center justify-end gap-3">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="h-10 px-4 text-muted-foreground hover:text-foreground hover:bg-muted font-bold rounded-xl transition-all"
                        >
                            Cancelar
                        </Button>
                        <Button
                            type="submit"
                            disabled={loading}
                            className="h-10 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-md shadow-primary/20 min-w-[180px] transition-all active:scale-95 flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Target className="h-4 w-4" />
                            )}
                            {isEditing ? 'Salvar Alterações' : 'Criar Nova Oportunidade'}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
