import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Activity } from '@/types/activity';

interface CalendarViewProps {
    activities: Activity[];
    onActivityClick: (activity: Activity) => void;
}

export const CalendarView = ({ activities, onActivityClick }: CalendarViewProps) => {
    const today = new Date();
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    // Gerar dias do mês
    const daysInMonth = useMemo(() => {
        const firstDay = new Date(currentYear, currentMonth, 1);
        const lastDay = new Date(currentYear, currentMonth + 1, 0);
        const daysArray: Date[] = [];

        // Dias do mês anterior para preencher a primeira semana
        const firstDayOfWeek = firstDay.getDay();
        for (let i = firstDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(currentYear, currentMonth, -i);
            daysArray.push(date);
        }

        // Dias do mês atual
        for (let i = 1; i <= lastDay.getDate(); i++) {
            daysArray.push(new Date(currentYear, currentMonth, i));
        }

        // Dias do próximo mês para completar a última semana
        const remainingDays = 42 - daysArray.length; // 6 semanas * 7 dias
        for (let i = 1; i <= remainingDays; i++) {
            daysArray.push(new Date(currentYear, currentMonth + 1, i));
        }

        return daysArray;
    }, [currentMonth, currentYear]);

    // Agrupar atividades por data
    const activitiesByDate = useMemo(() => {
        const grouped: Record<string, Activity[]> = {};

        activities.forEach(activity => {
            if (activity.dueDate) { // Changed from camelCase check to assuming type matches
                // Note: The Activity type in src/types/activity.ts might be different. 
                // I need to ensure the Activity type used here matches what client-page passes. 
                // client-page will map DB snake_case to camelCase activity.
                const dateKey = activity.dueDate;
                if (!grouped[dateKey]) {
                    grouped[dateKey] = [];
                }
                grouped[dateKey].push(activity);
            }
        });

        return grouped;
    }, [activities]);

    const formatDateKey = (date: Date) => {
        return date.toISOString().split('T')[0];
    };

    const isToday = (date: Date) => {
        const todayStr = today.toISOString().split('T')[0];
        const dateStr = date.toISOString().split('T')[0];
        return todayStr === dateStr;
    };

    const isCurrentMonth = (date: Date) => {
        return date.getMonth() === currentMonth;
    };

    const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

    return (
        <div className="glass-card p-6 rounded-3xl bg-card border border-border shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-border">
                <h2 className="text-3xl font-black text-foreground tracking-tighter">
                    {monthNames[currentMonth]} <span className="text-muted-foreground/60">{currentYear}</span>
                </h2>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-accent rounded-xl transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border/50">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button className="px-4 py-2 bg-accent hover:bg-accent/80 rounded-xl text-xs font-black uppercase tracking-widest transition-colors text-foreground border border-border/50">
                        Hoje
                    </button>
                    <button className="p-2 hover:bg-accent rounded-xl transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border/50">
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-2 mb-4 border-b border-border/50 pb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-xs font-black text-muted-foreground uppercase tracking-widest">
                        {day}
                    </div>
                ))}
            </div>

            {/* Grid de dias */}
            <div className="grid grid-cols-7 gap-2">
                {daysInMonth.map((date, index) => {
                    const dateKey = formatDateKey(date);
                    const dayActivities = activitiesByDate[dateKey] || [];
                    const isCurrentDay = isToday(date);
                    const isOtherMonth = !isCurrentMonth(date);

                    return (
                        <div
                            key={index}
                            className={`
                                min-h-24 p-2 rounded-lg border transition-all cursor-pointer
                                ${isCurrentDay ? 'bg-primary/10 border-primary ring-1 ring-primary/50' : 'border-border/50 hover:border-border hover:bg-accent/50'}
                                ${isOtherMonth ? 'opacity-30' : ''}
                            `}
                        >
                            <div className={`text-sm font-bold mb-1 ${isCurrentDay ? 'text-primary' : 'text-muted-foreground'}`}>
                                {date.getDate()}
                            </div>

                            {/* Atividades do dia */}
                            <div className="space-y-1">
                                {dayActivities.slice(0, 3).map(activity => (
                                    <div
                                        key={activity.id}
                                        onClick={() => onActivityClick(activity)}
                                        className={`
                                            text-xs px-2 py-1.5 rounded-lg truncate font-black uppercase tracking-wider cursor-pointer border transition-all hover:scale-[1.02] active:scale-95
                                            ${activity.type === 'meeting' ? 'bg-stage-proposal/10 text-stage-proposal border-stage-proposal/20 hover:bg-stage-proposal/20' : ''}
                                            ${activity.type === 'call' ? 'bg-success/10 text-success border-success/20 hover:bg-success/20' : ''}
                                            ${activity.type === 'task' ? 'bg-warning/10 text-warning border-warning/20 hover:bg-warning/20' : ''}
                                            ${activity.type === 'email' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : ''}
                                            ${activity.type === 'note' ? 'bg-muted text-muted-foreground border-border hover:bg-muted/80' : ''}
                                        `}
                                        title={activity.title}
                                    >
                                        {activity.dueTime && `${activity.dueTime} `}
                                        {activity.title}
                                    </div>
                                ))}
                                {dayActivities.length > 3 && (
                                    <div className="text-xs text-muted-foreground font-black uppercase tracking-widest px-2 pt-1 opacity-60">
                                        +{dayActivities.length - 3} mais
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-4 mt-6 pt-6 border-t border-border">
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                    <div className="w-2.5 h-2.5 rounded-full bg-stage-proposal/20 border border-stage-proposal/30"></div>
                    <span className="text-muted-foreground">Reunião</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                    <div className="w-2.5 h-2.5 rounded-full bg-success/20 border border-success/30"></div>
                    <span className="text-muted-foreground">Ligação</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                    <div className="w-2.5 h-2.5 rounded-full bg-warning/20 border border-warning/30"></div>
                    <span className="text-muted-foreground">Tarefa</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                    <div className="w-2.5 h-2.5 rounded-full bg-primary/20 border border-primary/30"></div>
                    <span className="text-muted-foreground">Email</span>
                </div>
                <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest">
                    <div className="w-2.5 h-2.5 rounded-full bg-muted border border-border"></div>
                    <span className="text-muted-foreground">Nota</span>
                </div>
            </div>
        </div>
    );
};
