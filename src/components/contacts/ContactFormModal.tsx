'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeInput, ThemeLabel, ThemeSectionHeader } from '@/components/ui/theme/ThemeComponents';
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
            <DialogContent className="sm:max-w-xl bg-card border-border text-foreground p-0 overflow-hidden rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300">
                <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-bold text-foreground tracking-tight">
                        {contact ? 'Editar Contato' : 'Novo Contato'}
                    </DialogTitle>
                    {!contact && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsParserOpen(true)}
                            className="gap-2 text-primary border-primary/20 hover:bg-primary/10 hover:text-primary"
                        >
                            <Sparkles className="h-4 w-4" />
                            Importar de Assinatura
                        </Button>
                    )}
                </DialogHeader>

                <SignatureParserModal
                    isOpen={isParserOpen}
                    onClose={() => setIsParserOpen(false)}
                    onDataParsed={handleSignatureData}
                />

                <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="col-span-2 space-y-1">
                        <ThemeLabel>Empresa *</ThemeLabel>
                        <Select
                            value={formData.account_id}
                            onValueChange={(val) => setFormData(prev => ({ ...prev, account_id: val }))}
                            required
                        >
                            <SelectTrigger className="bg-background border-border text-foreground h-[34px] rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary border">
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
                        <ThemeLabel>Nome Completo *</ThemeLabel>
                        <div className="relative">
                            <ThemeInput
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="pl-10 h-[34px]"
                            />
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 space-y-1">
                        <ThemeLabel>Cargo</ThemeLabel>
                        <ThemeInput
                            value={formData.role}
                            onChange={e => setFormData({ ...formData, role: e.target.value })}
                        />
                    </div>

                    <div className="col-span-2 space-y-1">
                        <ThemeLabel>Email *</ThemeLabel>
                        <div className="relative">
                            <ThemeInput
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
                        <ThemeLabel>LinkedIn</ThemeLabel>
                        <div className="relative">
                            <ThemeInput
                                value={formData.linkedin}
                                onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                                placeholder="https://linkedin.com/in/perfil"
                                className="pl-10 h-[34px]"
                            />
                            <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 space-y-1">
                        <ThemeLabel>Celular</ThemeLabel>
                        <div className="relative">
                            <ThemeInput
                                value={formData.mobile_phone}
                                onChange={e => setFormData({ ...formData, mobile_phone: e.target.value })}
                                className="pl-10 h-[34px]"
                            />
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                    </div>

                    <div className="col-span-2 md:col-span-1 space-y-1">
                        <ThemeLabel>Telefone Fixo</ThemeLabel>
                        <ThemeInput
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
                            className="text-xs font-bold uppercase tracking-widest leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground"
                        >
                            Contato Principal
                        </label>
                    </div>

                    <DialogFooter className="col-span-2 pt-2">
                        <Button type="button" variant="ghost" onClick={onClose} className="text-muted-foreground">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-bold min-w-[150px]">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {contact ? 'Salvar Alterações' : 'Cadastrar Contato'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

