'use client';

import React from 'react';
import { SalesOrder } from '@/hooks/useSalesOrders';
import { formatCurrency } from '@/utils/format';
import { toast } from 'sonner';
import {
    DollarSign,
    CheckCircle2,
    Calendar,
    AlertTriangle,
    Clock,
    Search,
    Undo2,
    Sparkles,
    CreditCard
} from 'lucide-react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';
import { FilterBar } from '@/components/layout/FilterBar';
import { ThemeInput } from '@/components/ui/theme/ThemeComponents';

interface InstallmentItem {
    id: string;
    amount: number;
    due_date: string;
    status: string;
    orderId: string;
    customerName: string;
    dealTitle?: string;
}

interface InstallmentsTabProps {
    orders: SalesOrder[];
    onUpdateStatus: (installmentId: string, status: string) => Promise<boolean>;
}

export function InstallmentsTab({ orders, onUpdateStatus }: InstallmentsTabProps) {
    const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
    const [filter, setFilter] = React.useState<'all' | 'pending' | 'paid' | 'overdue'>('all');
    const [searchTerm, setSearchTerm] = React.useState('');
    
    // AI Reconciliation State
    const [isAIOpen, setIsAIOpen] = React.useState(false);
    const [statementText, setStatementText] = React.useState('');
    const [isAnalyzing, setIsAnalyzing] = React.useState(false);
    const [aiMatches, setAiMatches] = React.useState<any[]>([]);

    const now = new Date();
    
    const allInstallments: InstallmentItem[] = React.useMemo(() => 
        orders.flatMap(o => (o.installments || []).map(i => ({
            ...i,
            orderId: o.id,
            customerName: o.deal?.customer?.name || 'Cliente Desconhecido',
            dealTitle: o.deal?.title
        }))), [orders]);

    const filtered = React.useMemo(() => allInstallments.filter(i => {
        const isOverdue = i.status !== 'paid' && new Date(i.due_date) < now;
        
        const matchesFilter = 
            filter === 'all' || 
            (filter === 'pending' && i.status === 'pending') ||
            (filter === 'paid' && i.status === 'paid') ||
            (filter === 'overdue' && isOverdue);

        const matchesSearch = i.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            i.dealTitle?.toLowerCase().includes(searchTerm.toLowerCase());
            
        return matchesFilter && matchesSearch;
    }).sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime()), [allInstallments, filter, searchTerm]);

    const selectedInstallments = allInstallments.filter(i => selectedIds.includes(i.id));
    const totalSelectedValue = selectedInstallments.reduce((sum, i) => sum + i.amount, 0);

    const toggleSelect = (id: string) => {
        setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
    };

    const toggleSelectAll = () => {
        const canBeSelected = filtered.filter(f => f.status !== 'paid');
        if (selectedIds.length === canBeSelected.length && canBeSelected.length > 0) {
            setSelectedIds([]);
        } else {
            setSelectedIds(canBeSelected.map(i => i.id));
        }
    };

    const handleBatchPay = async () => {
        if (selectedIds.length === 0) return;
        const toastId = toast.loading(`Processando ${selectedIds.length} pagamentos...`);
        try {
            await Promise.all(selectedIds.map(id => onUpdateStatus(id, 'paid')));
            toast.success('Pagamentos processados com sucesso!', { id: toastId });
            setSelectedIds([]);
        } catch (error) {
            toast.error('Erro ao processar pagamentos em lote.', { id: toastId });
        }
    };

    const handleAIReconcile = async () => {
        if (!statementText.trim()) return;
        setIsAnalyzing(true);
        try {
            const res = await fetch('/api/sales/reconcile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ statementText })
            });
            const result = await res.json();
            if (result.success) {
                setAiMatches(result.data.matches || []);
                if (result.data.matches?.length === 0) {
                    toast.info('Nenhuma correspondência encontrada pela IA.');
                }
            } else {
                throw new Error(result.error);
            }
        } catch (error: any) {
            toast.error('Erro na análise de IA: ' + error.message);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const applyAIMatches = async () => {
        const matchesToApply = aiMatches.filter(m => m.confidence > 0.8);
        if (matchesToApply.length === 0) return;
        
        const toastId = toast.loading(`Aplicando ${matchesToApply.length} conciliações...`);
        try {
            await Promise.all(matchesToApply.map(m => onUpdateStatus(m.installment_id, 'paid')));
            toast.success('Conciliação concluída!', { id: toastId });
            setIsAIOpen(false);
            setAiMatches([]);
            setStatementText('');
        } catch (error) {
            toast.error('Erro ao aplicar conciliação IA.', { id: toastId });
        }
    };

    const totalPending = allInstallments.filter(i => i.status !== 'paid').reduce((s, i) => s + i.amount, 0);
    const totalPaid = allInstallments.filter(i => i.status === 'paid').reduce((s, i) => s + i.amount, 0);
    const totalOverdue = allInstallments.filter(i => i.status !== 'paid' && new Date(i.due_date) < now).reduce((s, i) => s + i.amount, 0);

    return (
        <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <div className="rounded-xl border border-border bg-card/50 p-5 group hover:border-amber-500/30 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-xl bg-amber-500/10 group-hover:scale-110 transition-transform"><Clock className="w-4 h-4 text-amber-500" /></div>
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">A Receber</span>
                    </div>
                    <div className="text-2xl font-black text-foreground">{formatCurrency(totalPending)}</div>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-5 group hover:border-rose-500/30 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-xl bg-rose-500/10 group-hover:scale-110 transition-transform"><AlertTriangle className="w-4 h-4 text-rose-500" /></div>
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Vencidas</span>
                    </div>
                    <div className={`text-2xl font-black ${totalOverdue > 0 ? 'text-rose-500' : 'text-foreground'}`}>{formatCurrency(totalOverdue)}</div>
                </div>
                <div className="rounded-xl border border-border bg-card/50 p-5 group hover:border-emerald-500/30 transition-all">
                    <div className="flex items-center gap-2 mb-3">
                        <div className="p-2 rounded-xl bg-emerald-500/10 group-hover:scale-110 transition-transform"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></div>
                        <span className="text-xs font-black uppercase tracking-widest text-muted-foreground">Recebido</span>
                    </div>
                    <div className="text-2xl font-black text-emerald-500">{formatCurrency(totalPaid)}</div>
                </div>
            </div>

            {/* Filter Bar */}
            <FilterBar>
                <div className="relative flex-1 max-w-md group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <ThemeInput
                        placeholder="Buscar por cliente ou negócio..."
                        className="pl-11 bg-background/50 border-border focus:bg-background transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                
                <div className="flex bg-muted/50 p-1 rounded-xl border border-border overflow-hidden">
                    {(['all', 'pending', 'paid', 'overdue'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-1.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${filter === f
                                ? 'bg-background text-primary shadow-sm border border-border'
                                : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
                                }`}
                        >
                            {f === 'all' ? 'Tudo' : f === 'pending' ? 'Pendentes' : f === 'paid' ? 'Pagos' : 'Atrasados'}
                        </button>
                    ))}
                </div>

                <Dialog open={isAIOpen} onOpenChange={setIsAIOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="h-10 gap-2 border-primary/20 hover:bg-primary/5 text-primary group rounded-xl">
                            <Sparkles className="w-3.5 h-3.5 transition-transform group-hover:scale-110" />
                            <span className="text-xs font-black uppercase tracking-widest">Reconciliação IA</span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl bg-card border-border shadow-2xl rounded-[2rem]">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl font-black">
                                <Sparkles className="w-6 h-6 text-primary" />
                                <span>Conciliação Bancária IA</span>
                            </DialogTitle>
                        </DialogHeader>
                        <div className="py-4 space-y-4">
                            <p className="text-xs text-muted-foreground font-medium">Cole o texto do extrato bancário para que a IA Watson cruze os dados automaticamente.</p>
                            <Textarea 
                                placeholder="Ex: 10/05 PIX RECEBIDO - JOAO SILVA R$ 1.500,00..." 
                                className="min-h-[200px] bg-background/50 text-xs font-mono leading-relaxed rounded-2xl border-border focus:ring-primary/20"
                                value={statementText}
                                onChange={(e) => setStatementText(e.target.value)}
                            />
                            
                            {aiMatches.length > 0 && (
                                <div className="border border-border rounded-2xl overflow-hidden animate-in fade-in slide-in-from-top-2">
                                    <div className="bg-muted/50 p-3 border-b border-border">
                                        <h4 className="text-xs font-black uppercase tracking-widest text-muted-foreground">Sugestões Encontradas</h4>
                                    </div>
                                    <div className="max-h-[200px] overflow-y-auto p-3 space-y-2 custom-scrollbar">
                                        {aiMatches.map((match, idx) => (
                                            <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-background border border-border/50 hover:border-primary/30 transition-all">
                                                <div className="flex flex-col gap-0.5">
                                                    <span className="text-xs font-black text-foreground">{match.statement_entry}</span>
                                                    <span className="text-xs text-muted-foreground font-medium">{match.reason}</span>
                                                </div>
                                                <Badge variant="outline" className={`text-xs font-black ${match.confidence > 0.85 ? 'border-emerald-500/30 text-emerald-500 bg-emerald-500/5' : 'border-amber-500/30 text-amber-500 bg-amber-500/5'}`}>
                                                    {Math.round(match.confidence * 100)}% Match
                                                </Badge>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end gap-3 pt-6 border-t border-border mt-4">
                                <Button variant="ghost" onClick={() => setIsAIOpen(false)} className="text-xs font-black uppercase tracking-widest">Cancelar</Button>
                                {aiMatches.length > 0 ? (
                                    <Button onClick={applyAIMatches} className="text-xs font-black uppercase tracking-widest bg-emerald-600 hover:bg-emerald-700 h-11 px-8 rounded-xl shadow-lg shadow-emerald-500/20">
                                        Confirmar e Baixar {aiMatches.filter(m => m.confidence > 0.8).length} Parcelas
                                    </Button>
                                ) : (
                                    <Button 
                                        onClick={handleAIReconcile} 
                                        disabled={isAnalyzing || !statementText.trim()}
                                        className="text-xs font-black uppercase tracking-widest gap-2 bg-primary hover:bg-primary/90 h-11 px-8 rounded-xl shadow-lg shadow-primary/20"
                                    >
                                        {isAnalyzing ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-white/30 border-t-white" /> : <Sparkles className="w-4 h-4" />}
                                        {isAnalyzing ? 'Analisando...' : 'Analisar com Watson IA'}
                                    </Button>
                                )}
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </FilterBar>

            {/* Table */}
            <div className="border border-border rounded-2xl bg-card/30 overflow-hidden shadow-sm">
                <Table>
                    <TableHeader className="bg-muted/50">
                        <TableRow className="border-border hover:bg-transparent">
                            <TableHead className="w-12 py-5">
                                <Checkbox 
                                    checked={filtered.length > 0 && selectedIds.length === filtered.filter(f => f.status !== 'paid').length}
                                    onCheckedChange={toggleSelectAll}
                                    className="border-muted-foreground/30 data-[state=checked]:bg-primary rounded-md"
                                />
                            </TableHead>
                            <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground py-5">Status</TableHead>
                            <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground py-5">Cliente / Origem</TableHead>
                            <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground py-5 text-right">Valor</TableHead>
                            <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground py-5">Vencimento</TableHead>
                            <TableHead className="text-xs font-black uppercase tracking-widest text-muted-foreground py-5 text-right">Ações</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filtered.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="py-20">
                                    <PremiumEmptyState
                                        icon={CreditCard}
                                        title="Nenhuma parcela encontrada"
                                        description={searchTerm || filter !== 'all' 
                                            ? "Não encontramos parcelas com os filtros aplicados." 
                                            : "Não há parcelas registradas para os pedidos atuais."
                                        }
                                        variant="compact"
                                    />
                                </TableCell>
                            </TableRow>
                        ) : (
                            filtered.map((i) => {
                                const isOverdue = i.status !== 'paid' && new Date(i.due_date) < now;
                                return (
                                    <TableRow key={i.id} className="border-border/50 hover:bg-primary/[0.02] transition-colors group">
                                        <TableCell className="py-5">
                                            {i.status !== 'paid' ? (
                                                <Checkbox 
                                                    checked={selectedIds.includes(i.id)}
                                                    onCheckedChange={() => toggleSelect(i.id)}
                                                    className="border-muted-foreground/30 data-[state=checked]:bg-primary rounded-md"
                                                />
                                            ) : (
                                                <div className="w-4 h-4 flex items-center justify-center opacity-40">
                                                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                                                </div>
                                            )}
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <Badge 
                                                variant="outline" 
                                                className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                                                    i.status === 'paid' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 
                                                    isOverdue ? 'bg-rose-500/5 text-rose-500 border-rose-500/20' : 
                                                    'bg-amber-500/5 text-amber-500 border-amber-500/20'
                                                }`}
                                            >
                                                {i.status === 'paid' ? 'Pago' : isOverdue ? 'Vencido' : 'Pendente'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className="flex flex-col">
                                                <span className="text-sm font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{i.customerName}</span>
                                                <span className="text-xs text-muted-foreground font-black uppercase mt-0.5">{i.dealTitle}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 text-right">
                                            <span className="text-sm font-black text-foreground tracking-tighter">{formatCurrency(i.amount)}</span>
                                        </TableCell>
                                        <TableCell className="py-5">
                                            <div className={`flex items-center gap-2 text-xs font-black tracking-tighter uppercase ${isOverdue ? 'text-rose-500' : 'text-muted-foreground'}`}>
                                                <Calendar className="w-4 h-4 opacity-50" />
                                                {new Date(i.due_date).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell className="py-5 text-right">
                                            <div className="flex justify-end gap-1 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                                                {i.status !== 'paid' ? (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-9 w-9 p-0 text-emerald-500 hover:text-emerald-600 hover:bg-emerald-500/10 rounded-xl"
                                                        onClick={() => onUpdateStatus(i.id, 'paid')}
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                    </Button>
                                                ) : (
                                                    <Button
                                                        size="sm"
                                                        variant="ghost"
                                                        className="h-9 w-9 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl"
                                                        onClick={() => onUpdateStatus(i.id, 'pending')}
                                                    >
                                                        <Undo2 className="w-4 h-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Batch Action Bar */}
            {selectedIds.length > 0 && (
                <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-8 duration-500">
                    <div className="bg-foreground text-background px-8 py-5 rounded-[2.5rem] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] flex items-center gap-10 border border-white/10 ring-8 ring-background/10 backdrop-blur-3xl">
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Selecionados</span>
                            <span className="text-sm font-black">{selectedIds.length} parcelas</span>
                        </div>
                        <div className="h-10 w-px bg-white/10" />
                        <div className="flex flex-col">
                            <span className="text-xs font-black uppercase tracking-[0.2em] opacity-40">Valor Total</span>
                            <span className="text-xl font-black tracking-tighter text-emerald-400">{formatCurrency(totalSelectedValue)}</span>
                        </div>
                        <Button
                            onClick={handleBatchPay}
                            className="bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase tracking-widest text-xs px-10 h-14 rounded-2xl shadow-lg shadow-emerald-500/30 hover:scale-105 active:scale-95 transition-all"
                        >
                            Confirmar Pagamento
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
