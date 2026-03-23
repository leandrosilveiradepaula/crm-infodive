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
        <Card className="bg-card border-border hover:border-primary/30 transition-all duration-300 group relative overflow-hidden rounded-3xl hover:-translate-y-1 hover:shadow-2xl">
            {/* Ambient Glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 blur-[50px] rounded-full pointer-events-none group-hover:bg-primary/10 transition-colors"></div>
            
            <CardContent className="p-5 relative z-10">
                <div className="absolute top-4 right-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="bg-popover border-border text-popover-foreground">
                            <DropdownMenuItem onClick={() => onEnrich(lead)} className="hover:bg-purple-500/10 hover:text-purple-400 cursor-pointer text-xs font-bold uppercase tracking-wide py-2 text-purple-400">
                                <Sparkles className="h-3.5 w-3.5 mr-2" /> Enriquecer (AI)
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onEdit(lead)} className="hover:bg-muted hover:text-foreground cursor-pointer text-xs font-bold uppercase tracking-wide py-2">
                                <Edit className="h-3.5 w-3.5 mr-2" /> Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => onDelete(lead)} className="text-red-400 hover:bg-red-500/10 hover:text-red-300 cursor-pointer text-xs font-bold uppercase tracking-wide py-2">
                                <Trash2 className="h-3.5 w-3.5 mr-2" /> Remover
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                <div className="flex items-start gap-4 mb-4">
                    <Avatar className="h-12 w-12 border-2 border-primary/20 shadow-lg shadow-primary/10">
                        <AvatarFallback className="bg-primary/10 text-primary text-sm font-black">
                            {lead.contact_name ? lead.contact_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase() : 'L'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="pr-8">
                        <h3 className="text-foreground font-bold text-lg leading-tight line-clamp-1 group-hover:text-primary transition-colors">{lead.contact_name}</h3>
                        <p className="text-muted-foreground text-[10px] font-black uppercase tracking-widest flex items-center gap-1 mt-1 opacity-80">
                            <Building className="h-3.5 w-3.5" />
                            {lead.company}
                        </p>
                    </div>
                </div>

                <div className="space-y-3 mb-5">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground relative px-1">
                        <Mail className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                        <span className="truncate">{lead.email}</span>
                    </div>
                    {lead.phone && (
                        <div className="flex items-center gap-3 text-xs text-muted-foreground px-1">
                            <Phone className="h-3.5 w-3.5 shrink-0 text-primary/60" />
                            <span>{lead.phone}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground px-1 bg-accent/50 p-2 rounded-lg border border-border group-hover:border-border/80 transition-colors">
                        <Briefcase className="h-3.5 w-3.5 shrink-0 text-primary" />
                        <span className="truncate font-bold text-foreground/80">{lead.interest || 'Negócio Geral'}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-border">
                    <Badge variant="outline" className={`${statusColors[lead.status as keyof typeof statusColors] || 'bg-muted text-muted-foreground'} border uppercase text-[9px] font-black tracking-widest px-2 py-0.5 rounded-lg`}>
                        {lead.status}
                    </Badge>

                    {lead.status !== 'Convertido' ? (
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 rounded-xl text-primary border-primary/20 hover:bg-primary hover:text-white text-[9px] font-black uppercase tracking-[0.15em] transition-all shadow-sm active:scale-95 px-3"
                            onClick={() => onConvert(lead)}
                        >
                            <CheckCircle className="h-3 w-3 mr-1.5" />
                            Converter
                        </Button>
                    ) : (
                        <span className="text-success text-[9px] font-black uppercase tracking-widest flex items-center bg-success/10 px-2.5 py-1.5 rounded-xl border border-success/20">
                            <CheckCircle className="h-3 w-3 mr-1.5" />
                            Convertido
                        </span>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

