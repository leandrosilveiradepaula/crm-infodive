import type { Account } from '@/types/account';

const DANGEROUS_SPREADSHEET_PREFIX = /^[=+\-@]/;

export function escapeCsvCell(value: unknown): string {
    const raw = value == null ? '' : String(value);
    const safe = DANGEROUS_SPREADSHEET_PREFIX.test(raw) ? `'${raw}` : raw;
    return `"${safe.replace(/"/g, '""')}"`;
}

export function accountsToCsv(accounts: Account[]): string {
    const headers = [
        'Nome',
        'CNPJ',
        'IE',
        'Segmento',
        'Status',
        'Relacionamento',
        'Cidade',
        'Estado',
        'CEP',
        'Endereco',
        'Numero',
        'Complemento',
        'Bairro',
        'Condicoes de Pagamento',
        'Contatos'
    ];

    const rows = accounts.map(account => [
        account.name,
        account.cnpj,
        account.ie,
        account.segment,
        account.status,
        account.relationship_type || 'Cliente',
        account.city,
        account.state,
        account.zip,
        account.street,
        account.number,
        account.complement || '',
        account.neighborhood,
        account.payment_terms || '',
        account.contacts?.length || 0
    ]);

    return [
        headers.map(escapeCsvCell).join(','),
        ...rows.map(row => row.map(escapeCsvCell).join(','))
    ].join('\r\n');
}
