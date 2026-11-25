import type { Account } from '@/types/account';

type ExportableAccount = Pick<Account, 'name' | 'cnpj' | 'segment' | 'city' | 'state' | 'status' | 'relationship_type'>;

/** Quoting alone is not sufficient to prevent spreadsheet formula injection. */
export function csvCell(value: string | null | undefined): string {
    const text = value ?? '';
    const safe = /^[\s\uFEFF]*[=+\-@\uFF1D\uFF0B\uFF0D\uFF20]|^[\t\r\n]/u.test(text) ? "'" + text : text;
    return '"' + safe.replaceAll('"', '""') + '"';
}

/** Export only the company fields already loaded and authorized in the directory. */
export function buildCustomerCsv(accounts: ExportableAccount[]): string {
    const rows = [
        ['Empresa', 'CNPJ', 'Segmento', 'Cidade', 'UF', 'Status', 'Relacionamento'],
        ...accounts.map(account => [
            account.name, account.cnpj, account.segment, account.city,
            account.state, account.status, account.relationship_type ?? 'Cliente',
        ]),
    ];
    return '\uFEFF' + rows.map(row => row.map(csvCell).join(';')).join('\r\n') + '\r\n';
}
