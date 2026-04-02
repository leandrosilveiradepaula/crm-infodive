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
        'Novo': 'bg-primary/10 text-primary border-primary/20',
        'Convertido': 'bg-success/10 text-success border-success/20',
        'Qualificado': 'bg-stage-proposal/10 text-stage-proposal border-stage-proposal/20',
        'Perdido': 'bg-destructive/10 text-destructive border-destructive/20',
    };

    return (
        <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 group relative overflow-hidden rounded-xl hover:-translate-y-0.5 hover:shadow-lg">
            <CardContent className="p-3 relative z-10">
                <div className="absolute top-2 right-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                            <DropdownMenuItem onClick={() => onEnrich(lead)} className="hover:bg-teal-500/10 hover:text-teal-400 cursor-pointer text-[9px] font-bold uppercase tracking-wide py-1.5 text-teal-400">
                                <Sparkles className="h-3 w-3 mr-2" /> Enriquecer (AI)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(lead)} className="hover:bg-muted hover:text-foreground cursor-pointer text-[9px] font-bold uppercase tracking-wide py-1.5">
                                <Edit className="h-3 w-3 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(lead)} className="text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer text-[9px] font-bold uppercase tracking-wide py-1.5">
                                <Trash2 className="h-3 w-3 mr-2" /> Remover
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-center gap-2.5 mb-2">
                    <Avatar className="h-8 w-8 border border-primary/20 shadow-none">
                        <AvatarFallback className="bg-primary/10 text-primary text-[10px] font-black">
                            {lead.contact_name ? lead.contact_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'L'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="pr-6 overflow-hidden">
                        <h3 className="text-foreground font-bold text-xs leading-tight line-clamp-1 group-hover:text-primary transition-colors">{lead.contact_name}</h3>
                        <p className="text-muted-foreground text-[8px] font-black uppercase tracking-widest flex items-center gap-1 opacity-80 mt-0.5">
                            <Building className="h-2.5 w-2.5" />
                            {lead.company}
                        </p>
                    </div>
                </div>

                <div className="space-y-1.5 mb-2.5">
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground relative px-0.5">
                        <Mail className="h-3 w-3 shrink-0 text-primary/60" />
                        <span className="truncate">{lead.email}</span>
                    </div>
                    {lead.phone && (
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-0.5">
                            <Phone className="h-3 w-3 shrink-0 text-primary/60" />
                            <span>{lead.phone}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-2 text-[10px] text-muted-foreground px-1.5 bg-muted/30 py-1 rounded-md border border-border group-hover:border-border/80 transition-colors mt-1.5">
                        <Briefcase className="h-3 w-3 shrink-0 text-primary/80" />
                        <span className="truncate font-bold text-foreground/80">{lead.interest || 'Negócio Geral'}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-border">
                    <Badge variant="outline" className={`${statusColors[lead.status as keyof typeof statusColors] || 'bg-muted text-muted-foreground'} border uppercase text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-md`}>
                        {lead.status}
                    </Badge>

                    {lead.status !== 'Convertido' ? (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-6 rounded-md text-primary border-primary/20 hover:bg-primary hover:text-white text-[8px] font-black uppercase tracking-[0.1em] transition-all shadow-none px-2"
                            onClick={() => onConvert(lead)}
                        >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Converter
                        </Button>
                    ) : (
                        <div className="text-success text-[8px] font-black uppercase tracking-widest flex items-center bg-success/10 px-1.5 py-0.5 rounded-md border border-success/20">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Convertido
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

