import { describe, expect, it } from 'vitest';
import { getRequestId } from './request-context';

describe('request correlation', () => {
    it('preserves a valid upstream UUID', () => {
        const id = '7b4f02e0-2c54-4c22-8f77-2f3299662584';
        expect(getRequestId(id)).toBe(id);
    });

    it('replaces invalid request ids with a UUID', () => {
        const generated = getRequestId('customer@example.com');
        expect(generated).toMatch(/^[0-9a-f-]{36}$/i);
        expect(generated).not.toContain('@');
    });
});
