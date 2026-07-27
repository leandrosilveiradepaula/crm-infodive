'use client';

import React, { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { ThemeInput, ThemeSelect } from '@/components/ui/theme/ThemeComponents';
import type { ServiceContract } from '@/types/postSales';

interface ServiceContractModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contract: ServiceContract | null;
    accountId: string;
    onSave: (payload: Partial<ServiceContract>) => Promise<unknown>;
}

export function ServiceContractModal({ open, onOpenChange, contract, accountId, onSave }: ServiceContractModalProps) {
    const [loading, setLoading] = useState(false);
    
    // Form State
    const [title, setTitle] = useState('');
    const [type, setType] = useState<'support' | 'warranty_extension' | 'subscription'>('support');
    const [status, setStatus] = useState<'active' | 'expired' | 'pending_renewal' | 'canceled'>('active');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [monthlyValue, setMonthlyValue] = useState<number>(0);
    const [coverageDetails, setCoverageDetails] = useState('');

    useEffect(() => {
        if (open) {
            if (contract) {
                setTitle(contract.title);
                setType(contract.type);
                setStatus(contract.status);
                setStartDate(contract.start_date || '');
                setEndDate(contract.end_date || '');
                setMonthlyValue(contract.monthly_value || 0);
                setCoverageDetails(contract.coverage_details || '');
            } else {
                setTitle('');
                setType('support');
                setStatus('active');
                setStartDate('');
                setEndDate('');
                setMonthlyValue(0);
                setCoverageDetails('');
            }
        }
    }, [open, contract]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim()) {
            toast.error('O título do contrato é obrigatório.');
            return;
        }

        setLoading(true);
        try {
            const payload: Partial<ServiceContract> = {
                account_id: accountId,
                title,
                type,
                status,
                start_date: startDate || undefined,
                end_date: endDate || undefined,
                monthly_value: Number(monthlyValue),
                coverage_details: coverageDetails || undefined
            };

            await onSave(payload);
            toast.success(contract ? 'Contrato atualizado.' : 'Contrato cadastrado com sucesso!');
            onOpenChange(false);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Erro ao salvar contrato.';
            toast.error(errorMessage);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent side="right" className="w-full sm:max-w-[500px] flex flex-col p-0 gap-0 bg-background border-l border-border">
                {/* Header */}
                <div className="border-b border-border px-6 py-4 shrink-0">
                    <SheetTitle className="text-lg font-bold text-foreground tracking-tight">
                        {contract ? 'Editar Contrato de Suporte' : 'Novo Contrato de Suporte'}
                    </SheetTitle>
                    <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                        Descreva as condições, escopo e validade do contrato assinado com este cliente.
                    </SheetDescription>
                </div>

                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-6">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Título / Nome do Contrato *
                                </label>
                                <ThemeInput
                                    placeholder="Ex: SLA Ouro 24x7"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Tipo
                                    </label>
                                    <ThemeSelect
                                        value={type}
                                        onChange={(e) => setType(e.target.value as ServiceContract['type'])}
                                    >
                                        <option value="support">Suporte Técnico</option>
                                        <option value="warranty_extension">Extensão de Garantia</option>
                                        <option value="subscription">Assinatura / Licenciamento</option>
                                    </ThemeSelect>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Status
                                    </label>
                                    <ThemeSelect
                                        value={status}
                                        onChange={(e) => setStatus(e.target.value as ServiceContract['status'])}
                                    >
                                        <option value="active">Ativo / Vigente</option>
                                        <option value="pending_renewal">Pendente Renovação</option>
                                        <option value="expired">Expirado</option>
                                        <option value="canceled">Cancelado</option>
                                    </ThemeSelect>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Data de Início
                                    </label>
                                    <ThemeInput
                                        type="date"
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                        Data de Fim (Expiração)
                                    </label>
                                    <ThemeInput
                                        type="date"
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Valor Mensal Recorrente (Opcional)
                                </label>
                                <ThemeInput
                                    type="number"
                                    min="0"
                                    step="0.01"
                                    placeholder="0,00"
                                    value={monthlyValue}
                                    onChange={(e) => setMonthlyValue(Number(e.target.value))}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                                    Escopo / Observações do SLA
                                </label>
                                <textarea
                                    className="w-full h-24 p-3 bg-muted/30 border border-border rounded-xl text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="Descreva o tempo de atendimento, restrições e o que está coberto..."
                                    value={coverageDetails}
                                    onChange={(e) => setCoverageDetails(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-border px-6 py-4 bg-muted/10 shrink-0 flex items-center justify-end gap-3">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" className="bg-primary text-white font-bold" disabled={loading}>
                            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Salvar
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
