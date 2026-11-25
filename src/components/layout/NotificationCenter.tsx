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
            case 'success': return 'text-success-readable bg-success-subtle border-success';
            case 'error': return 'text-destructive-readable bg-destructive-subtle border-destructive';
            case 'warning': return 'text-warning-readable bg-warning-subtle border-warning';
            case 'info': return 'text-primary bg-surface-highlight border-primary';
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
                className="relative p-2.5 text-muted-foreground hover:text-primary hover:bg-surface-highlight rounded-[var(--radius-panel)] transition-all duration-200 group"
            >
                <Bell className="h-5 w-5 group-hover:animate-pulse" />
                {unreadCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 h-5 w-5 bg-destructive text-white text-metadata-ui font-bold rounded-full flex items-center justify-center ring-2 ring-white animate-pulse">
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
                    <div className="absolute right-0 top-full mt-2 w-96 bg-card rounded-[var(--radius-panel)] shadow-card-ui border border-border/50 z-50 overflow-hidden animate-slide-up">
                        {/* Header */}
                        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-primary text-primary-foreground">
                            <div className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-primary-foreground" />
                                <h3 className="font-bold text-primary-foreground">Notificações</h3>
                                {unreadCount > 0 && (
                                    <span className="bg-primary-foreground/10 text-primary-foreground px-2 py-0.5 rounded-full text-metadata-ui font-bold">
                                        {unreadCount} novas
                                    </span>
                                )}
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-primary-foreground hover:text-primary-foreground transition-colors"
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
                                    <p className="text-muted-foreground text-body-ui mt-1">Você está em dia!</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-100">
                                    {notifications.map(notification => {
                                        const Icon = getIcon(notification.type);
                                        const colorClass = getColor(notification.type);

                                        return (
                                            <div
                                                key={notification.id}
                                                className={`p-4 hover:bg-muted/50 transition-colors ${!notification.read ? 'bg-surface-highlight/30' : ''}`}
                                                onClick={() => onMarkAsRead(notification.id)}
                                            >
                                                <div className="flex gap-3">
                                                    <div className={`flex-shrink-0 w-8 h-8 rounded-[var(--radius-control)] border flex items-center justify-center ${colorClass}`}>
                                                        <Icon className="h-4 w-4" />
                                                    </div>

                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-start justify-between gap-2 mb-1">
                                                            <h4 className="font-bold text-foreground text-body-ui">
                                                                {notification.title}
                                                            </h4>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    onRemove(notification.id);
                                                                }}
                                                                className="text-muted-foreground hover:text-destructive-readable transition-colors"
                                                            >
                                                                <X className="h-4 w-4" />
                                                            </button>
                                                        </div>

                                                        <p className="text-body-ui text-muted-foreground mb-2">
                                                            {notification.message}
                                                        </p>

                                                        <div className="flex items-center justify-between">
                                                            <span className="text-metadata-ui text-muted-foreground">
                                                                {formatTime(notification.timestamp)}
                                                            </span>

                                                            {notification.actionLabel && notification.onAction && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        notification.onAction?.();
                                                                    }}
                                                                    className="text-metadata-ui font-bold text-primary hover:text-primary transition-colors"
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
                                    className="w-full py-2 text-body-ui font-bold text-muted-foreground hover:text-primary transition-colors"
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
