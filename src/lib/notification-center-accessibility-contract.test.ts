import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const source = readFileSync('src/components/layout/NotificationCenter.tsx', 'utf8');

describe('notification center accessibility wiring', () => {
    it('labels open/close state and keeps a responsive dialog', () => {
        expect(source).toContain('aria-expanded={isOpen}');
        expect(source).toContain('aria-controls="crm-notification-panel"');
        expect(source).toContain('role="dialog"');
        expect(source).toContain('aria-modal="true"');
        expect(source).toContain('aria-labelledby="crm-notification-title"');
        expect(source).toContain('w-[calc(100vw-1.5rem)]');
    });

    it('restores trigger focus and closes with Escape and backdrop', () => {
        expect(source).toContain('triggerRef.current?.focus()');
        expect(source).toContain("event.key === 'Escape'");
        expect(source).toContain("event.key !== 'Tab'");
        expect(source).toContain('last.focus()');
        expect(source).toContain('first.focus()');
        expect(source).toContain('onClick={closePanel}');
    });

    it('supports explicit keyboard-operable mark-as-read and removal actions', () => {
        expect(source).toContain('onMarkAsRead(notification.id)');
        expect(source).toContain('Marcar como lida:');
        expect(source).toContain('onRemove(notification.id)');
        expect(source).toContain('focus-visible:outline-2');
        expect(source).not.toContain('onClick={() => onMarkAsRead(notification.id)}\n                                            >');
    });

    it('uses stable display policy helpers', () => {
        expect(source).toContain('unreadNotificationCount(notifications)');
        expect(source).toContain('formatNotificationTime(notification.timestamp)');
    });
});
