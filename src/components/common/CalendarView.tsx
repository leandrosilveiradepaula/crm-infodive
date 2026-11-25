import { useMemo } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Activity } from '../../types/activity';

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
            if (activity.dueDate) {
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
        <div className="glass-card p-6 rounded-[var(--radius-panel)] bg-card border border-border shadow-card-ui">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-metric-ui font-black text-foreground tracking-tight">
                    {monthNames[currentMonth]} <span className="text-muted-foreground">{currentYear}</span>
                </h2>
                <div className="flex gap-2">
                    <button 
                        className="p-3 hover:bg-muted/50 rounded-[var(--radius-panel)] transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Mês anterior"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button className="px-6 py-2 bg-muted hover:bg-muted/80 rounded-[var(--radius-panel)] text-metadata-ui font-black uppercase tracking-widest transition-colors text-foreground border border-border min-h-[44px]">
                        Hoje
                    </button>
                    <button 
                        className="p-3 hover:bg-muted/50 rounded-[var(--radius-panel)] transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border min-w-[44px] min-h-[44px] flex items-center justify-center"
                        aria-label="Próximo mês"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-2 mb-4 border-b border-border pb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-metadata-ui font-black text-muted-foreground uppercase tracking-widest">
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
                            role="button"
                            tabIndex={0}
                            aria-label={`Dia ${date.getDate()} de ${monthNames[date.getMonth()]}, ${dayActivities.length} atividades`}
                            className={`
                                min-h-24 p-2 rounded-[var(--radius-control)] border transition-all cursor-pointer
                                ${isCurrentDay ? 'bg-primary/10 border-primary ring-1 ring-primary/50' : 'border-border hover:border-primary/20 hover:bg-muted/50'}
                                ${isOtherMonth ? 'opacity-30' : ''}
                            `}
                        >
                            <div className={`text-body-ui font-bold mb-1 ${isCurrentDay ? 'text-primary' : 'text-muted-foreground'}`}>
                                {date.getDate()}
                            </div>

                            {/* Atividades do dia */}
                            <div className="space-y-1">
                                {dayActivities.slice(0, 3).map(activity => (
                                    <div
                                        key={activity.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onActivityClick(activity);
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                onActivityClick(activity);
                                            }
                                        }}
                                        className={`
                                            text-metadata-ui px-1.5 py-1 rounded-[var(--radius-control)] truncate font-medium cursor-pointer border
                                            ${activity.type === 'meeting' ? 'bg-info/10 text-info border-info/20 hover:bg-info/20' : ''}
                                            ${activity.type === 'call' ? 'bg-success/10 text-success-readable border-success/20 hover:bg-success/20' : ''}
                                            ${activity.type === 'task' ? 'bg-warning/10 text-warning-readable border-warning/20 hover:bg-warning/20' : ''}
                                            ${activity.type === 'email' ? 'bg-primary/10 text-primary border-primary/20 hover:bg-primary/20' : ''}
                                            ${activity.type === 'note' ? 'bg-muted/10 text-muted-foreground border-border/20 hover:bg-muted/20' : ''}
                                        `}
                                        title={activity.title}
                                    >
                                        {activity.dueTime && `${activity.dueTime} `}
                                        {activity.title}
                                    </div>
                                ))}
                                {dayActivities.length > 3 && (
                                    <div className="text-metadata-ui text-muted-foreground font-medium px-1.5">
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
                <div className="flex items-center gap-2 text-metadata-ui">
                    <div className="w-3 h-3 rounded bg-info/20 border border-info/30"></div>
                    <span className="text-muted-foreground">Reunião</span>
                </div>
                <div className="flex items-center gap-2 text-metadata-ui">
                    <div className="w-3 h-3 rounded bg-success/20 border border-success/30"></div>
                    <span className="text-muted-foreground">Ligação</span>
                </div>
                <div className="flex items-center gap-2 text-metadata-ui">
                    <div className="w-3 h-3 rounded bg-warning/20 border border-warning/30"></div>
                    <span className="text-muted-foreground">Tarefa</span>
                </div>
                <div className="flex items-center gap-2 text-metadata-ui">
                    <div className="w-3 h-3 rounded bg-primary/20 border border-primary/30"></div>
                    <span className="text-muted-foreground">Email</span>
                </div>
                <div className="flex items-center gap-2 text-metadata-ui">
                    <div className="w-3 h-3 rounded bg-muted/20 border border-border/30"></div>
                    <span className="text-muted-foreground">Nota</span>
                </div>
            </div>
        </div>
    );
};
