import { describe, expect, it } from 'vitest';
import { unreadNotificationCount, formatNotificationTime } from './notification-display-policy';

describe('notification display helpers', () => {
    it('counts only unread notifications without changing the input', () => {
        const items = [{ read: false }, { read: true }, { read: false }];
        expect(unreadNotificationCount(items)).toBe(2);
        expect(items[0].read).toBe(false);
    });

    it('formats nearby and older timestamps consistently', () => {
        const now = Date.parse('2026-10-08T21:00:00Z');
        expect(formatNotificationTime(new Date(now), now)).toBe('Agora');
        expect(formatNotificationTime(new Date(now - 5 * 60_000), now)).toBe('5m atrás');
        expect(formatNotificationTime(new Date(now - 2 * 3_600_000), now)).toBe('2h atrás');
        expect(formatNotificationTime(new Date(now - 2 * 86_400_000), now)).toBe('2d atrás');
    });

    it('does not print negative times or NaN for future and invalid dates', () => {
        const now = Date.parse('2026-10-08T21:00:00Z');
        expect(formatNotificationTime(new Date(now + 3_600_000), now)).toBe('Agora');
        expect(formatNotificationTime(new Date('invalid'), now)).toBe('Data indisponível');
    });
});
