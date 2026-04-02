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

interface CustomerCardProps {
    customer: Account;
    onEdit: (customer: Account) => void;
    onDelete: (id: string) => void;
    onView?: (customer: Account) => void;
}

export function CustomerCard({ customer, onEdit, onDelete, onView }: CustomerCardProps) {
    const primaryContact = customer.contacts.find(c => c.is_primary) || customer.contacts[0] || { name: 'Sem contato', email: '', mobile_phone: '', landline_phone: '', role: '' };

    return (
        <div onClick={() => onView?.(customer)} className="bg-card p-3 rounded-xl border border-border hover:border-primary/30 transition-all duration-300 group hover:-translate-y-0.5 hover:shadow-lg flex flex-col h-full relative overflow-hidden cursor-pointer">
            <div className="flex justify-between items-start mb-3 relative z-10">
                <div className="h-10 w-10 rounded-lg bg-muted/50 flex items-center justify-center text-primary font-black text-sm shadow-inner border border-border overflow-hidden">
                    {customer.logo_url ? (
                        <img src={customer.logo_url} alt={customer.name} className="w-full h-full object-cover" />
                    ) : (
                        customer.name.charAt(0).toUpperCase()
                    )}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted rounded-full">
                            <MoreHorizontal className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-card border-border text-foreground">
                        <DropdownMenuItem onClick={() => onEdit(customer)} className="hover:bg-muted cursor-pointer text-xs font-bold uppercase tracking-wide py-2">
                            <Edit className="mr-2 h-3.5 w-3.5" /> Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onDelete(customer.id)} className="text-red-400 hover:bg-red-500/10 cursor-pointer text-xs font-bold uppercase tracking-wide py-2">
                            <Trash2 className="mr-2 h-3.5 w-3.5" /> Remover
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <div className="flex-1 relative z-10">
                <h3 className="font-bold text-foreground text-sm mb-0.5 truncate tracking-tight group-hover:text-primary transition-colors">{customer.name}</h3>
                <p className="text-[10px] text-muted-foreground mb-2 flex items-center font-bold uppercase tracking-wide">
                    <User className="h-3 w-3 mr-1.5 opacity-50 text-primary" />
                    <span className="truncate">{primaryContact.name}</span>
                    {customer.contacts.length > 1 && <span className="ml-1.5 text-[8px] px-1 py-0.5 bg-muted text-muted-foreground rounded border border-border">+{customer.contacts.length - 1}</span>}
                </p>

                <div className="space-y-1.5 pt-2.5 border-t border-border">
                    <div className="flex items-center text-[9px] text-muted-foreground font-bold uppercase tracking-wider group-hover:text-foreground transition-colors">
                        <Mail className="h-3 w-3 mr-2 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="truncate max-w-[180px]" title={primaryContact.email}>{primaryContact.email || '---'}</span>
                    </div>
                    <div className="flex items-center text-[9px] text-muted-foreground font-bold uppercase tracking-wider group-hover:text-foreground transition-colors">
                        <Phone className="h-3 w-3 mr-2 text-muted-foreground group-hover:text-emerald-500 transition-colors" />
                        {primaryContact.mobile_phone || primaryContact.landline_phone || '---'}
                    </div>
                    <div className="flex items-center text-[9px] text-muted-foreground font-bold uppercase tracking-wider group-hover:text-foreground transition-colors">
                        <MapPin className="h-3 w-3 mr-2 text-muted-foreground group-hover:text-teal-500 transition-colors" />
                        <span className="truncate">{customer.city || '---'}, {customer.state || '-'}</span>
                    </div>
                </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5 relative z-10">
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/10 text-[8px] font-bold uppercase tracking-wider px-1.5 py-0">
                    {customer.segment}
                </Badge>
                <Badge variant="outline" className={`text-[8px] font-bold uppercase tracking-wider px-1.5 py-0 ${customer.status === 'Ativo' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/10' : 'bg-muted text-muted-foreground border-border'}`}>
                    {customer.status}
                </Badge>
            </div>
        </div>
    );
}

