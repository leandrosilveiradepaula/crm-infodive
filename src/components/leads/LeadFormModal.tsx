'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Building, Loader2 } from 'lucide-react';
import { Lead } from '@/types/lead';
import { ThemeInput, ThemeLabel, ThemeSelect } from '@/components/ui/theme/ThemeComponents';
import { createLead, updateLead } from '@/app/(dashboard)/leads/actions';

interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead?: Lead;
}

export function LeadFormModal({ isOpen, onClose, lead }: LeadFormModalProps) {
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState<Partial<Lead>>({
        company: '',
        contact_name: '',
        email: '',
        phone: '',
        interest: '',
        status: 'Novo'
    });

    useEffect(() => {
        if (lead) {
            setFormData({
                company: lead.company,
                contact_name: lead.contact_name,
                email: lead.email,
                phone: lead.phone,
                interest: lead.interest || '',
                status: lead.status
            });
        } else {
            setFormData({
                company: '',
                contact_name: '',
                email: '',
                phone: '',
                interest: '',
                status: 'Novo'
            });
        }
    }, [lead, isOpen]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (lead) {
                await updateLead(lead.id, formData);
            } else {
                await createLead(formData);
            }
            onClose();
        } catch (error) {
            console.error('Error saving lead:', error);
            alert('Erro ao salvar lead.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl bg-card border-border text-foreground p-0 overflow-hidden rounded-[2rem] shadow-2xl animate-in zoom-in-95 duration-300">
                <DialogHeader className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-10 border-b border-border relative">
                    <div className="absolute top-0 right-0 w-32 h-full bg-primary/5 blur-3xl rounded-full -mr-16 pointer-events-none" />
                    <DialogTitle className="text-2xl font-black tracking-tight text-foreground flex items-center gap-3">
                        <div className="p-2.5 bg-primary/20 rounded-xl">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        {lead ? 'Editar Lead' : 'Novo Lead'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-xs font-black uppercase tracking-[0.2em] mt-2">
                        Gerencie as informações do seu potencial cliente
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-10 grid grid-cols-2 gap-6">
                    <div className="col-span-2 space-y-1">
                        <ThemeLabel>Empresa *</ThemeLabel>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <ThemeInput
                                required
                                value={formData.company}
                                onChange={e => setFormData({ ...formData, company: e.target.value })}
                                className="pl-10"
                                placeholder="Nome da empresa"
                            />
                        </div>
                    </div>

                    <div className="col-span-2 space-y-1">
                        <ThemeLabel>Nome do Contato *</ThemeLabel>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <ThemeInput
                                required
                                value={formData.contact_name}
                                onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                                className="pl-10"
                                placeholder="Nome completo"
                            />
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 space-y-1">
                        <ThemeLabel>Email *</ThemeLabel>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <ThemeInput
                                required
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="pl-10"
                                placeholder="email@empresa.com"
                            />
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 space-y-1">
                        <ThemeLabel>Telefone</ThemeLabel>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <ThemeInput
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="pl-10"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>

                    <div className="col-span-2 space-y-1">
                        <ThemeLabel>Interesse Principal</ThemeLabel>
                        <ThemeSelect
                            value={formData.interest}
                            onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                        >
                            <option value="" className="bg-popover text-popover-foreground">Selecione...</option>
                            <option value="Servidores IBM Power" className="bg-popover text-popover-foreground">Servidores IBM Power</option>
                            <option value="Storage IBM FlashSystem" className="bg-popover text-popover-foreground">Storage IBM FlashSystem</option>
                            <option value="Lenovo ThinkPad" className="bg-popover text-popover-foreground">Lenovo ThinkPad</option>
                            <option value="Lenovo Servers (ThinkSystem)" className="bg-popover text-popover-foreground">Lenovo Servers (ThinkSystem)</option>
                            <option value="Serviços Gerenciados" className="bg-popover text-popover-foreground">Serviços Gerenciados</option>
                        </ThemeSelect>
                    </div>

                    <DialogFooter className="col-span-2 border-t border-border pt-10 mt-4 flex items-center justify-end gap-3">
                        <Button variant="ghost" type="button" onClick={onClose} className="h-12 px-6 text-muted-foreground hover:text-foreground hover:bg-muted font-bold rounded-xl transition-all">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="h-12 px-10 bg-primary hover:bg-primary/90 text-white font-black rounded-2xl shadow-xl shadow-primary/20 min-w-[180px] transition-all active:scale-95 uppercase text-xs tracking-widest flex items-center gap-2">
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <div className="p-1 bg-white/20 rounded-lg group-hover:scale-110 transition-transform">
                                    <User className="h-3 w-3" />
                                </div>
                            )}
                            {lead ? 'Salvar Alterações' : 'Cadastrar Lead'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

