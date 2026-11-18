/* Test-only actions. No production URLs, credentials, account data or mutations. */
export async function getSuggestions(dealId?: string) {
    if (dealId !== 'synthetic-active') return [];
    return [{
        id: 'synthetic-suggestion-1',
        organizationId: 'synthetic-organization',
        dealId: 'synthetic-deal',
        dealTitle: 'Oportunidade fictícia',
        companyName: 'Empresa fictícia',
        type: 'call',
        title: 'Reativar oportunidade fictícia',
        description: 'Exemplo de teste não produtivo',
        priority: 'high',
        reasoning: 'Validar legibilidade do texto ao lado do gráfico.',
        status: 'pending',
        createdAt: '2026-01-01T00:00:00Z',
        expiresAt: '2030-01-01T00:00:00Z',
    }];
}
export async function acceptSuggestion(_id: string) { throw new Error('Mutations are disabled in the synthetic QA harness'); }
export async function dismissSuggestion(_id: string) { throw new Error('Mutations are disabled in the synthetic QA harness'); }
