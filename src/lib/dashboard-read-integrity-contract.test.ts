import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const service = readFileSync('src/services/DashboardService.ts', 'utf8');
const actions = readFileSync('src/app/(dashboard)/dashboard/actions.ts', 'utf8');

describe('dashboard read security contract', () => {
    it('delegates full deal-list lookup to an owner-scoped service', () => {
        expect(actions).toContain('DashboardService.getDashboardDeals(userId, organizationId)');
        expect(actions).not.toContain("if (error) return []");
        expect(service).toContain('private static async canViewAllDeals(');
        expect(service).toContain("query = query.eq('owner_id', userId)");
    });

    it('does not silently mask SQL errors as valid zero indicators or empty recent deals', () => {
        expect(service).toContain('Não foi possível carregar os indicadores do dashboard.');
        expect(service).toContain('Não foi possível carregar as oportunidades recentes.');
        expect(service).toContain('Não foi possível carregar os responsáveis.');
        expect(service).toContain('Não foi possível carregar as contas.');
    });
});
