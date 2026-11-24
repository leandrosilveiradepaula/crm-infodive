'use client';

import { Lead } from '@/types/lead';
import { Mail, Phone, Building, Briefcase, CheckCircle, Trash2, Edit, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreVertical } from 'lucide-react';

interface LeadCardProps {
    lead: Lead;
    onEdit: (lead: Lead) => void;
    onDelete: (lead: Lead) => void;
    onConvert: (lead: Lead) => void;
    onEnrich: (lead: Lead) => void;
}

export function LeadCard({ lead, onEdit, onDelete, onConvert, onEnrich }: LeadCardProps) {
    const statusColors = {
        'Novo': 'bg-surface-subtle text-foreground border-border',
        'Convertido': 'bg-success-subtle text-foreground border-border',
        'Qualificado': 'bg-surface-subtle text-foreground border-border',
        'Perdido': 'bg-destructive-subtle text-foreground border-border',
    };

    return (
        <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 group relative overflow-hidden rounded-[var(--radius-panel)] hover:-translate-y-0.5 hover:shadow-card-ui">
            <CardContent className="p-3 relative z-10">
                <div className="absolute top-2 right-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-label="Opções do lead" variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-[var(--radius-control)]">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                            <DropdownMenuItem onClick={() => onEnrich(lead)} className="hover:bg-info/10 hover:text-info cursor-pointer text-metadata-ui font-bold uppercase tracking-wide py-1.5 text-info">
                                <Sparkles className="h-3 w-3 mr-2" /> Enriquecer (AI)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(lead)} className="hover:bg-muted hover:text-foreground cursor-pointer text-metadata-ui font-bold uppercase tracking-wide py-1.5">
                                <Edit className="h-3 w-3 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(lead)} className="text-destructive-readable hover:bg-destructive/10 hover:text-destructive-readable cursor-pointer text-metadata-ui font-bold uppercase tracking-wide py-1.5">
                                <Trash2 className="h-3 w-3 mr-2" /> Remover
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-2.5 mb-2">
                    <Avatar className="h-8 w-8 border border-primary/20 shadow-none">
                        <AvatarFallback className="bg-surface-subtle text-foreground text-metadata-ui font-black">
                            {lead.contact_name ? lead.contact_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'L'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="pr-6 overflow-hidden">
                        <h3 className="text-foreground font-bold text-metadata-ui leading-tight line-clamp-1 group-hover:text-primary transition-colors">{lead.contact_name}</h3>
                        <p className="text-foreground text-metadata-ui font-black uppercase tracking-widest flex items-center gap-1 mt-0.5">
                            <Building className="h-2.5 w-2.5" />
                            {lead.company}
                        </p>
                    </div>
                </div>

                <div className="space-y-1.5 mb-2.5">
                    <div className="flex items-center gap-2 text-metadata-ui text-foreground relative px-0.5">
                        <Mail className="h-3 w-3 shrink-0 text-primary/60" />
                        <span className="truncate">{lead.email}</span>
                    </div>
                    {lead.phone && (
                        <div className="flex items-center gap-2 text-metadata-ui text-foreground px-0.5">
                            <Phone className="h-3 w-3 shrink-0 text-primary/60" />
                            <span>{lead.phone}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-metadata-ui text-foreground px-1.5 bg-surface-subtle py-1 rounded-[var(--radius-control)] border border-border group-hover:border-border/80 transition-colors mt-1.5">
                        <Briefcase className="h-3 w-3 shrink-0 text-primary/80" />
                        <span className="truncate font-bold text-foreground/80">{lead.interest || 'Negócio Geral'}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                    <Badge variant="outline" className={`${statusColors[lead.status as keyof typeof statusColors] || 'bg-muted text-foreground'} border uppercase text-metadata-ui font-black tracking-widest px-1.5 py-0.5 rounded-[var(--radius-control)]`}>
                        {lead.status}
                    </Badge>

                    {lead.status !== 'Convertido' ? (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-6 rounded-[var(--radius-control)] text-primary border-primary/20 hover:bg-primary hover:text-white text-metadata-ui font-black uppercase tracking-[0.1em] transition-all shadow-none px-2"
                            onClick={() => onConvert(lead)}
                        >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Converter
                        </Button>
                    ) : (
                        <div className="text-foreground text-metadata-ui font-black uppercase tracking-widest flex items-center bg-success-subtle px-1.5 py-0.5 rounded-[var(--radius-control)] border border-success/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Convertido
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

