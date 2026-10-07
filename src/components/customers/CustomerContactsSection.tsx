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
                <ThemeSectionHeader title="Contatos" iconColor="bg-emerald-500" />
                <Button type="button" size="sm" variant="ghost" onClick={onAddContact} className="h-6 text-xs font-bold uppercase tracking-wide text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 px-2 rounded-lg">
                    <Plus className="h-3 w-3 mr-1" /> Adicionar
                </Button>
            </div>

            <div className="space-y-3">
                {contacts.map((contact) => (
                    <div key={contact.id} className="grid grid-cols-12 gap-3 items-center bg-card p-3 rounded-xl border border-border group hover:border-muted-foreground/30 transition-colors">
                        <div className="col-span-3">
                            <ThemeInput
                                placeholder="Nome"
                                value={contact.name || ''}
                                onChange={(e) => onUpdateContact(contact.id, 'name', e.target.value)}
                                className="h-[30px] text-xs bg-transparent border-transparent focus:bg-muted/50 focus:border-border"
                            />
                        </div>
                        <div className="col-span-3">
                            <ThemeInput
                                placeholder="Email"
                                value={contact.email || ''}
                                onChange={(e) => onUpdateContact(contact.id, 'email', e.target.value)}
                                className="h-[30px] text-xs bg-transparent border-transparent focus:bg-muted/50 focus:border-border"
                            />
                        </div>
                        <div className="col-span-3">
                            <ThemeInput
                                placeholder="Telefone"
                                value={contact.mobile_phone || ''}
                                onChange={(e) => onUpdateContact(contact.id, 'mobile_phone', e.target.value)}
                                className="h-[30px] text-xs bg-transparent border-transparent focus:bg-muted/50 focus:border-border"
                            />
                        </div>
                        <div className="col-span-2 flex items-center gap-2 justify-center">
                            <Badge
                                variant={contact.is_primary ? "default" : "outline"}
                                className={`cursor-pointer text-xs h-[24px] px-2 uppercase tracking-wide border ${contact.is_primary ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/30' : 'bg-transparent text-muted-foreground border-border hover:border-muted-foreground/30'}`}
                                onClick={() => onSetPrimary(contact.id)}
                            >
                                {contact.is_primary ? 'Principal' : 'Secundário'}
                            </Badge>
                        </div>
                        <div className="col-span-1 flex justify-end">
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg" onClick={() => onRemoveContact(contact.id)}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                ))}
                {contacts.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-border rounded-xl bg-muted/30">
                        <p className="text-xs text-muted-foreground font-medium">Nenhum contato adicionado.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
