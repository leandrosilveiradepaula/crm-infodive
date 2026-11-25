'use client';

import { Contact } from '@/types/contact';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ContactsTableProps {
    contacts: Contact[];
    onEdit: (contact: Contact) => void;
    onDelete: (id: string) => void;
}

export function ContactsTable({ contacts, onEdit, onDelete }: ContactsTableProps) {
    return (
        <div role="region" aria-label="Tabela de contacts" tabIndex={0} data-qa-region="directory-table" className="min-w-0 max-w-full overflow-x-auto focus-ring bg-card border border-border rounded-[var(--radius-panel)]">
            <table aria-label="Contatos" className="w-full min-w-[var(--ds-directory-table-min-width)] text-body-ui">
                <thead>
                    <tr className="border-b border-border bg-muted/30">
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Nome</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">E-mail</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Telefone</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Empresa</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Cargo</th>
                        <th scope="col" className="px-4 py-3 text-right text-label-ui font-semibold text-foreground">Ações</th>
                    </tr>
                </thead>
                <tbody>
                    {contacts.map((contact, i) => {
                        const initials = contact.name
                            .split(' ')
                            .slice(0, 2)
                            .map((n) => n[0])
                            .join('')
                            .toUpperCase();

                        return (
                            <tr
                                key={contact.id}
                                className={cn(
                                    'border-b border-border/50 hover:bg-muted/20 transition-colors',
                                    i === contacts.length - 1 && 'border-b-0'
                                )}
                            >
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-metadata-ui font-semibold text-primary-foreground shadow-control-ui">
                                            {initials}
                                        </div>
                                        <p className="font-bold text-foreground text-body-ui truncate max-w-[150px]">{contact.name}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    {contact.email ? (
                                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-metadata-ui text-muted-foreground hover:text-primary transition-colors">
                                            <Mail className="h-3 w-3 shrink-0" />
                                            <span className="truncate max-w-[180px]">{contact.email}</span>
                                        </a>
                                    ) : <span className="text-metadata-ui text-muted-foreground">—</span>}
                                </td>
                                <td className="px-4 py-3">
                                    {contact.mobile_phone ? (
                                        <a href={`tel:${contact.mobile_phone}`} className="flex items-center gap-1.5 text-metadata-ui text-muted-foreground hover:text-foreground transition-colors">
                                            <Phone className="h-3 w-3 shrink-0" />
                                            {contact.mobile_phone}
                                        </a>
                                    ) : <span className="text-metadata-ui text-muted-foreground">—</span>}
                                </td>
                                <td className="px-4 py-3 text-metadata-ui text-muted-foreground font-medium truncate max-w-[160px]">
                                    {contact.account?.name || '—'}
                                </td>
                                <td className="px-4 py-3 text-metadata-ui text-muted-foreground">
                                    {contact.role || '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1 justify-end">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" aria-label={`Editar contato ${contact.name}`} onClick={() => onEdit(contact)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive-readable" aria-label={`Excluir contato ${contact.name}`} onClick={() => onDelete(contact.id)}>
                                            <Trash2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
            {contacts.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-body-ui">Nenhum contato encontrado.</div>
            )}
        </div>
    );
}
