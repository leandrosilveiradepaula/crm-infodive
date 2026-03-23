'use client';

import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetDescription,
} from "@/components/ui/sheet";
import { Zap, CheckCircle2, XCircle, Clock, Calendar, ArrowUpRight } from 'lucide-react';
import { type Automation } from "@/types/automation";

interface AutomationHistorySheetProps {
    automation: Automation | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function AutomationHistorySheet({ automation, open, onOpenChange }: AutomationHistorySheetProps) {
    if (!automation) return null;

    // Mock history data since we don't have a real backend history table yet
    const history = [
        { id: '1', status: 'success', date: 'Hoje, 14:20', details: 'Email de follow-up enviado para cliente@email.com' },
        { id: '2', status: 'success', date: 'Hoje, 09:15', details: 'Tarefa "Revisar Proposta" criada para o consultor.' },
        { id: '3', status: 'failed', date: 'Ontem, 23:45', details: 'Erro ao conectar com o servidor SMTP.', error: 'TIMEOUT' },
        { id: '4', status: 'success', date: 'Ontem, 18:30', details: 'Gatilho disparado por estagnação de 7 dias.' },
    ];

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-xl bg-card/95 backdrop-blur-2xl border-l border-white/10 p-0 overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                
                <div className="relative h-full flex flex-col">
                    <SheetHeader className="p-8 pb-4">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <Zap className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-2xl font-black text-foreground tracking-tight">{automation.name}</SheetTitle>
                                <SheetDescription className="text-muted-foreground font-medium">Histórico de execuções recente</SheetDescription>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-y-auto px-8 pb-8 space-y-6">
                        {/* Summary Stats */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-background/40 p-4 rounded-2xl border border-border/50">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Status Atual</p>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${automation.enabled ? 'bg-emerald-500 animate-pulse' : 'bg-muted'}`} />
                                    <span className="text-sm font-bold">{automation.enabled ? 'Ativa' : 'Pausada'}</span>
                                </div>
                            </div>
                            <div className="bg-background/40 p-4 rounded-2xl border border-border/50">
                                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-1">Taxa de Sucesso</p>
                                <span className="text-sm font-black text-emerald-500">
                                    {automation.executionCount > 0 
                                        ? ((automation.successCount / automation.executionCount) * 100).toFixed(0) 
                                        : '100'}%
                                </span>
                            </div>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-muted-foreground uppercase tracking-widest">Logs de Atividade</h4>
                            
                            {history.map((log) => (
                                <div key={log.id} className="group relative pl-8 pb-6 border-l border-border last:pb-0">
                                    {/* Icon Dot */}
                                    <div className={`absolute left-0 -translate-x-1/2 p-1.5 rounded-full border-2 border-card ${
                                        log.status === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                                    }`}>
                                        {log.status === 'success' ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                                    </div>

                                    <div className="bg-card border border-border/50 p-4 rounded-2xl group-hover:border-primary/30 transition-all group-hover:shadow-lg group-hover:shadow-primary/5">
                                        <div className="flex justify-between items-start mb-2">
                                            <span className="text-xs font-bold text-muted-foreground flex items-center gap-2">
                                                <Calendar className="h-3 w-3" /> {log.date}
                                            </span>
                                            {log.status === 'failed' && (
                                                <span className="text-[10px] font-black bg-red-500/10 text-red-500 px-2 py-1 rounded-md">ERROR: {log.error}</span>
                                            )}
                                        </div>
                                        <p className="text-sm text-foreground font-medium leading-relaxed">{log.details}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="p-6 border-t border-border bg-card/50 backdrop-blur-md">
                        <button className="w-full py-4 bg-primary text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-primary/90 transition-all group">
                            Configurar Notificações de Erro
                            <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                        </button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
}
