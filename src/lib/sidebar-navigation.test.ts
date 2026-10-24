import { describe, expect, it } from 'vitest';
import { isSidebarNavActive } from './sidebar-navigation';

describe('sidebar navigation active state', () => {
    it('marks an exact route active', () => {
        expect(isSidebarNavActive('/pipeline', '/pipeline')).toBe(true);
    });

    it('keeps its parent active when navigating to a detail or edit page', () => {
        expect(isSidebarNavActive('/pipeline/deal-1', '/pipeline')).toBe(true);
        expect(isSidebarNavActive('/customers/account-1/edit', '/customers')).toBe(true);
    });

    it('does not mark similarly prefixed sibling routes as active', () => {
        expect(isSidebarNavActive('/sales-forecast', '/sales')).toBe(false);
        expect(isSidebarNavActive('/pipeline-v2', '/pipeline')).toBe(false);
    });

    it('rejects invalid navigation inputs safely', () => {
        expect(isSidebarNavActive(null, '/pipeline')).toBe(false);
        expect(isSidebarNavActive('/pipeline', '')).toBe(false);
        expect(isSidebarNavActive('/pipeline', '/')).toBe(false);
    });
});
