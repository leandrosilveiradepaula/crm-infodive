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
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Nome</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hidden md:table-cell">E-mail</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hidden lg:table-cell">Telefone</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Empresa</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hidden lg:table-cell">Cargo</th>
                        <th className="px-4 py-3" />
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
                                        <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center shrink-0 text-xs font-black text-white shadow-sm">
                                            {initials}
                                        </div>
                                        <p className="font-bold text-foreground text-sm truncate max-w-[150px]">{contact.name}</p>
                                    </div>
                                </td>
                                <td className="px-4 py-3 hidden md:table-cell">
                                    {contact.email ? (
                                        <a href={`mailto:${contact.email}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors">
                                            <Mail className="h-3 w-3 shrink-0" />
                                            <span className="truncate max-w-[180px]">{contact.email}</span>
                                        </a>
                                    ) : <span className="text-xs text-muted-foreground">—</span>}
                                </td>
                                <td className="px-4 py-3 hidden lg:table-cell">
                                    {contact.mobile_phone ? (
                                        <a href={`tel:${contact.mobile_phone}`} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors">
                                            <Phone className="h-3 w-3 shrink-0" />
                                            {contact.mobile_phone}
                                        </a>
                                    ) : <span className="text-xs text-muted-foreground">—</span>}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground font-medium hidden sm:table-cell truncate max-w-[160px]">
                                    {contact.account?.name || '—'}
                                </td>
                                <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                                    {contact.role || '—'}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-1 justify-end">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(contact)}>
                                            <Pencil className="h-3.5 w-3.5" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => onDelete(contact.id)}>
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
                <div className="text-center py-12 text-muted-foreground text-sm">Nenhum contato encontrado.</div>
            )}
        </div>
    );
}
