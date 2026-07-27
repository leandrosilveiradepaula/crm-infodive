import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ThemeInput, ThemeLabel, ThemeSectionHeader } from '@/components/ui/theme/ThemeComponents';
import { Lead } from '@/types/lead';
import { convertLeadToDeal, getAccountDetails } from '@/app/(dashboard)/leads/conversion-actions';
import { getAccountsForSelect, getContactsForAccount } from '@/app/(dashboard)/contacts/suggestions-actions';
import { Loader2, CheckCircle, Building, Building2, User, Search } from 'lucide-react';
import { toast } from 'sonner';
import { CONFIG } from '@/lib/config';

interface LeadConversionModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead;
}

export function LeadConversionModal({ isOpen, onClose, lead }: LeadConversionModalProps) {
    const [loading, setLoading] = useState(false);
    const [accounts, setAccounts] = useState<{ id: string; name: string }[]>([]);
    const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    // Contact states
    const [accountContacts, setAccountContacts] = useState<{ id: string; name: string; email: string; mobile_phone: string | null; landline_phone: string | null }[]>([]);
    const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
    const [showContactSuggestions, setShowContactSuggestions] = useState(false);
    const contactRef = useRef<HTMLDivElement>(null);

    // CEP states & functions
    const [loadingCep, setLoadingCep] = useState(false);

    const handleCepSearch = async () => {
        if (!formData.zip || formData.zip.length < 8) return;
        setLoadingCep(true);
        try {
            const cleanZip = formData.zip.replace(/\D/g, '');
            const res = await fetch(`${CONFIG.API.VIACEP}/${cleanZip}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setFormData(prev => ({
                    ...prev,
                    street: data.logradouro || prev.street || '',
                    neighborhood: data.bairro || prev.neighborhood || '',
                    city: data.localidade || prev.city || '',
                    state: data.uf || prev.state || ''
                }));
                toast.success('Endereço preenchido automaticamente!');
            } else {
                toast.error('CEP não encontrado.');
            }
        } catch (error) {
            console.error('Erro ao buscar CEP:', error);
            toast.error('Erro ao buscar CEP.');
        } finally {
            setLoadingCep(false);
        }
    };

    const [formData, setFormData] = useState<Partial<Lead>>({
        company: lead.company,
        contact_name: lead.contact_name,
        email: lead.email,
        phone: lead.phone,
        interest: lead.interest,
        cnpj: lead.cnpj || '',
        ie: lead.ie || '',
        zip: lead.zip || '',
        street: lead.street || '',
        number: lead.number || '',
        complement: lead.complement || '',
        neighborhood: lead.neighborhood || '',
        city: lead.city || '',
        state: lead.state || ''
    });

    useEffect(() => {
        if (isOpen) {
            const loadAccounts = async () => {
                try {
                    const data = await getAccountsForSelect();
                    setAccounts(data || []);
                } catch (err) {
                    console.error('Erro ao buscar empresas:', err);
                }
            };
            loadAccounts();
            setSelectedAccountId(null);
            setShowSuggestions(false);
            setSelectedContactId(null);
            setAccountContacts([]);
            setShowContactSuggestions(false);
            setFormData({
                company: lead.company,
                contact_name: lead.contact_name,
                email: lead.email,
                phone: lead.phone,
                interest: lead.interest,
                cnpj: lead.cnpj || '',
                ie: lead.ie || '',
                zip: lead.zip || '',
                street: lead.street || '',
                number: lead.number || '',
                complement: lead.complement || '',
                neighborhood: lead.neighborhood || '',
                city: lead.city || '',
                state: lead.state || ''
            });
        }
    }, [isOpen, lead]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
            if (contactRef.current && !contactRef.current.contains(event.target as Node)) {
                setShowContactSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load contacts when selectedAccountId changes
    useEffect(() => {
        if (selectedAccountId) {
            setAccountContacts([]);
            getContactsForAccount(selectedAccountId)
                .then(data => setAccountContacts(data || []))
                .catch(err => console.error('Erro ao buscar contatos:', err));
        } else {
            setAccountContacts([]);
            setSelectedContactId(null);
        }
    }, [selectedAccountId]);

    const handleCompanyChange = (value: string) => {
        setFormData(prev => ({ ...prev, company: value }));
        setSelectedAccountId(null);
        setShowSuggestions(true);
    };

    const handleSelectAccount = async (account: { id: string; name: string }) => {
        setSelectedAccountId(account.id);
        setShowSuggestions(false);
        setFormData(prev => ({ ...prev, company: account.name }));

        try {
            const details = await getAccountDetails(account.id);
            if (details) {
                setFormData(prev => ({
                    ...prev,
                    company: details.name || prev.company,
                    cnpj: details.cnpj || prev.cnpj || '',
                    ie: details.ie || prev.ie || '',
                    zip: details.zip || prev.zip || '',
                    street: details.street || prev.street || '',
                    number: details.number || prev.number || '',
                    complement: details.complement || prev.complement || '',
                    neighborhood: details.neighborhood || prev.neighborhood || '',
                    city: details.city || prev.city || '',
                    state: details.state || prev.state || ''
                }));
                toast.success(`Dados da empresa "${details.name}" carregados.`);
            }
        } catch (err) {
            console.error('Erro ao carregar detalhes da empresa:', err);
            toast.error('Erro ao carregar detalhes da empresa.');
        }
    };

    const handleContactNameChange = (value: string) => {
        setFormData(prev => ({ ...prev, contact_name: value }));
        setSelectedContactId(null);
        setShowContactSuggestions(true);
    };

    const handleSelectContact = (contact: typeof accountContacts[0]) => {
        setSelectedContactId(contact.id);
        setFormData(prev => ({
            ...prev,
            contact_name: contact.name,
            email: contact.email || prev.email || '',
            phone: contact.mobile_phone || contact.landline_phone || prev.phone || ''
        }));
        setShowContactSuggestions(false);
    };

    const handleDeselectContact = () => {
        setSelectedContactId(null);
    };

    const filteredAccounts = accounts.filter(acc =>
        acc.name.toLowerCase().includes((formData.company ?? '').toLowerCase())
    ).slice(0, 5);

    const filteredContacts = accountContacts.filter(c =>
        c.name.toLowerCase().includes((formData.contact_name ?? '').toLowerCase())
    );

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await convertLeadToDeal(lead.id, formData, selectedAccountId || undefined, selectedContactId || undefined);
            onClose();
            toast.success('Lead convertido em cliente e oportunidade criada com sucesso!');
        } catch (error) {
            console.error(error);
            toast.error('Erro na conversão.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[800px] bg-card border-border text-foreground p-0 max-h-[90vh] overflow-y-auto rounded-2xl">
                <DialogHeader className="px-6 py-4 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
                    <DialogTitle className="text-xl font-bold text-foreground tracking-tight">
                        Converter Lead
                    </DialogTitle>
                </DialogHeader>

                <form id="conversion-form" onSubmit={handleSubmit} className="space-y-6 p-6">
                    {/* Company Data */}
                    <div className="space-y-4">
                        <ThemeSectionHeader title="Dados Corporativos" iconColor="bg-emerald-500" />
                        <div className="grid grid-cols-2 gap-4">
                            <div ref={containerRef} className="col-span-2 space-y-1 relative">
                                <ThemeLabel>Empresa</ThemeLabel>
                                <div className="relative">
                                    <ThemeInput
                                        value={formData.company ?? ''}
                                        onChange={e => handleCompanyChange(e.target.value)}
                                        onFocus={() => setShowSuggestions(true)}
                                        placeholder="Nome da empresa..."
                                        className="pr-24"
                                    />
                                    {selectedAccountId && (
                                        <button
                                            type="button"
                                            onClick={() => setSelectedAccountId(null)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-emerald-500 hover:text-emerald-400 gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/20 transition-all cursor-pointer z-10"
                                            title="Clique para desvincular"
                                        >
                                            <Building className="h-3 w-3" />
                                            Vinculada ×
                                        </button>
                                    )}
                                </div>
                                {showSuggestions && filteredAccounts.length > 0 && (
                                    <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto p-1 animate-in fade-in-50 slide-in-from-top-1 duration-100">
                                        <div className="px-2 py-1 text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest border-b border-border mb-1">
                                            Empresas Cadastradas (Selecione para Vincular)
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
                                                <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                    Vincular
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="grid grid-cols-2 gap-4 col-span-2">
                                <div className="space-y-1">
                                    <ThemeLabel>CNPJ *</ThemeLabel>
                                    <ThemeInput
                                        required
                                        value={formData.cnpj}
                                        onChange={e => setFormData({ ...formData, cnpj: e.target.value })}
                                        className="border-emerald-500/20 focus:border-emerald-500"
                                        placeholder="00.000.000/0000-00"
                                        disabled={!!selectedAccountId}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <ThemeLabel>IE</ThemeLabel>
                                    <ThemeInput
                                        value={formData.ie}
                                        onChange={e => setFormData({ ...formData, ie: e.target.value })}
                                        placeholder="Isento"
                                        disabled={!!selectedAccountId}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Dados do Contato */}
                    <div className="space-y-4 pt-6 border-t border-border">
                        <ThemeSectionHeader title="Dados do Contato" iconColor="bg-emerald-500" />
                        <div className="grid grid-cols-2 gap-4">
                            <div ref={contactRef} className="col-span-2 space-y-1 relative">
                                <ThemeLabel>Nome do Contato *</ThemeLabel>
                                <div className="relative">
                                    <ThemeInput
                                        required
                                        value={formData.contact_name ?? ''}
                                        onChange={e => handleContactNameChange(e.target.value)}
                                        onFocus={() => setShowContactSuggestions(true)}
                                        placeholder="Nome do contato..."
                                        className="pr-24 border-emerald-500/20 focus:border-emerald-500"
                                        disabled={!!selectedContactId}
                                    />
                                    {selectedContactId && (
                                        <button
                                            type="button"
                                            onClick={handleDeselectContact}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center text-emerald-500 hover:text-emerald-400 gap-1 text-[9px] font-extrabold uppercase tracking-wider bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/20 transition-all cursor-pointer z-10"
                                            title="Clique para desvincular"
                                        >
                                            <User className="h-3 w-3" />
                                            Selecionado ×
                                        </button>
                                    )}
                                </div>
                                {showContactSuggestions && selectedAccountId && filteredContacts.length > 0 && (
                                    <div className="absolute z-50 left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto p-1 animate-in fade-in-50 slide-in-from-top-1 duration-100">
                                        <div className="px-2 py-1 text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest border-b border-border mb-1">
                                            Contatos Cadastrados (Selecione para Vincular)
                                        </div>
                                        {filteredContacts.map(contact => (
                                            <button
                                                key={contact.id}
                                                type="button"
                                                onClick={() => handleSelectContact(contact)}
                                                className="w-full text-left cursor-pointer px-3 py-2 text-xs font-bold rounded-lg hover:bg-muted text-foreground flex items-center justify-between transition-colors"
                                            >
                                                <span className="truncate flex items-center gap-2">
                                                    <User className="h-3.5 w-3.5 text-muted-foreground" />
                                                    {contact.name}
                                                </span>
                                                <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                                                    Selecionar
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="space-y-1">
                                <ThemeLabel>E-mail *</ThemeLabel>
                                <ThemeInput
                                    required
                                    type="email"
                                    value={formData.email ?? ''}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="email@exemplo.com"
                                    disabled={!!selectedContactId}
                                    className="border-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>
                            <div className="space-y-1">
                                <ThemeLabel>Telefone *</ThemeLabel>
                                <ThemeInput
                                    required
                                    value={formData.phone ?? ''}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                    placeholder="(00) 00000-0000"
                                    disabled={!!selectedContactId}
                                    className="border-emerald-500/20 focus:border-emerald-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Address Data */}
                    <div className="space-y-4 pt-6 border-t border-border">
                        <ThemeSectionHeader title="Endereço" iconColor="bg-stage-proposal" />
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <ThemeLabel>CEP *</ThemeLabel>
                                <div className="flex gap-2 relative">
                                    <ThemeInput
                                        required
                                        value={formData.zip || ''}
                                        onChange={e => setFormData({ ...formData, zip: e.target.value })}
                                        onBlur={handleCepSearch}
                                        disabled={!!selectedAccountId}
                                        className="pr-8"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground/60 pointer-events-none">
                                        {loadingCep ? (
                                            <Loader2 className="h-3.5 w-3.5 animate-spin text-emerald-500" />
                                        ) : (
                                            <Search className="h-3.5 w-3.5" />
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <ThemeLabel>Logradouro *</ThemeLabel>
                                <ThemeInput
                                    required
                                    value={formData.street || ''}
                                    onChange={e => setFormData({ ...formData, street: e.target.value })}
                                    disabled={!!selectedAccountId}
                                />
                            </div>
                            <div className="space-y-1">
                                <ThemeLabel>Número *</ThemeLabel>
                                <ThemeInput
                                    required
                                    value={formData.number || ''}
                                    onChange={e => setFormData({ ...formData, number: e.target.value })}
                                    disabled={!!selectedAccountId}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <ThemeLabel>Bairro</ThemeLabel>
                                <ThemeInput
                                    value={formData.neighborhood || ''}
                                    onChange={e => setFormData({ ...formData, neighborhood: e.target.value })}
                                    disabled={!!selectedAccountId}
                                />
                            </div>
                            <div className="space-y-1">
                                <ThemeLabel>Cidade *</ThemeLabel>
                                <ThemeInput
                                    required
                                    value={formData.city || ''}
                                    onChange={e => setFormData({ ...formData, city: e.target.value })}
                                    disabled={!!selectedAccountId}
                                />
                            </div>
                            <div className="space-y-1">
                                <ThemeLabel>Estado *</ThemeLabel>
                                <ThemeInput
                                    required
                                    maxLength={2}
                                    value={formData.state || ''}
                                    onChange={e => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
                                    className="uppercase"
                                    disabled={!!selectedAccountId}
                                />
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="pt-4">
                        <Button variant="ghost" type="button" onClick={onClose} className="mr-2 text-muted-foreground hover:text-foreground hover:bg-muted">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 font-bold min-w-[150px]">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle className="mr-2 h-4 w-4" />}
                            Concluir Conversão
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

