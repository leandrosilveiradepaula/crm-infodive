import { Bell, X, CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';
import { useState } from 'react';

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface Notification {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: Date;
    read: boolean;
    actionLabel?: string;
    onAction?: () => void;
}

interface NotificationCenterProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onClearAll: () => void;
    onRemove: (id: string) => void;
}

export const NotificationCenter = ({
    notifications,
    onMarkAsRead,
    onClearAll,
    onRemove
}: NotificationCenterProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const unreadCount = notifications.filter(n => !n.read).length;

    const getIcon = (type: NotificationType) => {
        switch (type) {
            case 'success': return CheckCircle;
            case 'error': return AlertCircle;
            case 'warning': return Clock;
            case 'info': return Info;
        }
    };

    const getColor = (type: NotificationType) => {
        switch (type) {
            case 'success': return 'text-green-600 bg-green-50 border-green-200';
            case 'error': return 'text-red-600 bg-red-50 border-red-200';
            case 'warning': return 'text-orange-600 bg-orange-50 border-orange-200';
            case 'info': return 'text-primary bg-blue-50 border-blue-200';
        }
    };

    const formatTime = (date: Date) => {
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);

        if (minutes < 1) return 'Agora';
        if (minutes < 60) return `${minutes}m atrás`;
        if (hours < 24) return `${hours}h atrás`;
        return `${days}d atrás`;
    };

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="relative p-2.5 text-muted-foreground hover:text-primary hover:bg-blue-50 rounded-xl transition-all duration-200 group"
                aria-label={unreadCount > 0 ? `Abrir notificações: ${unreadCount} não lidas` : 'Abrir notificações'}
                title="Notificações"
            >
                <Bell className="h-5 w-5 group-hover:animate-pulse" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-5 w-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown */}
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <div
                        className="fixed inset-0 z-40"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel */}
                    <div className="absolute right-0 top-full mt-2 w-96 bg-card rounded-2xl shadow-2xl border border-border/50 z-50 overflow-hidden animate-slide-up">
                        {/* Header */}
                        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-primary to-blue-900">
                            <div className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-white" />
                                <h3 className="font-bold text-white">Notificações</h3>
                                {unreadCount > 0 && (
                                    <span className="bg-card/20 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                        {unreadCount} novas
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-white/70 hover:text-white transition-colors"
                                aria-label="Fechar notificações"
                                title="Fechar notificações"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Notifications List */}
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <div className="p-8 text-center">
                                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                                    <p className="text-muted-foreground font-medium">Nenhuma notificação</p>
                                    <p className="text-muted-foreground text-sm mt-1">Você está em dia!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map(notification => {
                                        const Icon = getIcon(notification.type);
                                        const colorClass = getColor(notification.type);

                                        return (
                                            <div
                                                key={notification.id}
                                                className={`p-4 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-blue-50/30' : ''}`}
                                                onClick={() => onMarkAsRead(notification.id)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg border flex items-center justify-center ${colorClass}`}>
                                                        <Icon className="h-4 w-4" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <h4 className="font-bold text-foreground text-sm">
                                                                {notification.title}
                                                            </h4>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onRemove(notification.id);
                                                                }}
                                                                className="text-muted-foreground hover:text-red-600 transition-colors"
                                                                aria-label={`Remover notificação: ${notification.title}`}
                                                                title="Remover notificação"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>

                                                        <p className="text-sm text-muted-foreground mb-2">
                                                            {notification.message}
                                                        </p>

                                                        <div className="flex items-center justify-between">
                                                            <span className="text-xs text-muted-foreground">
                                                                {formatTime(notification.timestamp)}
                                                            </span>

                                                            {notification.actionLabel && notification.onAction && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        notification.onAction?.();
                                                                    }}
                                                                    className="text-xs font-bold text-primary hover:text-blue-700 transition-colors"
                                                                >
                                                                    {notification.actionLabel}
                                                                </button>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        {notifications.length > 0 && (
                            <div className="p-3 border-t border-border/50 bg-muted/50">
                                <button
                                    onClick={onClearAll}
                                    className="w-full py-2 text-sm font-bold text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Limpar todas
                                </button>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

// Hook para gerenciar notificações
export const useNotifications = () => {
    const [notifications, setNotifications] = useState<Notification[]>([]);

    const addNotification = (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
        const newNotification: Notification = {
            ...notification,
            id: `notif-${Date.now()}-${Math.random()}`,
            timestamp: new Date(),
            read: false
        };
        setNotifications(prev => [newNotification, ...prev]);
    };

    const markAsRead = (id: string) => {
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
    };

    const remove = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    };

    const clearAll = () => {
        setNotifications([]);
    };

    return {
        notifications,
        addNotification,
        markAsRead,
        remove,
        clearAll
    };
};
