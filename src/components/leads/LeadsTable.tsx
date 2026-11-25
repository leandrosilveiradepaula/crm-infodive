'use client';

import { Lead } from '@/types/lead';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, ArrowRightLeft, User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LeadsTableProps {
    leads: Lead[];
    onEdit: (lead: Lead) => void;
    onDelete: (lead: Lead) => void;
    onConvert: (lead: Lead) => void;
    onEnrich?: (lead: Lead) => void;
}

const statusColors: Record<string, string> = {
    Novo: 'bg-surface-subtle text-foreground border-border',
    Qualificado: 'bg-surface-subtle text-foreground border-border',
    Convertido: 'bg-success-subtle text-foreground border-border',
    Perdido: 'bg-destructive-subtle text-foreground border-border',
};

export function LeadsTable({ leads, onEdit, onDelete, onConvert, onEnrich }: LeadsTableProps) {
    return (
        <div role="region" aria-label="Tabela de leads" tabIndex={0} data-qa-region="directory-table" className="min-w-0 max-w-full overflow-x-auto focus-ring bg-card border border-border rounded-[var(--radius-panel)]">
            <table aria-label="Leads" className="w-full min-w-[var(--ds-directory-table-min-width)] text-body-ui">
                <thead>
                    <tr className="border-b border-border bg-muted/30">
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Contato</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Empresa</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">E-mail</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Status</th>
                        <th scope="col" className="text-left px-4 py-3 text-label-ui font-semibold text-foreground">Interesse</th>
                        <th scope="col" className="px-4 py-3 text-right text-label-ui font-semibold text-foreground">Ações</th>
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
                                        <p className="font-bold text-foreground text-body-ui leading-tight">{lead.contact_name}</p>
                                        {lead.phone && <p className="text-metadata-ui text-muted-foreground">{lead.phone}</p>}
                                    </div>
                                </div>
                            </td>
                            <td className="px-4 py-3 text-metadata-ui text-muted-foreground font-medium truncate max-w-[160px]">
                                {lead.company || '—'}
                            </td>
                            <td className="px-4 py-3 text-metadata-ui text-muted-foreground truncate max-w-[180px]">
                                {lead.email || '—'}
                            </td>
                            <td className="px-4 py-3">
                                <span className={cn(
                                    'px-2 py-0.5 rounded-full text-metadata-ui font-medium',
                                    statusColors[lead.status] || 'bg-muted text-muted-foreground'
                                )}>
                                    {lead.status}
                                </span>
                            </td>
                            <td className="px-4 py-3 text-metadata-ui text-muted-foreground truncate max-w-[160px]">
                                {lead.interest || '—'}
                            </td>
                            <td className="px-4 py-3">
                                <div className="flex items-center gap-1 justify-end">
                                    {onEnrich && <Button variant="ghost" size="icon" aria-label={`Pesquisar empresa do lead ${lead.contact_name || lead.company || ''}`} onClick={() => onEnrich(lead)}><Sparkles aria-hidden="true" /></Button>}
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-success-readable" aria-label={`Converter lead ${lead.contact_name || lead.company || ''}`} title="Converter" onClick={() => onConvert(lead)}>
                                        <ArrowRightLeft className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-foreground" aria-label={`Editar lead ${lead.contact_name || lead.company || ''}`} onClick={() => onEdit(lead)}>
                                        <Pencil className="h-3.5 w-3.5" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive-readable" aria-label={`Excluir lead ${lead.contact_name || lead.company || ''}`} onClick={() => onDelete(lead)}>
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {leads.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-body-ui">Nenhum lead encontrado.</div>
            )}
        </div>
    );
}
