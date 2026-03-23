export type ActivityType = 'task' | 'meeting' | 'call' | 'email' | 'note';
export type ActivityPriority = 'low' | 'medium' | 'high' | 'urgent';
export type ActivityStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled';

export interface Activity {
    id: string;
    type: ActivityType;
    title: string;
    description?: string;
    status: ActivityStatus;
    priority: ActivityPriority;

    // Relacionamentos
    dealId?: string;
    dealTitle?: string; // Populated by join
    customerId?: string;
    customerName?: string; // Populated by join
    assignedTo: string; // User ID

    // Datas
    dueDate?: string;
    dueTime?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;

    // Metadados
    reminder?: number; // Minutos antes
    location?: string; // Para reuniões
    attendees?: string[]; // Para reuniões
    duration?: number; // Minutos

    // Resultado
    outcome?: string;
    nextSteps?: string;
}

export interface ActivityFilter {
    type?: ActivityType[];
    status?: ActivityStatus[];
    priority?: ActivityPriority[];
    assignedTo?: string;
    dateRange?: {
        start: string;
        end: string;
    };
    searchTerm?: string;
}

export interface ActivityStats {
    total: number;
    pending: number;
    completed: number;
    overdue: number;
    today: number;
    thisWeek: number;
}
