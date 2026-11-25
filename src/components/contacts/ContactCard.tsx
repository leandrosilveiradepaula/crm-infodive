'use client';

import { Contact } from '@/types/contact';
import { Mail, Phone, Building2, MoreVertical, Edit, Trash2, Copy, Linkedin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

interface ContactCardProps {
    contact: Contact;
    onEdit: (contact: Contact) => void;
    onDelete: (id: string) => void;
}

export function ContactCard({ contact, onEdit, onDelete }: ContactCardProps) {
    return (
        <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 group relative overflow-hidden rounded-[var(--radius-panel)] hover:-translate-y-0.5 hover:shadow-card-ui">
            <CardContent className="p-3 relative z-10">
                <div className="absolute top-2 right-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-label="Opções do contato" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent rounded-[var(--radius-control)]">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                            <DropdownMenuItem onClick={() => onEdit(contact)} className="hover:bg-accent hover:text-accent-foreground cursor-pointer text-metadata-ui font-bold uppercase tracking-wide py-1.5">
                                <Edit className="h-3 w-3 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(contact.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer text-metadata-ui font-bold uppercase tracking-wide py-1.5">
                                <Trash2 className="h-3 w-3 mr-2" /> Remover
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-start gap-2.5 mb-2.5">
                    <Avatar className={`h-10 w-10 border-2 ${contact.is_primary ? 'border-primary shadow-control-ui shadow-primary/20' : 'border-border'}`}>
                        <AvatarFallback className={`text-body-ui font-bold ${contact.is_primary ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'}`}>
                            {contact.name?.charAt(0).toUpperCase() || 'C'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="pr-6">
                        <h3 className="text-foreground font-bold text-body-ui leading-tight line-clamp-1 group-hover:text-primary transition-colors">{contact.name}</h3>
                        <p className="text-foreground text-metadata-ui font-bold uppercase tracking-widest line-clamp-1 mt-0.5">{contact.role || 'Sem cargo'}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-metadata-ui font-bold text-foreground bg-surface-subtle p-1.5 rounded-[var(--radius-control)] border border-border group-hover:border-border/80 transition-colors">
                        <Building2 className="h-3 w-3 text-primary shrink-0" />
                        <span className="truncate text-foreground">{contact.account?.name || 'Sem Empresa'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-metadata-ui text-foreground group/email relative px-1.5">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                        <button
                            onClick={() => navigator.clipboard.writeText(contact.email)}
                            className="opacity-0 group-hover/email:opacity-100 p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-all absolute right-0 bg-card"
                            title="Copiar email" aria-label="Copiar email do contato"
                        >
                            <Copy className="h-3 w-3" />
                        </button>
                    </div>

                    {(contact.mobile_phone || contact.landline_phone) && (
                        <div className="flex items-center gap-2 text-metadata-ui text-foreground px-1.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{contact.mobile_phone || contact.landline_phone}</span>
                        </div>
                    )}

                    {contact.linkedin && (
                        <div className="pt-2 mt-1.5 border-t border-border">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-7 bg-info-subtle hover:bg-muted border-border text-foreground text-metadata-ui font-bold uppercase tracking-wider"
                                onClick={() => window.open(contact.linkedin, '_blank')}
                            >
                                <Linkedin className="h-3 w-3 mr-1.5" />
                                Ver Perfil LinkedIn
                            </Button>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

