'use client';

import { useState, useMemo, useEffect } from 'react';
import {
    Plus, Search, Calendar as CalendarIcon, CheckCircle2, Clock, AlertCircle, Users, Phone, Mail, FileText, Circle, MoreHorizontal, Edit, Trash2,
    MessageSquare, CheckSquare, Loader2, ArrowRight, LayoutGrid, List, Filter,
    Activity as ActivityIcon, Clock3, AlertTriangle, CalendarCheck
} from 'lucide-react';
import type { Activity, ActivityType, ActivityStatus, ActivityPriority } from '@/types/activity';
// import { useActivities } from '../hooks/useActivities'; // Replaced by inline logic
import { getActivities, createActivity, updateActivity, deleteActivity, evaluateInactiveDeals } from './actions';
import { CalendarView } from './components/CalendarView';
import { ActivityModal } from './components/ActivityModal';
import { AiSuggestionsPanel } from '@/components/activities/AiSuggestionsPanel';
import { ThemeInput, ThemeSelect } from '@/components/ui/theme/ThemeComponents';
import { PageHeader } from '@/components/layout/PageHeader';
import { FilterBar } from '@/components/layout/FilterBar';
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';
import { Button } from '@/components/ui/button';

type ViewMode = 'list' | 'calendar';

export function ActivitiesClientPage() {
    // State replacement for useActivities
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [viewMode, setViewMode] = useState<ViewMode>('list');
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<ActivityStatus | 'all'>('all');
    const [filterType, setFilterType] = useState<ActivityType | 'all'>('all');
    const [showNewModal, setShowNewModal] = useState(false);
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await getActivities();
            setActivities(data);
            setError(null);
        } catch (err: any) {
            console.error(err);
            setError('Failed to load activities');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
        // Evaluate inactive deals on module load
        evaluateInactiveDeals().catch(console.error);
    }, []);

    // Wrappers for actions
    const handleAddActivity = async (data: any) => {
        await createActivity(data);
        await fetchData();
    };

    const handleUpdateActivity = async (id: string, data: any) => {
        await updateActivity(id, data);
        await fetchData();
    };

    const handleDeleteActivity = async (id: string) => {
        await deleteActivity(id);
        await fetchData();
    };

    const handleToggleComplete = async (id: string) => {
        const activity = activities.find(a => a.id === id);
        if (!activity) return;

        await updateActivity(id, {
            status: activity.status === 'completed' ? 'pending' : 'completed',
            completedAt: activity.status === 'completed' ? undefined : new Date().toISOString()
        });
        await fetchData();
    };

    // Estatísticas
    const stats = useMemo(() => {
        const now = new Date();
        const today = now.toISOString().split('T')[0];

        return {
            total: activities.length,
            pending: activities.filter(a => a.status === 'pending').length,
            completed: activities.filter(a => a.status === 'completed').length,
            overdue: activities.filter(a =>
                a.status === 'pending' && a.dueDate && a.dueDate < today
            ).length,
            today: activities.filter(a => a.dueDate === today).length
        };
    }, [activities]);

    // Filtros
    const filteredActivities = useMemo(() => {
        // Ensure activities is an array
        const safeActivities = Array.isArray(activities) ? activities : [];
        return safeActivities.filter(activity => {
            const matchesSearch =
                (activity.title || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                (activity.description || '').toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'all' || activity.status === filterStatus;
            const matchesType = filterType === 'all' || activity.type === filterType;

            return matchesSearch && matchesStatus && matchesType;
        });
    }, [activities, searchTerm, filterStatus, filterType]);

    // Agrupar por data
    const groupedActivities = useMemo(() => {
        const groups: Record<string, Activity[]> = {
            overdue: [],
            today: [],
            tomorrow: [],
            thisWeek: [],
            later: [],
            completed: []
        };

        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const tomorrow = new Date(now.getTime() + 86400000).toISOString().split('T')[0];
        const weekEnd = new Date(now.getTime() + 604800000).toISOString().split('T')[0];

        filteredActivities.forEach(activity => {
            if (activity.status === 'completed') {
                groups.completed.push(activity);
            } else if (activity.dueDate) {
                if (activity.dueDate < today) {
                    groups.overdue.push(activity);
                    // Sort overdue by date ascending (oldest first)
                    groups.overdue.sort((a, b) => (a.dueDate || '') > (b.dueDate || '') ? 1 : -1);
                } else if (activity.dueDate === today) {
                    groups.today.push(activity);
                } else if (activity.dueDate === tomorrow) {
                    groups.tomorrow.push(activity);
                } else if (activity.dueDate <= weekEnd) {
                    groups.thisWeek.push(activity);
                } else {
                    groups.later.push(activity);
                }
            } else {
                groups.later.push(activity);
            }
        });

        return groups;
    }, [filteredActivities]);

    const getTypeIcon = (type: ActivityType) => {
        switch (type) {
            case 'meeting': return Users;
            case 'call': return Phone;
            case 'email': return Mail;
            case 'task': return CheckCircle2;
            case 'note': return FileText;
            default: return Circle;
        }
    };

    const handleSaveActivity = async (data: any) => {
        if (editingActivity) {
            await handleUpdateActivity(editingActivity.id, data);
        } else {
            await handleAddActivity(data);
        }
        setShowNewModal(false);
        setEditingActivity(null);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta atividade?')) {
            await handleDeleteActivity(id);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        // Add offset to fix timezone issue if dateStr is simple YYYY-MM-DD
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        return adjustedDate.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    };

    if (loading && activities.length === 0) {
        return (
            <div className="flex items-center justify-center h-full min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-8 pb-10">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 text-red-400 animate-slide-up">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">Erro ao sincronizar dados: {error}</span>
                </div>
            )}

            <PageHeader 
                title="Gestão de Atividades" 
                description="Gerencie tarefas, reuniões e follow-ups"
            >
                <Button 
                    onClick={() => {
                        setEditingActivity(null);
                        setShowNewModal(true);
                    }}
                    className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center gap-2"
                >
                    <Plus className="h-5 w-5" />
                    Nova Atividade
                </Button>
            </PageHeader>

            {/* AI Suggestions Panel */}
            <AiSuggestionsPanel onAccepted={fetchData} />

            {/* KPI Cards */}
            <StatsGrid items={[
                {
                    label: "Total Geral",
                    value: stats.total,
                    description: "Atividades na base",
                    icon: ActivityIcon,
                    color: "text-primary",
                    gradient: "from-primary/5 to-white dark:from-primary/10",
                    border: "border-primary/10"
                },
                {
                    label: "Pendentes",
                    value: stats.pending,
                    description: "Aguardando execução",
                    icon: Clock3,
                    color: "text-amber-600 dark:text-amber-400",
                    gradient: "from-amber-50 to-white dark:from-amber-950/20",
                    border: "border-amber-100 dark:border-amber-900/50"
                },
                {
                    label: "Atrasadas",
                    value: stats.overdue,
                    description: "Atenção requerida",
                    icon: AlertTriangle,
                    color: "text-red-600 dark:text-red-400",
                    gradient: "from-red-50 to-white dark:from-red-950/20",
                    border: "border-red-100 dark:border-red-900/50"
                },
                {
                    label: "Hoje",
                    value: stats.today,
                    description: "Programadas p/ agora",
                    icon: CalendarCheck,
                    color: "text-primary dark:text-blue-400",
                    gradient: "from-blue-50 to-white dark:from-blue-950/20",
                    border: "border-blue-100 dark:border-blue-900/50"
                }
            ]} />

            {/* Filter Bar */}
            <FilterBar>
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <ThemeInput
                        placeholder="Buscar atividade por título ou descrição..."
                        className="pl-11 w-full h-11 bg-muted/30 border-border focus:bg-background transition-all rounded-2xl"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <ThemeSelect
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value as ActivityStatus | 'all')}
                        className="h-11 rounded-2xl bg-muted/30 border-border transition-all"
                    >
                        <option value="all">Todos Status</option>
                        <option value="pending">Pendente</option>
                        <option value="in_progress">Em Progresso</option>
                        <option value="completed">Concluída</option>
                        <option value="cancelled">Cancelada</option>
                    </ThemeSelect>

                    <ThemeSelect
                        value={filterType}
                        onChange={e => setFilterType(e.target.value as ActivityType | 'all')}
                        className="h-11 rounded-2xl bg-muted/30 border-border transition-all"
                    >
                        <option value="all">Todos Tipos</option>
                        <option value="task">Tarefa</option>
                        <option value="meeting">Reunião</option>
                        <option value="call">Ligação</option>
                        <option value="email">Email</option>
                        <option value="note">Nota</option>
                    </ThemeSelect>

                    {/* View Toggle */}
                    <div className="flex gap-1 bg-muted/30 p-1 rounded-full border border-border h-11 items-center">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded-full transition-all ${viewMode === 'list'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <List className="h-4 w-4" />
                        </button>
                        <button
                            onClick={() => setViewMode('calendar')}
                            className={`p-2 rounded-full transition-all ${viewMode === 'calendar'
                                ? 'bg-background text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground'
                                }`}
                        >
                            <CalendarIcon className="h-4 w-4" />
                        </button>
                    </div>
                </div>
            </FilterBar>

            {/* Activities List */}
            {viewMode === 'list' && (
                <div className="space-y-8">
                    {Object.entries(groupedActivities).map(([group, items]) => {
                        if (items.length === 0) return null;

                        const groupTitles: Record<string, string> = {
                            overdue: 'Atividades Atrasadas',
                            today: 'Para Hoje',
                            tomorrow: 'Para Amanhã',
                            thisWeek: 'Esta Semana',
                            later: 'Futuro / Sem Data',
                            completed: 'Concluídas Recentemente'
                        };

                        const groupColors: Record<string, string> = {
                            overdue: 'text-red-500',
                            today: 'text-primary',
                            tomorrow: 'text-muted-foreground',
                            thisWeek: 'text-muted-foreground',
                            later: 'text-muted-foreground',
                            completed: 'text-emerald-500'
                        };

                        return (
                            <div key={group} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <h3 className={`text-[11px] font-black uppercase tracking-widest mb-4 flex items-center gap-2 ${groupColors[group]}`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                    {groupTitles[group]}
                                    <span className="ml-1 opacity-50">({items.length})</span>
                                </h3>
                                <div className="space-y-3">
                                    {items.map(activity => {
                                        const TypeIcon = getTypeIcon(activity.type);
                                        // Fix date check to use ISO string comparison
                                        const nowStr = new Date().toISOString().split('T')[0];
                                        const isOverdue = activity.status === 'pending' && activity.dueDate && activity.dueDate < nowStr;

                                        const typeColors: Record<string, string> = {
                                            meeting: 'text-stage-proposal bg-stage-proposal/10 border-stage-proposal/20',
                                            call: 'text-success bg-success/10 border-success/20',
                                            email: 'text-primary bg-primary/10 border-primary/20',
                                            task: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
                                            note: 'text-muted-foreground bg-gray-500/10 border-gray-500/20'
                                        };

                                        const priorityColors: Record<string, string> = {
                                            urgent: 'text-red-400 bg-red-500/10 border border-red-500/20',
                                            high: 'text-orange-400 bg-orange-500/10 border border-orange-500/20',
                                            medium: 'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20',
                                            low: 'text-muted-foreground bg-gray-500/10 border border-gray-500/20'
                                        };

                                        return (
                                            <div
                                                key={activity.id}
                                                className={`glass-card p-5 rounded-3xl bg-card border border-border hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/10 cursor-pointer group transition-all duration-300 relative overflow-hidden ${activity.status === 'completed' ? 'opacity-40 hover:opacity-60' : ''
                                                    } ${isOverdue ? 'border-l-4 border-l-red-500' : ''}`}
                                                onClick={() => {
                                                    setEditingActivity(activity);
                                                    setShowNewModal(true);
                                                }}
                                            >
                                                {/* Ambient Glow */}
                                                <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity rounded-full -mr-10 -mt-10" />
                                                
                                                <div className="flex items-start gap-5 relative z-10">
                                                    {/* Checkbox */}
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleToggleComplete(activity.id);
                                                        }}
                                                        className="mt-1 flex-shrink-0"
                                                    >
                                                        {activity.status === 'completed' ? (
                                                            <CheckCircle2 className="h-6 w-6 text-success" />
                                                        ) : (
                                                            <Circle className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
                                                        )}
                                                    </button>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                                                            <div className="flex-1">
                                                                <h4 className={`text-lg font-bold text-foreground mb-2 ${activity.status === 'completed' ? 'line-through text-muted-foreground' : ''}`}>
                                                                    {activity.title}
                                                                </h4>
                                                                {activity.description && (
                                                                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2 font-medium">{activity.description}</p>
                                                                )}

                                                                <div className="flex flex-wrap items-center gap-3">
                                                                    {/* Type Badge */}
                                                                    <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 ${typeColors[activity.type]}`}>
                                                                        <TypeIcon className="h-3 w-3" />
                                                                        {activity.type === 'meeting' && 'Reunião'}
                                                                        {activity.type === 'call' && 'Ligação'}
                                                                        {activity.type === 'email' && 'Email'}
                                                                        {activity.type === 'task' && 'Tarefa'}
                                                                        {activity.type === 'note' && 'Nota'}
                                                                    </span>

                                                                    {/* Priority */}
                                                                    <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${priorityColors[activity.priority]}`}>
                                                                        {activity.priority === 'urgent' && '🔥 Urgente'}
                                                                        {activity.priority === 'high' && 'Alta'}
                                                                        {activity.priority === 'medium' && 'Média'}
                                                                        {activity.priority === 'low' && 'Baixa'}
                                                                    </span>

                                                                    {/* Date & Time */}
                                                                    {activity.dueDate && (
                                                                        <span className="flex items-center gap-1.5 text-muted-foreground bg-card/5 px-2.5 py-1 rounded-lg border border-white/5 text-xs font-bold">
                                                                            <CalendarIcon className="h-3.5 w-3.5" />
                                                                            {formatDate(activity.dueDate)}
                                                                            {activity.dueTime && (
                                                                                <>
                                                                                    <span className="w-1 h-1 rounded-full bg-gray-500" />
                                                                                    {activity.dueTime}
                                                                                </>
                                                                            )}
                                                                        </span>
                                                                    )}

                                                                    {/* Assignee */}
                                                                    <span className="bg-card/5 px-2.5 py-1 rounded-lg border border-white/5 text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                                                                        <Users className="h-3 w-3" />
                                                                        {activity.assignedTo || 'Unassigned'}
                                                                    </span>

                                                                    {/* Linked Deal */}
                                                                    {activity.dealTitle && (
                                                                        <span className="bg-primary/10 px-2.5 py-1 rounded-lg border border-primary/20 text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                                                            <List className="h-3 w-3" />
                                                                            {activity.dealTitle}
                                                                        </span>
                                                                    )}

                                                                    {/* Linked Account */}
                                                                    {activity.customerName && (
                                                                        <span className="bg-success/10 px-2.5 py-1 rounded-lg border border-success/20 text-[10px] font-black text-success uppercase tracking-widest flex items-center gap-1">
                                                                            <Users className="h-3 w-3" />
                                                                            {activity.customerName}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>

                                                            {/* Actions */}
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setEditingActivity(activity);
                                                                        setShowNewModal(true);
                                                                    }}
                                                                    className="p-2 bg-muted/50 hover:bg-primary/10 rounded-xl text-muted-foreground hover:text-primary transition-colors border border-border"
                                                                >
                                                                    <Edit className="h-4 w-4" />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleDelete(activity.id);
                                                                    }}
                                                                    className="p-2 bg-card/5 hover:bg-red-500/10 rounded-xl text-muted-foreground hover:text-red-400 transition-colors border border-white/5"
                                                                >
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}

                    {filteredActivities.length === 0 && (
                        <div className="text-center py-20 bg-card rounded-3xl border border-border border-dashed">
                            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted mb-6 border border-border animate-pulse">
                                <List className="h-10 w-10 text-muted-foreground" />
                            </div>
                            <h3 className="text-xl font-black text-foreground mb-2 tracking-tight">Nenhuma atividade encontrada</h3>
                            <p className="text-muted-foreground font-medium">Tente ajustar os filtros ou criar uma nova atividade para começar.</p>
                        </div>
                    )}
                </div>
            )}

            {/* Calendar View */}
            {viewMode === 'calendar' && (
                <CalendarView
                    activities={filteredActivities}
                    onActivityClick={(activity) => {
                        setEditingActivity(activity);
                        setShowNewModal(true);
                    }}
                />
            )}

            {/* Modal */}
            <ActivityModal
                isOpen={showNewModal || !!editingActivity}
                onClose={() => {
                    setShowNewModal(false);
                    setEditingActivity(null);
                }}
                onSave={handleSaveActivity}
                onDelete={handleDeleteActivity}
                activity={editingActivity}
            />
        </div>
    );
}
