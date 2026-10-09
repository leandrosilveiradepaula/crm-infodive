import { Bell, X, CheckCircle, AlertCircle, Clock, Info } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { unreadNotificationCount, formatNotificationTime } from '@/lib/notification-display-policy';

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
    const unreadCount = unreadNotificationCount(notifications);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const closeRef = useRef<HTMLButtonElement>(null);
    const closePanel = () => {
        setIsOpen(false);
        triggerRef.current?.focus();
    };

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

    useEffect(() => {
        if (!isOpen) return;
        closeRef.current?.focus();

        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                event.preventDefault();
                closePanel();
                return;
            }
            if (event.key !== 'Tab') return;
            const focusable = Array.from(panelRef.current?.querySelectorAll<HTMLButtonElement>(
                'button:not(:disabled)'
            ) ?? []);
            if (!focusable.length) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];
            if (event.shiftKey && document.activeElement === first) {
                event.preventDefault();
                last.focus();
            } else if (!event.shiftKey && document.activeElement === last) {
                event.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKeyDown);
        return () => document.removeEventListener('keydown', onKeyDown);
    }, [isOpen]);

    return (
        <div className="relative">
            {/* Bell Icon */}
            <button
                ref={triggerRef}
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                aria-expanded={isOpen}
                aria-controls="crm-notification-panel"
                aria-haspopup="dialog"
                className="relative p-2.5 text-muted-foreground hover:text-primary hover:bg-muted rounded-xl transition-all duration-200 group focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
                    <button
                        type="button"
                        tabIndex={-1}
                        aria-hidden="true"
                        className="fixed inset-0 z-40"
                        onClick={closePanel}
                    />

                    {/* Panel */}
                    <div
                        id="crm-notification-panel"
                        ref={panelRef}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="crm-notification-title"
                        className="absolute right-0 top-full mt-2 w-[calc(100vw-1.5rem)] max-w-96 bg-card text-foreground rounded-2xl shadow-2xl border border-border z-50 overflow-hidden animate-slide-up"
                    >
                        {/* Header */}
                        <div className="p-4 border-b border-border/50 flex items-center justify-between bg-gradient-to-r from-primary to-blue-900">
                            <div className="flex items-center gap-2">
                                <Bell className="h-5 w-5 text-white" />
                                <h3 id="crm-notification-title" className="font-bold text-white">Notificações</h3>
                                {unreadCount > 0 && (
                                    <span className="bg-card/20 text-white px-2 py-0.5 rounded-full text-xs font-bold">
                                        {unreadCount} novas
                                    </span>
                                )}
                            </div>
                            <button
                                ref={closeRef}
                                type="button"
                                onClick={closePanel}
                                className="rounded-md p-2 text-white hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
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
                                <div className="divide-y divide-border">
                                    {notifications.map(notification => {
                                        const Icon = getIcon(notification.type);
                                        const colorClass = getColor(notification.type);

                                        return (
                                            <div
                                                key={notification.id}
                                                className={`p-4 transition-colors ${!notification.read ? 'bg-muted/30' : ''}`}
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
                                                                className="rounded-md p-2 text-muted-foreground hover:text-destructive transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
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
                                                                {formatNotificationTime(notification.timestamp)}
                                                            </span>

                                                            <div className="flex items-center gap-2">
                                                                {!notification.read && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => onMarkAsRead(notification.id)}
                                                                        className="rounded-md px-2 py-1 text-xs font-semibold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                                                        aria-label={`Marcar como lida: ${notification.title}`}
                                                                    >
                                                                        Marcar como lida
                                                                    </button>
                                                                )}
                                                            {notification.actionLabel && notification.onAction && (
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        notification.onAction?.();
                                                                    }}
                                                                    type="button"
                                                                    className="rounded-md px-2 py-1 text-xs font-bold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                                                                >
                                                                    {notification.actionLabel}
                                                                </button>
                                                            )}
                                                            </div>
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
                                    type="button"
                                    className="w-full rounded-md py-2 text-sm font-bold text-muted-foreground hover:text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring transition-colors"
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
