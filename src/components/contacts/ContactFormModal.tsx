'use client';

import { useState, useEffect, useId } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeInput, ThemeLabel, ThemeSectionHeader } from '@/components/ui/theme/ThemeComponents';
import { useDialogBackgroundInert } from '@/components/ui/useDialogBackgroundInert';
import { SignatureParserModal } from './SignatureParserModal';
import { Sparkles, Loader2, CheckCircle2, User, Mail, Linkedin, Phone } from 'lucide-react';
import { getAccounts } from '@/app/(dashboard)/customers/actions';
import { createContact, updateContact } from '@/app/(dashboard)/contacts/actions';
import { toast } from 'sonner';
import { type Account } from '@/types/account';
import { type Contact } from '@/types/contact';

interface ContactFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    contact?: Contact;
}

export function ContactFormModal({ isOpen, onClose, contact, onSuccess }: ContactFormModalProps) {
    const [loading, setLoading] = useState(false);
    const formId = useId();
    useDialogBackgroundInert(isOpen);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isParserOpen, setIsParserOpen] = useState(false);

    // In strict mode or complex apps, careful with controlled inputs initialized to undefined
    const [formData, setFormData] = useState<Partial<Contact>>({
        name: '',
        email: '',
        mobile_phone: '',
        landline_phone: '',
        role: '',
        linkedin: '',
        account_id: '',
        is_primary: false
    });

    useEffect(() => {
        if (contact) {
            setFormData({
                name: contact.name,
                email: contact.email,
                mobile_phone: contact.mobile_phone || '',
                landline_phone: contact.landline_phone || '',
                role: contact.role || '',
                linkedin: contact.linkedin || '',
                account_id: contact.account_id || '',
                is_primary: contact.is_primary
            });
        } else {
            setFormData({
                name: '',
                email: '',
                mobile_phone: '',
                landline_phone: '',
                role: '',
                linkedin: '',
                account_id: '',
                is_primary: false
            });
        }
    }, [contact, isOpen]);

    useEffect(() => {
        if (isOpen) {
            getAccounts().then(setAccounts).catch(console.error);
        }
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (contact) {
                await updateContact(contact.id, formData);
            } else {
                const result = await createContact(formData);
                if (!result.success) {
                    toast.error(result.error);
                    setLoading(false);
                    return;
                }
            }
            if (onSuccess) onSuccess();
            onClose();
        } catch (error: any) {
            console.error('Error saving contact:', error);
            // Show specific error message from backend if available
            toast.error(error.message || 'Erro ao salvar contato.');
        } finally {
            setLoading(false);
        }
    };



    const handleSignatureData = (data: any) => {
        // Smart Company Matching
        let matchedAccountId = '';
        if (data.company) {
            const normalizedCompany = data.company.trim().toLowerCase();
            const foundAccount = accounts.find(acc =>
                acc.name.trim().toLowerCase() === normalizedCompany ||
                acc.name.trim().toLowerCase().includes(normalizedCompany) ||
                normalizedCompany.includes(acc.name.trim().toLowerCase())
            );
            if (foundAccount) {
                matchedAccountId = foundAccount.id;
            }
        }

        setFormData(prev => ({
            ...prev,
            name: data.name || prev.name,
            email: data.email || prev.email,
            // Use WhatsApp as mobile if available, otherwise use mobile_phone
            mobile_phone: data.whatsapp || data.mobile_phone || prev.mobile_phone,
            landline_phone: data.landline_phone || prev.landline_phone,
            role: data.role || prev.role,
            linkedin: data.linkedin || prev.linkedin,
            // Set matched account or keep previous if selected
            account_id: matchedAccountId || prev.account_id,
        }));
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-2xl bg-card border-border text-foreground p-0 max-h-[var(--ds-form-dialog-max-height)] overflow-y-auto rounded-[var(--radius-panel)] shadow-card-ui">
                <DialogHeader className="bg-surface-subtle p-[var(--ds-form-dialog-gutter)] border-b border-border flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between relative">
                    <div className="relative z-10">
                        <DialogTitle className="text-page-title font-black tracking-tight text-foreground flex items-center gap-3">
                            <div className="p-2.5 bg-primary/20 rounded-[var(--radius-panel)]">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            {contact ? 'Editar Contato' : 'Novo Contato'}
                        </DialogTitle>
                        <DialogDescription className="ds-type-body text-muted-foreground mt-2 leading-relaxed">
                            Gerencie as informações do seu contato
                        </DialogDescription>
                    </div>
                    {!contact && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsParserOpen(true)}
                            className="relative z-10 gap-2 w-full shrink-0 sm:w-auto"
                        >
                            <Sparkles className="mr-2 h-4 w-4" />
                            Importar de Assinatura
                        </Button>
                    )}
                </DialogHeader>

                <SignatureParserModal
                    isOpen={isParserOpen}
                    onClose={() => setIsParserOpen(false)}
                    onDataParsed={handleSignatureData}
                />

                <form onSubmit={handleSubmit} className="p-[var(--ds-form-dialog-gutter)] grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                        <ThemeLabel htmlFor={`${formId}-account`}>Empresa *</ThemeLabel>
                        <Select
                            value={formData.account_id}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, account_id: val }))}
                            required
                        >
                            <SelectTrigger id={`${formId}-account`} aria-label="Empresa" className="bg-background border-border text-foreground h-[var(--ds-control-height-default)] rounded-[var(--radius-panel)] ds-type-control focus:ring-1 focus:ring-primary border">
                                <SelectValue placeholder="Selecione uma empresa..." />
                            </SelectTrigger>
                            <SelectContent className="bg-popover border-border text-popover-foreground">
                                {accounts.map(acc => (
                                    <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="col-span-2 md:col-span-1 space-y-1">
                        <ThemeLabel htmlFor={`${formId}-name`}>Nome Completo *</ThemeLabel>
                        <div className="relative">
                            <ThemeInput id={`${formId}-name`}
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="pl-10 h-[34px]"
                            />
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 space-y-1">
                        <ThemeLabel htmlFor={`${formId}-role`}>Cargo</ThemeLabel>
                        <ThemeInput id={`${formId}-role`}
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        />
                    </div>

                    <div className="col-span-2 space-y-1">
                        <ThemeLabel htmlFor={`${formId}-email`}>Email *</ThemeLabel>
                        <div className="relative">
                            <ThemeInput id={`${formId}-email`}
                                required
                                type="email"
                                value={formData.email}
                                onChange={e => setFormData({ ...formData, email: e.target.value })}
                                className="pl-10 h-[34px]"
                            />
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 space-y-1">
                        <ThemeLabel htmlFor={`${formId}-linkedin`}>LinkedIn</ThemeLabel>
                        <div className="relative">
                            <ThemeInput id={`${formId}-linkedin`}
                                value={formData.linkedin}
                                onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                                placeholder="https://linkedin.com/in/perfil"
                                className="pl-10 h-[34px]"
                            />
                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 space-y-1">
                        <ThemeLabel htmlFor={`${formId}-mobile`}>Celular</ThemeLabel>
                        <div className="relative">
                            <ThemeInput id={`${formId}-mobile`}
                                value={formData.mobile_phone}
                                onChange={e => setFormData({ ...formData, mobile_phone: e.target.value })}
                                className="pl-10 h-[34px]"
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 space-y-1">
                        <ThemeLabel htmlFor={`${formId}-landline`}>Telefone Fixo</ThemeLabel>
                        <ThemeInput id={`${formId}-landline`}
                            value={formData.landline_phone}
                            onChange={e => setFormData({ ...formData, landline_phone: e.target.value })}
                        />
                    </div>

                    <div className="col-span-2 flex items-center space-x-2 pt-2">
                        <Checkbox
                            id="is_primary"
                            checked={formData.is_primary}
                            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_primary: checked === true }))}
                            className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                        />
                        <label
                            htmlFor="is_primary"
                            className="text-metadata-ui font-bold uppercase tracking-widest leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                        >
                            Contato Principal
                        </label>
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
                            {contact ? 'Salvar Alterações' : 'Cadastrar Contato'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

