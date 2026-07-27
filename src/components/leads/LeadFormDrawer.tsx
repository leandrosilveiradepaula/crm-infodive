'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useDraftForm, FloatingSaveBar, UnsavedChangesDialog } from '@/components/ui/floating-save-bar';
import { User, Mail, Phone, Building, Building2, UserPlus, Loader2, X } from 'lucide-react';
import { Lead } from '@/types/lead';
import { ThemeInput, ThemeLabel, ThemeSelect } from '@/components/ui/theme/ThemeComponents';
import { createLead, updateLead } from '@/app/(dashboard)/leads/actions';
import { getAccountsForSelect, getContactsForAccount } from '@/app/(dashboard)/contacts/suggestions-actions';

interface LeadFormDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    lead?: Lead;
}

type AccountContact = {
    id: string;
    name: string;
    email: string;
    mobile_phone: string | null;
    landline_phone: string | null;
};

export function LeadFormDrawer({ isOpen, onClose, lead }: LeadFormDrawerProps) {
    const [loading, setLoading] = useState(false);

    // Company autocomplete state
    const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [showCompanySuggestions, setShowCompanySuggestions] = useState(false);
    const companyRef = useRef<HTMLDivElement>(null);

    // Contact autocomplete state
    const [accountContacts, setAccountContacts] = useState<AccountContact[]>([]);
    const [showContactSuggestions, setShowContactSuggestions] = useState(false);
    const contactRef = useRef<HTMLDivElement>(null);

    const initialLeadData = useMemo(() => ({
        company: lead?.company || '',
        contact_name: lead?.contact_name || '',
        email: lead?.email || '',
        phone: lead?.phone || '',
        interest: lead?.interest || '',
        status: lead?.status || 'Novo'
    }), [lead]);

    const {
        formData,
        setFormData,
        updateField,
        isDirty,
        changedCount,
        isSaving,
        saveChanges,
        discardChanges,
        safeExecute,
        showUnsavedModal,
        setShowUnsavedModal
    } = useDraftForm({
        initialData: initialLeadData,
        onSave: async (updated) => {
            if (!lead?.id) return;
            await updateLead(lead.id, updated);
        }
    });

    // Load accounts once when drawer opens
    useEffect(() => {
        if (isOpen) {
            getAccountsForSelect()
                .then(data => setAccounts(data || []))
                .catch(err => console.error('Erro ao buscar empresas:', err));
        }
    }, [isOpen]);

    // Load contacts when an account is linked
    useEffect(() => {
        if (selectedAccountId) {
            setAccountContacts([]);
            getContactsForAccount(selectedAccountId)
                .then(data => setAccountContacts(data || []))
                .catch(err => console.error('Erro ao buscar contatos:', err));
        } else {
            setAccountContacts([]);
        }
    }, [selectedAccountId]);

    // Reset form on open/close
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
            setSelectedAccountId(lead.account_id || null);
        } else {
            setFormData({
                company: '',
                contact_name: '',
                email: '',
                phone: '',
                interest: '',
                status: 'Novo'
            });
            setSelectedAccountId(null);
        }
        setShowCompanySuggestions(false);
        setShowContactSuggestions(false);
    }, [lead, isOpen]);

    // Close dropdowns on outside click
    useEffect(() => {
        const handler = (event: MouseEvent) => {
            if (companyRef.current && !companyRef.current.contains(event.target as Node)) {
                setShowCompanySuggestions(false);
            }
            if (contactRef.current && !contactRef.current.contains(event.target as Node)) {
                setShowContactSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    // --- Company handlers ---
    const handleCompanyChange = (value: string) => {
        setFormData(prev => ({ ...prev, company: value }));
        setSelectedAccountId(null);
        setShowCompanySuggestions(true);
    };

    const handleSelectAccount = (account: { id: string; name: string }) => {
        setSelectedAccountId(account.id);
        setFormData(prev => ({ ...prev, company: account.name }));
        setShowCompanySuggestions(false);
    };

    const filteredAccounts = accounts
        .filter(acc => acc.name.toLowerCase().includes((formData.company ?? '').toLowerCase()))
        .slice(0, 5);

    // --- Contact handlers ---
    const handleContactNameChange = (value: string) => {
        setFormData(prev => ({ ...prev, contact_name: value }));
        setShowContactSuggestions(true);
    };

    const handleSelectContact = (contact: AccountContact) => {
        setFormData(prev => ({
            ...prev,
            contact_name: contact.name,
            email: contact.email || prev.email,
            phone: contact.mobile_phone || contact.landline_phone || prev.phone || ''
        }));
        setShowContactSuggestions(false);
    };

    const filteredContacts = accountContacts.filter(c =>
        c.name.toLowerCase().includes((formData.contact_name ?? '').toLowerCase())
    );

    // --- Submit ---
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const payload: Partial<Lead> = {
                ...formData,
                ...(selectedAccountId ? { account_id: selectedAccountId } : {})
            };

            if (lead) {
                await updateLead(lead.id, payload);
            } else {
                await createLead(payload);
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
        <Sheet open={isOpen} onOpenChange={(val) => !val && safeExecute(onClose)}>
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
                                    {lead ? 'Editar Lead' : 'Novo Lead'}
                                </SheetTitle>
                                <SheetDescription className="text-xs text-muted-foreground mt-0.5">
                                    Gerencie as informações do seu potencial cliente
                                </SheetDescription>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* ── Form Content ── */}
                <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 overflow-y-auto custom-scrollbar px-6 py-6 space-y-5">
                        {/* ── Empresa ── */}
                        <div className="space-y-1">
                            <ThemeLabel>Empresa *</ThemeLabel>
                            <div ref={companyRef} className="relative">
                                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                                <ThemeInput
                                    required
                                    value={formData.company}
                                    onChange={e => handleCompanyChange(e.target.value)}
                                    onFocus={() => setShowCompanySuggestions(true)}
                                    className="pl-10 pr-28"
                                    placeholder="Nome da empresa"
                                />
                                {selectedAccountId && (
                                    <button
                                        type="button"
                                        onClick={() => setSelectedAccountId(null)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-primary hover:text-primary/80 gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-full border border-primary/20 transition-all cursor-pointer z-10"
                                        title="Clique para desvincular"
                                    >
                                        <Building className="h-3 w-3" />
                                        Vinculada ×
                                    </button>
                                )}

                                {showCompanySuggestions && filteredAccounts.length > 0 && (
                                    <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto p-1 animate-in fade-in-50 slide-in-from-top-1 duration-100">
                                        <div className="px-2 py-1 text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest border-b border-border mb-1">
                                            Empresas Cadastradas — Selecione para Vincular
                                        </div>
                                        {filteredAccounts.map(acc => (
                                            <button
                                                key={acc.id}
                                                type="button"
                                                onClick={() => handleSelectAccount(acc)}
                                                className="w-full text-left cursor-pointer px-3 py-2 text-xs font-bold rounded-lg hover:bg-muted text-foreground flex items-center justify-between transition-colors"
                                            >
                                                <span className="truncate flex items-center gap-2">
                                                    <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {acc.name}
                                                </span>
                                                <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shrink-0 ml-2">
                                                    Vincular
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Nome do Contato ── */}
                        <div className="space-y-1">
                            <ThemeLabel>Nome do Contato *</ThemeLabel>
                            <div ref={contactRef} className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                                <ThemeInput
                                    required
                                    value={formData.contact_name}
                                    onChange={e => handleContactNameChange(e.target.value)}
                                    onFocus={() => selectedAccountId && setShowContactSuggestions(true)}
                                    className="pl-10"
                                    placeholder={selectedAccountId ? 'Selecione ou digite um novo contato' : 'Nome completo'}
                                />

                                {/* Contact suggestions — shown only when an account is linked */}
                                {showContactSuggestions && selectedAccountId && (
                                    <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-52 overflow-y-auto p-1 animate-in fade-in-50 slide-in-from-top-1 duration-100">
                                        {filteredContacts.length > 0 && (
                                            <>
                                                <div className="px-2 py-1 text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest border-b border-border mb-1">
                                                    Contatos Cadastrados
                                                </div>
                                                {filteredContacts.map(contact => (
                                                    <button
                                                        key={contact.id}
                                                        type="button"
                                                        onClick={() => handleSelectContact(contact)}
                                                        className="w-full text-left cursor-pointer px-3 py-2.5 text-xs font-bold rounded-lg hover:bg-muted text-foreground flex items-center gap-3 transition-colors"
                                                    >
                                                        <div className="w-7 h-7 rounded-full bg-primary/15 flex items-center justify-center shrink-0">
                                                            <User className="h-3.5 w-3.5 text-primary" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <div className="truncate font-bold">{contact.name}</div>
                                                            {contact.email && (
                                                                <div className="truncate text-[10px] text-muted-foreground font-normal">{contact.email}</div>
                                                            )}
                                                        </div>
                                                        <span className="text-[9px] font-black text-primary bg-primary/10 px-2 py-0.5 rounded-full border border-primary/20 shrink-0 ml-auto">
                                                            Selecionar
                                                        </span>
                                                    </button>
                                                ))}
                                            </>
                                        )}

                                        {/* "New contact" option — always visible when account linked */}
                                        <div className="border-t border-border mt-1 pt-1">
                                            <button
                                                type="button"
                                                onClick={() => setShowContactSuggestions(false)}
                                                className="w-full text-left cursor-pointer px-3 py-2.5 text-xs font-bold rounded-lg hover:bg-muted text-muted-foreground flex items-center gap-3 transition-colors"
                                            >
                                                <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center shrink-0">
                                                    <UserPlus className="h-3.5 w-3.5 text-muted-foreground" />
                                                </div>
                                                <div>
                                                    <div className="font-bold text-foreground">Adicionar novo contato</div>
                                                    <div className="text-[10px] text-muted-foreground font-normal">Digite o nome e preencha os campos abaixo</div>
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Email ── */}
                        <div className="space-y-1">
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

                        {/* ── Telefone ── */}
                        <div className="space-y-1">
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

                        {/* ── Interesse ── */}
                        <div className="space-y-1">
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
                            {lead ? 'Salvar' : 'Cadastrar'}
                        </Button>
                    </div>
                </form>

                {lead && (
                    <>
                        <FloatingSaveBar
                            isDirty={isDirty}
                            changedCount={changedCount}
                            isSaving={isSaving || loading}
                            onSave={saveChanges}
                            onDiscard={discardChanges}
                        />

                        <UnsavedChangesDialog
                            open={showUnsavedModal}
                            onOpenChange={setShowUnsavedModal}
                            onSave={saveChanges}
                            onDiscard={discardChanges}
                            isSaving={isSaving || loading}
                        />
                    </>
                )}
            </SheetContent>
        </Sheet>
    );
}
