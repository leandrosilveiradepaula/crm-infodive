'use client';

import { type Account } from '@/types/account';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Building2, MapPin, Users } from 'lucide-react';
import { cn } from '@/lib/utils';

interface CustomersTableProps {
    accounts: Account[];
    onEdit: (account: Account) => void;
    onDelete: (id: string) => void;
    onView?: (account: Account) => void;
}

const statusColors: Record<string, string> = {
    Ativo: 'bg-success-subtle text-success-readable dark:bg-success/30 dark:text-success-readable',
    Inativo: 'bg-destructive-subtle text-destructive-readable dark:bg-destructive/30 dark:text-destructive-readable',
};

export function CustomersTable({ accounts, onEdit, onDelete, onView }: CustomersTableProps) {
    return (
        <div role="region" aria-label="Tabela de empresas" tabIndex={0} data-qa-region="directory-table" className="min-w-0 max-w-full overflow-x-auto focus-ring bg-card border border-border rounded-[var(--radius-panel)]">
            <table aria-label="Empresas" className="w-full min-w-[var(--ds-directory-table-min-width)] text-body-ui">
                <thead>
                    <tr className="border-b border-border bg-muted/30">
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Empresa</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">CNPJ</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Segmento</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Cidade / UF</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Status</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Contatos</th>
                        <th scope="col" className="px-4 py-3 text-right text-label-ui font-semibold text-foreground">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {accounts.map((account, i) => (
                        <tr
                            key={account.id}
                            className={cn(
                                'border-b border-border/50 hover:bg-muted/20 transition-colors',
                                i === accounts.length - 1 && 'border-b-0'
                            )}
                        >
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-[var(--radius-control)] bg-primary/10 flex items-center justify-center shrink-0">
                                        <Building2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        {onView ? (
                                            <button type="button" className="focus-ring rounded-[var(--radius-control)] text-left font-semibold text-foreground text-body-ui underline underline-offset-4" aria-label={`Abrir empresa ${account.name}`} onClick={() => onView(account)}>
                                                {account.name}
                                            </button>
                                        ) : <p className="font-semibold text-foreground text-body-ui">{account.name}</p>}
                                        <p className="text-metadata-ui text-muted-foreground font-medium capitalize">{account.relationship_type || 'Cliente'}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-metadata-ui text-muted-foreground font-mono">
                                {account.cnpj || '—'}
                            </td>
                            <td className="px-4 py-3 text-metadata-ui text-muted-foreground font-medium">
                                {account.segment || '—'}
                            </td>
                            <td className="px-4 py-3">
                                {account.city ? (
                                    <div className="flex items-center gap-1 text-metadata-ui text-muted-foreground">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        {account.city}{account.state ? `, ${account.state}` : ''}
                                    </div>
                                ) : <span className="text-metadata-ui text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-3">
                                <span className={cn(
                                    'px-2 py-0.5 rounded-full text-metadata-ui font-medium',
                                    statusColors[account.status || 'Ativo'] || 'bg-muted text-muted-foreground'
                                )}>
                                    {account.status || 'Ativo'}
                                </span>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-1 text-metadata-ui text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    {account.contacts?.length || 0}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-1 justify-end">
                                    <Button aria-label={`Editar empresa ${account.name}`} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(account)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button aria-label={`Excluir empresa ${account.name}`} variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive-readable" onClick={() => onDelete(account.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {accounts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-body-ui">Nenhuma empresa encontrada.</div>
            )}
        </div>
    );
}
