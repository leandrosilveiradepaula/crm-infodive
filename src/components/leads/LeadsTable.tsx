'use client';

import { Lead } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ArrowRightLeft, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadsTableProps {
    leads: Lead[];
    onEdit: (lead: Lead) => void;
    onDelete: (lead: Lead) => void;
    onConvert: (lead: Lead) => void;
}

const statusColors: Record<string, string> = {
    Novo: 'bg-primary/10 text-primary border-primary/20',
    Qualificado: 'bg-stage-proposal/10 text-stage-proposal border-stage-proposal/20',
    Convertido: 'bg-success/10 text-success border-success/20',
    Perdido: 'bg-destructive/10 text-destructive border-destructive/20',
};

export function LeadsTable({ leads, onEdit, onDelete, onConvert }: LeadsTableProps) {
    return (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-border bg-muted/30">
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest">Contato</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hidden md:table-cell">Empresa</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hidden lg:table-cell">E-mail</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hidden sm:table-cell">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-black text-muted-foreground uppercase tracking-widest hidden lg:table-cell">Interesse</th>
                        <th className="px-4 py-3" />
                    </tr>
                </thead>
                <tbody>
                    {leads.map((lead, i) => (
                        <tr
                            key={lead.id}
                            className={cn(
                                'border-b border-border/50 hover:bg-muted/20 transition-colors',
                                i === leads.length - 1 && 'border-b-0'
                            )}
                        >
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                        <User className="h-4 w-4 text-primary" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-foreground text-sm leading-tight">{lead.contact_name}</p>
                                        {lead.phone && <p className="text-xs text-muted-foreground">{lead.phone}</p>}
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground font-medium hidden md:table-cell truncate max-w-[160px]">
                                {lead.company || '—'}
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell truncate max-w-[180px]">
                                {lead.email || '—'}
                            </td>
                            <td className="px-4 py-3 hidden sm:table-cell">
                                <span className={cn(
                                    'px-2 py-0.5 rounded-full text-xs font-black uppercase tracking-wide',
                                    statusColors[lead.status] || 'bg-muted text-muted-foreground'
                                )}>
                                    {lead.status}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell truncate max-w-[160px]">
                                {lead.interest || '—'}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-1 justify-end">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-emerald-600" title="Converter" onClick={() => onConvert(lead)}>
                                        <ArrowRightLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" onClick={() => onEdit(lead)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => onDelete(lead)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {leads.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">Nenhum lead encontrado.</div>
            )}
        </div>
    );
}
