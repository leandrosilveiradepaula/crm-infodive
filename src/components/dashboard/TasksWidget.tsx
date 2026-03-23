'use client';
import { useRouter } from 'next/navigation';
import { Calendar, CheckCircle2, Circle, AlertCircle, ArrowUpRight } from 'lucide-react';
import { useActivities } from '../../hooks/useActivities';
import type { Activity } from '../../types/activity';

export const TasksWidget = () => {
    const router = useRouter();
    const { activities } = useActivities();

    // Filter relevant tasks: Overdue or Due Today
    const relevantTasks = activities
        .filter(a => {
            if (a.status === 'completed') return false;
            const today = new Date().toISOString().split('T')[0];
            return a.dueDate && a.dueDate <= today;
        })
        .sort((a, b) => (a.dueDate || '')?.localeCompare(b.dueDate || ''));

    const overdueCount = relevantTasks.filter(a => {
        const today = new Date().toISOString().split('T')[0];
        return a.dueDate && a.dueDate < today;
    }).length;

    const formatDate = (dateStr?: string) => {
        if (!dateStr) return '';
        const today = new Date().toISOString().split('T')[0];
        if (dateStr === today) return 'Hoje';

        const date = new Date(dateStr);
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    return (
        <div className="glass-card rounded-2xl p-6 flex flex-col h-full border border-white/5">
            <div className="flex items-center justify-between mb-6 shrink-0">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-foreground">Minhas Tarefas</h2>
                    {overdueCount > 0 && (
                        <span className="bg-destructive/10 text-destructive text-[10px] font-black px-2 py-0.5 rounded-full border border-destructive/20 uppercase tracking-widest">
                            {overdueCount} atrasadas
                        </span>
                    )}
                </div>
                <button
                    onClick={() => router.push('/activities')}
                    className="text-sm font-semibold text-primary hover:text-primary/80"
                >
                    Ver Todas
                </button>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {relevantTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center py-8">
                        <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mb-3">
                            <CheckCircle2 className="h-6 w-6 text-success" />
                        </div>
                        <p className="text-muted-foreground text-sm font-medium">Tudo em dia!</p>
                        <p className="text-muted-foreground text-xs mt-1">Nenhuma tarefa pendente para hoje.</p>
                    </div>
                ) : (
                    relevantTasks.slice(0, 5).map((task) => {
                        const isOverdue = task.dueDate && task.dueDate < new Date().toISOString().split('T')[0];

                        return (
                            <div
                                key={task.id}
                                className={`group p-3 rounded-xl transition-all border border-transparent hover:bg-muted/50 cursor-pointer active:scale-[0.98] ${isOverdue ? 'border-l-2 border-l-destructive bg-destructive/5' : ''}`}
                                onClick={() => router.push('/activities')}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`mt-0.5 ${isOverdue ? 'text-destructive' : 'text-muted-foreground group-hover:text-primary'}`}>
                                        {isOverdue ? <AlertCircle className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-sm font-bold truncate ${isOverdue ? 'text-destructive' : 'text-foreground'}`}>
                                            {task.title}
                                        </p>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${task.priority === 'urgent' ? 'bg-destructive/20 text-destructive' :
                                                task.priority === 'high' ? 'bg-warning/20 text-warning' :
                                                    'bg-muted-foreground text-background'
                                                }`}>
                                                {task.priority === 'urgent' ? 'Urgente' : task.priority === 'high' ? 'Alta' : task.priority}
                                            </span>
                                            {task.dueDate && (
                                                <span className={`text-xs flex items-center gap-1 ${isOverdue ? 'text-destructive font-bold' : 'text-muted-foreground'}`}>
                                                    <Calendar className="h-3 w-3" />
                                                    {formatDate(task.dueDate)}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>

            <button
                onClick={() => router.push('/activities')}
                className="w-full mt-6 py-3 rounded-xl border border-dashed border-border text-muted-foreground font-bold text-xs uppercase tracking-widest hover:bg-muted/50 hover:text-foreground transition-all flex items-center justify-center gap-2 group shrink-0"
            >
                <ArrowUpRight className="h-4 w-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                Gerenciar Atividades
            </button>
        </div>
    );
};
