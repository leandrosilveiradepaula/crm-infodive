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
    Ativo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    Inativo: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

export function CustomersTable({ accounts, onEdit, onDelete, onView }: CustomersTableProps) {
    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Empresa</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hidden md:table-cell">CNPJ</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hidden lg:table-cell">Segmento</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hidden lg:table-cell">Cidade / UF</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Contatos</th>
                        <th className="px-4 py-3" />
                    </tr>
                </thead>
                <tbody>
                    {accounts.map((account, i) => (
                        <tr
                            key={account.id}
                            onClick={() => onView?.(account)}
                            className={cn(
                                'border-b border-border/50 hover:bg-muted/20 transition-colors cursor-pointer',
                                i === accounts.length - 1 && 'border-b-0'
                            )}
                        >
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                        <Building2 className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground text-sm leading-tight truncate max-w-[180px]">{account.name}</p>
                                        <p className="text-xs text-muted-foreground font-medium capitalize">{account.relationship_type || 'Cliente'}</p>
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground font-mono hidden md:table-cell">
                                {account.cnpj || '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground font-medium hidden lg:table-cell">
                                {account.segment || '—'}
                            </td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                                {account.city ? (
                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <MapPin className="h-3 w-3 shrink-0" />
                                        {account.city}{account.state ? `, ${account.state}` : ''}
                                    </div>
                                ) : <span className="text-xs text-muted-foreground">—</span>}
                            </td>
                            <td className="px-4 py-3">
                                <span className={cn(
                                    'px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wide',
                                    statusColors[account.status || 'Ativo'] || 'bg-muted text-muted-foreground'
                                )}>
                                    {account.status || 'Ativo'}
                                </span>
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Users className="h-3 w-3" />
                                    {account.contacts?.length || 0}
                                </div>
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-1 justify-end">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(account)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => onDelete(account.id)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {accounts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">Nenhuma empresa encontrada.</div>
            )}
        </div>
    );
}
