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
        <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 group relative overflow-hidden rounded-xl hover:-translate-y-0.5 hover:shadow-lg">
            <CardContent className="p-3 relative z-10">
                <div className="absolute top-2 right-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-accent rounded-lg">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                            <DropdownMenuItem onClick={() => onEdit(contact)} className="hover:bg-accent hover:text-accent-foreground cursor-pointer text-xs font-bold uppercase tracking-wide py-1.5">
                                <Edit className="h-3 w-3 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(contact.id)} className="text-destructive hover:bg-destructive/10 hover:text-destructive cursor-pointer text-xs font-bold uppercase tracking-wide py-1.5">
                                <Trash2 className="h-3 w-3 mr-2" /> Remover
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-start gap-2.5 mb-2.5">
                    <Avatar className={`h-10 w-10 border-2 ${contact.is_primary ? 'border-primary shadow-sm shadow-primary/20' : 'border-border'}`}>
                        <AvatarFallback className={`text-sm font-bold ${contact.is_primary ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                            {contact.name?.charAt(0).toUpperCase() || 'C'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="pr-6">
                        <h3 className="text-foreground font-bold text-sm leading-tight line-clamp-1 group-hover:text-primary transition-colors">{contact.name}</h3>
                        <p className="text-muted-foreground text-xs font-bold uppercase tracking-widest line-clamp-1 mt-0.5">{contact.role || 'Sem cargo'}</p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-muted-foreground bg-accent/50 p-1.5 rounded-md border border-border group-hover:border-border/80 transition-colors">
                        <Building2 className="h-3 w-3 text-primary shrink-0" />
                        <span className="truncate text-foreground/80">{contact.account?.name || 'Sem Empresa'}</span>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-muted-foreground group/email relative px-1.5">
                        <Mail className="h-3 w-3 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                        <button
                            onClick={() => navigator.clipboard.writeText(contact.email)}
                            className="opacity-0 group-hover/email:opacity-100 p-0.5 hover:bg-accent rounded text-muted-foreground hover:text-foreground transition-all absolute right-0 bg-card"
                            title="Copiar email"
                        >
                            <Copy className="h-3 w-3" />
                        </button>
                    </div>

                    {(contact.mobile_phone || contact.landline_phone) && (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground px-1.5">
                            <Phone className="h-3 w-3 shrink-0" />
                            <span>{contact.mobile_phone || contact.landline_phone}</span>
                        </div>
                    )}

                    {contact.linkedin && (
                        <div className="pt-2 mt-1.5 border-t border-border">
                            <Button
                                variant="outline"
                                size="sm"
                                className="w-full h-7 bg-[#0077b5]/10 hover:bg-[#0077b5]/20 border-[#0077b5]/20 text-[#0077b5] text-xs font-bold uppercase tracking-wider"
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

