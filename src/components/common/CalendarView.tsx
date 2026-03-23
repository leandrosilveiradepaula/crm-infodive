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
        <div className="glass-card p-6 rounded-3xl bg-card border border-border shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black text-foreground tracking-tight">
                    {monthNames[currentMonth]} <span className="text-muted-foreground">{currentYear}</span>
                </h2>
                <div className="flex gap-2">
                    <button className="p-2 hover:bg-muted/50 rounded-xl transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border">
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button className="px-4 py-2 bg-muted hover:bg-muted/80 rounded-xl text-xs font-black uppercase tracking-widest transition-colors text-foreground border border-border">
                        Hoje
                    </button>
                    <button className="p-2 hover:bg-muted/50 rounded-xl transition-colors text-muted-foreground hover:text-foreground border border-transparent hover:border-border">
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-2 mb-4 border-b border-border pb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                    <div key={day} className="text-center text-[10px] font-black text-muted-foreground uppercase tracking-widest">
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
                                ${isCurrentDay ? 'bg-primary/10 border-primary ring-1 ring-primary/50' : 'border-border hover:border-primary/20 hover:bg-muted/50'}
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
                                            text-[10px] px-1.5 py-1 rounded-md truncate font-medium cursor-pointer border
                                            ${activity.type === 'meeting' ? 'bg-purple-500/10 text-purple-500 border-purple-500/20 hover:bg-purple-500/20' : ''}
                                            ${activity.type === 'call' ? 'bg-green-500/10 text-green-500 border-green-500/20 hover:bg-green-500/20' : ''}
                                            ${activity.type === 'task' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20 hover:bg-orange-500/20' : ''}
                                            ${activity.type === 'email' ? 'bg-blue-500/10 text-blue-500 border-blue-500/20 hover:bg-blue-500/20' : ''}
                                            ${activity.type === 'note' ? 'bg-gray-500/10 text-muted-foreground border-gray-500/20 hover:bg-gray-500/20' : ''}
                                        `}
                                        title={activity.title}
                                    >
                                        {activity.dueTime && `${activity.dueTime} `}
                                        {activity.title}
                                    </div>
                                ))}
                                {dayActivities.length > 3 && (
                                    <div className="text-[10px] text-muted-foreground font-medium px-1.5">
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
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded bg-purple-500/20 border border-purple-500/30"></div>
                    <span className="text-muted-foreground">Reunião</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded bg-green-500/20 border border-green-500/30"></div>
                    <span className="text-muted-foreground">Ligação</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded bg-orange-500/20 border border-orange-500/30"></div>
                    <span className="text-muted-foreground">Tarefa</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded bg-blue-500/20 border border-blue-500/30"></div>
                    <span className="text-muted-foreground">Email</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <div className="w-3 h-3 rounded bg-gray-500/20 border border-gray-500/30"></div>
                    <span className="text-muted-foreground">Nota</span>
                </div>
            </div>
        </div>
    );
};
