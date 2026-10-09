export function unreadNotificationCount<T extends { read: boolean }>(notifications: T[]): number {
    return notifications.reduce((count, item) => count + (item.read ? 0 : 1), 0);
}

export function formatNotificationTime(date: Date, nowMs = Date.now()): string {
    const thenMs = date instanceof Date ? date.getTime() : Number.NaN;
    if (!Number.isFinite(thenMs) || !Number.isFinite(nowMs)) return 'Data indisponível';
    const minutes = Math.max(0, Math.floor((nowMs - thenMs) / 60_000));
    if (minutes < 1) return 'Agora';
    if (minutes < 60) return `${minutes}m atrás`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h atrás`;
    return `${Math.floor(hours / 24)}d atrás`;
}
