'use client';

import { useState, useEffect, useId } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { User, Mail, Phone, Building, Loader2 } from 'lucide-react';
import { Lead } from '@/types/lead';
import { ThemeInput, ThemeLabel, ThemeSelect } from '@/components/ui/theme/ThemeComponents';
import { useDialogBackgroundInert } from '@/components/ui/useDialogBackgroundInert';
import { createLead, updateLead } from '@/app/(dashboard)/leads/actions';

interface LeadFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead?: Lead;
}

export function LeadFormModal({ isOpen, onClose, lead }: LeadFormModalProps) {
    const [loading, setLoading] = useState(false);
    const formId = useId();
    useDialogBackgroundInert(isOpen);

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
            <DialogContent className="sm:max-w-xl bg-card border-border text-foreground p-0 max-h-[var(--ds-form-dialog-max-height)] overflow-y-auto rounded-[var(--radius-panel)] shadow-card-ui">
                <DialogHeader className="bg-surface-subtle p-[var(--ds-form-dialog-gutter)] border-b border-border relative">
                    <DialogTitle className="text-page-title font-black tracking-tight text-foreground flex items-center gap-3">
                        <div className="p-2.5 bg-primary/20 rounded-[var(--radius-panel)]">
                            <User className="w-5 h-5 text-primary" />
                        </div>
                        {lead ? 'Editar Lead' : 'Novo Lead'}
                    </DialogTitle>
                    <DialogDescription className="text-muted-foreground text-metadata-ui font-black uppercase tracking-[0.2em] mt-2">
                        Gerencie as informações do seu potencial cliente
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="p-[var(--ds-form-dialog-gutter)] grid grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                        <ThemeLabel htmlFor={`${formId}-company`}>Empresa *</ThemeLabel>
                        <div className="relative">
                            <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <ThemeInput id={`${formId}-company`}
                                required
                                value={formData.company}
                                onChange={e => setFormData({ ...formData, company: e.target.value })}
                                className="pl-10"
                                placeholder="Nome da empresa"
                            />
                        </div>
                    </div>

                    <div className="col-span-2 space-y-1">
                        <ThemeLabel htmlFor={`${formId}-contact`}>Nome do Contato *</ThemeLabel>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <ThemeInput id={`${formId}-contact`}
                                required
                                value={formData.contact_name}
                                onChange={e => setFormData({ ...formData, contact_name: e.target.value })}
                                className="pl-10"
                                placeholder="Nome completo"
                            />
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 space-y-1">
                        <ThemeLabel htmlFor={`${formId}-email`}>Email *</ThemeLabel>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <ThemeInput id={`${formId}-email`}
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
                        <ThemeLabel htmlFor={`${formId}-phone`}>Telefone</ThemeLabel>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                            <ThemeInput id={`${formId}-phone`}
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                className="pl-10"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>

                    <div className="col-span-2 space-y-1">
                        <ThemeLabel htmlFor={`${formId}-interest`}>Interesse Principal</ThemeLabel>
                        <ThemeSelect id={`${formId}-interest`}
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

                    <DialogFooter className="col-span-2 border-t border-border pt-4 mt-2 flex items-center justify-end gap-3">
                        <Button variant="ghost" type="button" onClick={onClose} className="h-12 px-6 text-muted-foreground hover:text-foreground hover:bg-muted font-bold rounded-[var(--radius-panel)] transition-all">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto">
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <User className="h-4 w-4" aria-hidden="true" />
                            )}
                            {lead ? 'Salvar Alterações' : 'Cadastrar Lead'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

