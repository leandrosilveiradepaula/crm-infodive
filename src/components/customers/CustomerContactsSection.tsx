import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';
import { ThemeInput, ThemeSectionHeader } from '@/components/ui/theme/ThemeComponents';
import { type AccountContact } from '@/types/account';

interface CustomerContactsSectionProps {
    contacts: AccountContact[];
    onAddContact: () => void;
    onUpdateContact: (id: string, field: keyof AccountContact, value: any) => void;
    onRemoveContact: (id: string) => void;
    onSetPrimary: (id: string) => void;
}

export function CustomerContactsSection({ contacts, onAddContact, onUpdateContact, onRemoveContact, onSetPrimary }: CustomerContactsSectionProps) {
    return (
        <div className="space-y-4 pt-6 border-t border-border">
            <div className="flex justify-between items-center h-6 mb-2">
                <ThemeSectionHeader title="Contatos" iconColor="bg-success" />
                <Button type="button" size="sm" variant="ghost" onClick={onAddContact} className="h-6 text-metadata-ui font-bold uppercase tracking-wide text-success-readable hover:text-success-readable hover:bg-success/10 px-2 rounded-[var(--radius-control)]">
                    <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
            </div>

            <div className="space-y-3">
                {contacts.map((contact) => (
                    <div key={contact.id} className="grid grid-cols-12 gap-3 items-center bg-card p-3 rounded-[var(--radius-panel)] border border-border group hover:border-muted-foreground/30 transition-colors">
                        <div className="col-span-3">
                            <ThemeInput
                                aria-label="Nome do contato" placeholder="Nome"
                                value={contact.name || ''}
                                onChange={(e) => onUpdateContact(contact.id, 'name', e.target.value)}
                                className="h-[30px] text-metadata-ui bg-transparent border-transparent focus:bg-muted/50 focus:border-border"
                            />
                        </div>
                        <div className="col-span-3">
                            <ThemeInput
                                aria-label="Email do contato" placeholder="Email"
                                value={contact.email || ''}
                                onChange={(e) => onUpdateContact(contact.id, 'email', e.target.value)}
                                className="h-[30px] text-metadata-ui bg-transparent border-transparent focus:bg-muted/50 focus:border-border"
                            />
                        </div>
                        <div className="col-span-3">
                            <ThemeInput
                                aria-label="Telefone do contato" placeholder="Telefone"
                                value={contact.mobile_phone || ''}
                                onChange={(e) => onUpdateContact(contact.id, 'mobile_phone', e.target.value)}
                                className="h-[30px] text-metadata-ui bg-transparent border-transparent focus:bg-muted/50 focus:border-border"
                            />
                        </div>
                        <div className="col-span-2 flex items-center gap-2 justify-center">
                            <Badge
                                variant={contact.is_primary ? "default" : "outline"}
                                className={`cursor-pointer text-metadata-ui h-[24px] px-2 uppercase tracking-wide border ${contact.is_primary ? 'bg-success/20 text-success-readable border-success/30 hover:bg-success/30' : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground/30'}`}
                                onClick={() => onSetPrimary(contact.id)}
                            >
                                {contact.is_primary ? 'Principal' : 'Secundário'}
                            </Badge>
                        </div>
                        <div className="col-span-1 flex justify-end">
                            <Button type="button" size="icon" variant="ghost" aria-label="Remover contato" className="h-7 w-7 text-muted-foreground hover:text-destructive-readable hover:bg-destructive/10 rounded-[var(--radius-control)]" onClick={() => onRemoveContact(contact.id)}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                ))}
                {contacts.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-border rounded-[var(--radius-panel)] bg-muted/30">
                        <p className="text-metadata-ui text-muted-foreground font-medium">Nenhum contato adicionado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
