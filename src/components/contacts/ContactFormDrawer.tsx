'use client';

import { useState, useEffect, useRef } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ThemeInput, ThemeLabel } from '@/components/ui/theme/ThemeComponents';
import { SignatureParserModal } from './SignatureParserModal';
import { ConfirmExitDialog } from '@/components/shared/ConfirmExitDialog';
import { Sparkles, Loader2, User, Mail, Linkedin, Phone, X } from 'lucide-react';
import { getAccounts } from '@/app/(dashboard)/customers/actions';
import { createContact, updateContact } from '@/app/(dashboard)/contacts/actions';
import { toast } from 'sonner';
import { type Account } from '@/types/account';
import { type Contact } from '@/types/contact';

interface ContactFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    contact?: Contact;
}

export function ContactFormDrawer({ isOpen, onClose, contact, onSuccess }: ContactFormDrawerProps) {
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [isParserOpen, setIsParserOpen] = useState(false);
    const [showConfirmExit, setShowConfirmExit] = useState(false);
    const initialDataRef = useRef<Partial<Contact>>({});

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

    const isDirty = () => {
        return JSON.stringify(formData) !== JSON.stringify(initialDataRef.current);
    };

    const handleCloseAttempt = () => {
        if (isDirty()) {
            setShowConfirmExit(true);
        } else {
            onClose();
        }
    };

    useEffect(() => {
        let initial: Partial<Contact>;
        if (contact) {
            initial = {
                name: contact.name,
                email: contact.email,
                mobile_phone: contact.mobile_phone || '',
                landline_phone: contact.landline_phone || '',
                role: contact.role || '',
                linkedin: contact.linkedin || '',
                account_id: contact.account_id || '',
                is_primary: contact.is_primary
            };
        } else {
            initial = {
                name: '',
                email: '',
                mobile_phone: '',
                landline_phone: '',
                role: '',
                linkedin: '',
                account_id: '',
                is_primary: false
            };
        }
        setFormData(initial);
        initialDataRef.current = initial;
        setShowConfirmExit(false);
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
            toast.error(error.message || 'Erro ao salvar contato.');
        } finally {
            setLoading(false);
        }
    };

    const handleSignatureData = (data: any) => {
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
            mobile_phone: data.whatsapp || data.mobile_phone || prev.mobile_phone,
            landline_phone: data.landline_phone || prev.landline_phone,
            role: data.role || prev.role,
            linkedin: data.linkedin || prev.linkedin,
            account_id: matchedAccountId || prev.account_id,
        }));
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="w-full sm:max-w-[540px] flex flex-col p-0 gap-0"
            >
                {/* ── Header ── */}
                <div className="border-b border-border px-6 py-4 shrink-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-xl">
                                <User className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                                <SheetTitle className="text-lg font-bold text-foreground tracking-tight">
                                    {contact ? 'Editar Contato' : 'Novo Contato'}
                                </SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                                    Gerencie as informações do contato associado à empresa
                                </SheetDescription>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            {!contact && (
                                <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setIsParserOpen(true)}
                                    className="gap-2 text-primary border-primary/20 hover:bg-primary/10 hover:text-primary h-8 text-[10px] font-bold uppercase"
                                >
                                    <Sparkles className="h-3.5 w-3.5" />
                                    Importar
                                </Button>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={onClose}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </div>

                <SignatureParserModal
                    isOpen={isParserOpen}
                    onClose={() => setIsParserOpen(false)}
                    onDataParsed={handleSignatureData}
                />

                {/* ── Form Content ── */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-5">
                        {/* Empresa */}
                        <div className="space-y-1">
                            <ThemeLabel>Empresa *</ThemeLabel>
                            <Select
                                value={formData.account_id}
                                onValueChange={(val) => setFormData(prev => ({ ...prev, account_id: val }))}
                                required
                            >
                                <SelectTrigger className="bg-background border-border text-foreground h-[38px] rounded-xl text-xs font-bold focus:ring-1 focus:ring-primary border">
                                    <SelectValue placeholder="Selecione uma empresa..." />
                                </SelectTrigger>
                                <SelectContent className="bg-popover border-border text-popover-foreground">
                                    {accounts.map(acc => (
                                        <SelectItem key={acc.id} value={acc.id}>{acc.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Nome Completo */}
                        <div className="space-y-1">
                            <ThemeLabel>Nome Completo *</ThemeLabel>
                            <div className="relative">
                                <ThemeInput
                                    required
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    className="pl-10 h-[38px]"
                                    placeholder="Ex: João Silva"
                                />
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Cargo */}
                        <div className="space-y-1">
                            <ThemeLabel>Cargo</ThemeLabel>
                            <ThemeInput
                                value={formData.role}
                                onChange={e => setFormData({ ...formData, role: e.target.value })}
                                className="h-[38px]"
                                placeholder="Ex: Diretor Comercial"
                            />
                        </div>

                        {/* Email */}
                        <div className="space-y-1">
                            <ThemeLabel>Email *</ThemeLabel>
                            <div className="relative">
                                <ThemeInput
                                    required
                                    type="email"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    className="pl-10 h-[38px]"
                                    placeholder="email@empresa.com"
                                />
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                        </div>

                        {/* LinkedIn */}
                        <div className="space-y-1">
                            <ThemeLabel>LinkedIn</ThemeLabel>
                            <div className="relative">
                                <ThemeInput
                                    value={formData.linkedin}
                                    onChange={e => setFormData({ ...formData, linkedin: e.target.value })}
                                    placeholder="https://linkedin.com/in/perfil"
                                    className="pl-10 h-[38px]"
                                />
                                <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Celular */}
                        <div className="space-y-1">
                            <ThemeLabel>Celular</ThemeLabel>
                            <div className="relative">
                                <ThemeInput
                                    value={formData.mobile_phone}
                                    onChange={e => setFormData({ ...formData, mobile_phone: e.target.value })}
                                    className="pl-10 h-[38px]"
                                    placeholder="(00) 00000-0000"
                                />
                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                            </div>
                        </div>

                        {/* Telefone Fixo */}
                        <div className="space-y-1">
                            <ThemeLabel>Telefone Fixo</ThemeLabel>
                            <ThemeInput
                                value={formData.landline_phone}
                                onChange={e => setFormData({ ...formData, landline_phone: e.target.value })}
                                className="h-[38px]"
                                placeholder="(00) 0000-0000"
                            />
                        </div>

                        {/* Contato Principal */}
                        <div className="flex items-center space-x-2 pt-2">
                            <Checkbox
                                id="is_primary"
                                checked={formData.is_primary}
                                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_primary: checked === true }))}
                                className="border-muted-foreground/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
                            />
                            <label
                                htmlFor="is_primary"
                                className="text-xs font-bold uppercase tracking-widest leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 text-muted-foreground cursor-pointer"
                            >
                                Contato Principal
                            </label>
                        </div>
                    </div>

                    {/* ── Sticky Footer ── */}
                    <div className="border-t border-border px-6 py-4 bg-muted/10 shrink-0 flex items-center justify-end gap-3">
                        <Button variant="ghost" type="button" onClick={onClose} className="h-10 px-4 text-muted-foreground hover:text-foreground hover:bg-muted font-bold rounded-xl transition-all">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="h-10 px-6 bg-primary hover:bg-primary/90 text-white font-bold rounded-xl shadow-md shadow-primary/20 min-w-[140px] transition-all active:scale-95 flex items-center justify-center gap-2">
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <User className="h-4 w-4" />
                            )}
                            {contact ? 'Salvar' : 'Cadastrar'}
                        </Button>
                    </div>
                </form>
            </SheetContent>
        </Sheet>
    );
}
