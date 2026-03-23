'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createDeal, updateDeal } from '@/app/(dashboard)/pipeline/actions';
import { getAccounts } from '@/app/(dashboard)/pipeline/actions';
import { Loader2, Target, Calendar, AlignLeft, ChevronRight, Building2 } from 'lucide-react';
import { type Deal } from '@/types/deal';
import { useRouter } from 'next/navigation';
import { ThemeInput, ThemeLabel, ThemeSectionHeader, ThemePanel, ThemeCurrencyInput } from '@/components/ui/theme/ThemeComponents';

interface DealFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    deal?: Deal | null; // If provided, edit mode
}

export function DealFormModal({ open, onOpenChange, deal }: DealFormModalProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<{ id: string, name: string }[]>([]);

    const [formData, setFormData] = useState<Partial<Deal>>({
        title: deal?.title || '',
        account_id: deal?.account_id || '',
        company: deal?.company || '',
        value: deal?.value || 0,
        stage: deal?.stage || 'qualification',
        probability: deal?.probability || 20,
        expected_close_date: deal?.expected_close_date || '',
        description: deal?.description || ''
    });

    // Reset/Update form data when deal prop changes or modal opens
    useEffect(() => {
        if (open) {
            setFormData({
                title: deal?.title || '',
                account_id: deal?.account_id || '',
                company: deal?.company || '',
                value: deal?.value || 0,
                stage: deal?.stage || 'qualification',
                probability: deal?.probability || 20,
                expected_close_date: deal?.expected_close_date || '',
                description: deal?.description || ''
            });
            setLoading(false);

            // Fetch accounts when modal opens
            getAccounts().then(data => setAccounts(data));
        }
    }, [deal, open]);

    const isEditing = !!deal;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (isEditing && deal) {
                await updateDeal(deal.id, formData);
            } else {
                await createDeal(formData);
            }
            onOpenChange(false);
            router.refresh(); // Refresh server components
        } catch (error) {
            console.error('Error saving deal:', error);
            alert('Erro ao salvar oportunidade.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[750px] bg-background border-border text-foreground p-0 overflow-hidden shadow-2xl rounded-2xl">
                {/* Header with gradient and icon */}
                <DialogHeader className="bg-gradient-to-r from-primary/15 to-transparent p-6 border-b border-border flex flex-row items-center gap-4 space-y-0 relative overflow-hidden">
                    {/* Decorative Background Icon */}
                    <Target className="absolute -right-6 -top-6 w-32 h-32 text-primary/5 pointer-events-none" />

                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
                        <Target className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <DialogTitle className="text-xl font-bold text-foreground">
                            {isEditing ? 'Editar Oportunidade' : 'Nova Oportunidade'}
                        </DialogTitle>
                        <p className="text-xs text-muted-foreground mt-1">
                            {isEditing ? 'Atualize os detalhes da negociação em andamento.' : 'Preencha os dados abaixo para iniciar uma nova negociação em seu pipeline.'}
                        </p>
                    </div>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                        {/* Coluna Esquerda: Informações Principais */}
                        <div className="space-y-4">
                            <ThemePanel className="h-full border-dashed">
                                <ThemeSectionHeader title="Informações Básicas" iconColor="bg-blue-500" />

                                <div className="space-y-4 mt-4">
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
                                            }}
                                        >
                                            <SelectTrigger className="bg-card w-full border-border text-foreground h-[34px] rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-500 border">
                                                <div className="flex items-center gap-2 truncate">
                                                    <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                                                    <SelectValue placeholder="Selecione um cliente..." />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border text-popover-foreground rounded-xl max-h-[200px]">
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
                                    </div>

                                    <div className="space-y-1">
                                        <ThemeLabel htmlFor="value">Valor Estimado</ThemeLabel>
                                        <ThemeCurrencyInput
                                            id="value"
                                            value={formData.value || ''}
                                            onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                            placeholder="0,00"
                                            required
                                        />
                                    </div>
                                </div>
                            </ThemePanel>
                        </div>

                        {/* Coluna Direita: Status e Detalhes */}
                        <div className="space-y-4">
                            <ThemePanel className="h-full border-dashed">
                                <ThemeSectionHeader title="Status & Previsão" iconColor="bg-emerald-500" />

                                <div className="space-y-4 mt-4">
                                    <div className="space-y-1">
                                        <ThemeLabel htmlFor="stage">Estágio do Funil</ThemeLabel>
                                        <Select
                                            value={formData.stage}
                                            onValueChange={(val) => setFormData({ ...formData, stage: val })}
                                        >
                                            <SelectTrigger className="bg-card border-border text-foreground h-[34px] rounded-xl text-xs font-bold focus:ring-1 focus:ring-blue-500 border w-full">
                                                <SelectValue placeholder="Selecione o estágio" />
                                            </SelectTrigger>
                                            <SelectContent className="bg-popover border-border text-popover-foreground rounded-xl">
                                                <SelectItem value="qualification">Qualificação</SelectItem>
                                                <SelectItem value="proposal">Proposta</SelectItem>
                                                <SelectItem value="negotiation">Negociação</SelectItem>
                                                <SelectItem value="won">Ganho</SelectItem>
                                                <SelectItem value="lost">Perdido</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
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

                                    {/* Exibir o progresso da probabilidade visualmente */}
                                    <div className="pt-2">
                                        <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-500 \${
                                                    (formData.probability || 0) < 30 ? 'bg-red-500' :
                                                    (formData.probability || 0) < 70 ? 'bg-amber-500' : 
                                                    'bg-emerald-500'
                                                }`}
                                                style={{ width: `\${formData.probability || 0}%` }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </ThemePanel>
                        </div>
                    </div>

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

                    <DialogFooter className="pt-4 flex items-center justify-end gap-2">
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground rounded-xl font-bold h-10 px-4">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all h-10 px-6">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <ChevronRight className="mr-2 h-4 w-4" />}
                            {isEditing ? 'Salvar Alterações' : 'Criar Nova Oportunidade'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
