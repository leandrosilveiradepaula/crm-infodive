'use client';

import { Building, Mail, Phone, MapPin, MoreHorizontal, User, Edit, Trash2 } from 'lucide-react';
import { type Account } from '@/types/account';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from '@/components/ui/card';

interface CustomerCardProps {
    customer: Account;
    onEdit: (customer: Account) => void;
    onDelete: (id: string) => void;
    onView?: (customer: Account) => void;
}

export function CustomerCard({ customer, onEdit, onDelete, onView }: CustomerCardProps) {
    const primaryContact = customer.contacts.find(c => c.is_primary) || customer.contacts[0] || { name: 'Sem contato', email: '', mobile_phone: '', landline_phone: '', role: '' };

    return (
        <Card onClick={() => onView?.(customer)} className="card-interactive group flex flex-col h-full">
            <CardContent className="flex-1 flex flex-col">
            <div className="flex justify-between items-start mb-2 relative z-10">
                <div className="h-8 w-8 rounded-md bg-muted/50 flex items-center justify-center text-primary font-black text-xs shadow-inner border border-border overflow-hidden">
                    {customer.logo_url ? (
                        <img src={customer.logo_url} alt={customer.name} className="w-full h-full object-cover" />
                    ) : (
                        customer.name.charAt(0).toUpperCase()
                    )}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-md">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                        <DropdownMenuItem onClick={() => onEdit(customer)} className="hover:bg-muted cursor-pointer text-[10px] font-bold uppercase tracking-wide py-1.5">
                            <Edit className="mr-2 h-3 w-3" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(customer.id)} className="text-red-400 hover:bg-red-500/10 cursor-pointer text-[10px] font-bold uppercase tracking-wide py-1.5">
                            <Trash2 className="mr-2 h-3 w-3" /> Remover
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex-1 relative z-10">
                <h3 className="font-bold text-foreground text-xs mb-0.5 truncate tracking-tight group-hover:text-primary transition-colors">{customer.name}</h3>
                <p className="text-[9px] text-muted-foreground mb-1 flex items-center font-bold uppercase tracking-wide">
                    <User className="h-3 w-3 mr-1 opacity-50 text-primary" />
                    <span className="truncate">{primaryContact.name}</span>
                    {customer.contacts.length > 1 && <span className="ml-1 text-[7px] px-1 py-0.5 bg-muted text-muted-foreground rounded-sm border border-border">+{customer.contacts.length - 1}</span>}
                </p>

                <div className="space-y-0.5 pt-1.5 border-t border-border">
                    <div className="flex items-center text-[8px] text-muted-foreground font-bold uppercase tracking-wider group-hover:text-foreground transition-colors">
                        <Mail className="h-2.5 w-2.5 mr-1.5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="truncate max-w-[180px]" title={primaryContact.email}>{primaryContact.email || '—'}</span>
                    </div>
                    <div className="flex items-center text-[8px] text-muted-foreground font-bold uppercase tracking-wider group-hover:text-foreground transition-colors">
                        <Phone className="h-2.5 w-2.5 mr-1.5 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                        {primaryContact.mobile_phone || primaryContact.landline_phone || '---'}
                    </div>
                    <div className="flex items-center text-[8px] text-muted-foreground font-bold uppercase tracking-wider group-hover:text-foreground transition-colors">
                        <MapPin className="h-2.5 w-2.5 mr-1.5 text-muted-foreground group-hover:text-teal-500 transition-colors" />
                        <span className="truncate">{customer.city || '---'}, {customer.state || '-'}</span>
                    </div>
                </div>
            </div>

            <div className="mt-2 flex flex-wrap gap-1 relative z-10">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[7px] font-bold uppercase tracking-wider px-1 py-0 rounded-sm">
                    {customer.segment}
                </Badge>
                <Badge variant="outline" className={`text-[7px] font-bold uppercase tracking-wider px-1 py-0 rounded-sm ${customer.status === 'Ativo' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'bg-muted text-muted-foreground border-border'}`}>
                    {customer.status}
                </Badge>
            </div>
            </CardContent>
        </Card>
    );
}

