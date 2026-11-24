'use client';

import { useState, useEffect, useId } from 'react';
import { useRouter } from 'next/navigation';

import { Loader2, Plus, X, Search, CreditCard, Sparkles } from 'lucide-react';

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useDialogBackgroundInert } from '@/components/ui/useDialogBackgroundInert';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ThemeInput, ThemeLabel, ThemeSectionHeader } from '@/components/ui/theme/ThemeComponents';

import { CompanyParserModal } from './CompanyParserModal';
import { CustomerContactsSection } from './CustomerContactsSection';
import { CustomerBranchesSection } from './CustomerBranchesSection';

import { createAccount, updateAccount } from '@/app/(dashboard)/customers/actions';
import { CONFIG } from '@/lib/config';
import { type Account, type AccountContact, type AccountBranch } from '@/types/account';

interface CustomerFormModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    customer?: Account | null;
}

export function CustomerFormModal({ open, onOpenChange, customer }: CustomerFormModalProps) {
    const router = useRouter();
    const formId = useId();
    useDialogBackgroundInert(open);
    const [loading, setLoading] = useState(false);
    const [loadingCep, setLoadingCep] = useState(false);
    const [isParserOpen, setIsParserOpen] = useState(false);
    const [formData, setFormData] = useState<Partial<Account>>({
        name: '',
        cnpj: '',
        ie: '',
        segment: 'Geral',
        status: 'Ativo',
        zip: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        contacts: [],
        branches: [],
        tags: [],
        relationship_type: 'Cliente',
        payment_terms: ''
    });

    const [newTag, setNewTag] = useState('');

    const [targetBranchId, setTargetBranchId] = useState<string | null>(null);

    const handleCompanyParsed = (data: Record<string, string>) => {
        if (targetBranchId) {
            // Update specific branch
            setFormData(prev => ({
                ...prev,
                branches: prev.branches?.map(b => b.id === targetBranchId ? {
                    ...b,
                    name: data.name || b.name,
                    cnpj: data.cnpj || b.cnpj,
                    ie: data.ie || b.ie,
                    zip: data.zip || b.zip,
                    street: data.street || b.street,
                    number: data.number || b.number,
                    complement: data.complement || b.complement,
                    neighborhood: data.neighborhood || b.neighborhood,
                    city: data.city || b.city,
                    state: data.state || b.state,
                } : b)
            }));
            setTargetBranchId(null);
        } else {
            // Update main company
            setFormData(prev => ({
                ...prev,
                name: data.name || prev.name,
                cnpj: data.cnpj || prev.cnpj,
                ie: data.ie || prev.ie,
                zip: data.zip || prev.zip,
                street: data.street || prev.street,
                number: data.number || prev.number,
                complement: data.complement || prev.complement,
                neighborhood: data.neighborhood || prev.neighborhood,
                city: data.city || prev.city,
                state: data.state || prev.state,
                // Add contact if email/phone exists and lists are empty
                contacts: (prev.contacts?.length === 0 && (data.email || data.phone)) ? [{
                    id: Math.random().toString(36).substr(2, 9),
                    name: 'Contato Principal',
                    email: data.email || '',
                    mobile_phone: data.phone || '',
                    landline_phone: '',
                    role: 'Administrativo',
                    is_primary: true
                }] : prev.contacts
            }));
        }
    };


    // Reset or Load data
    useEffect(() => {
        if (customer) {
            setFormData({ ...customer });
        } else {
            setFormData({
                name: '',
                cnpj: '',
                ie: '',
                segment: 'Geral',
                status: 'Ativo',
                zip: '',
                street: '',
                number: '',
                complement: '',
                neighborhood: '',
                city: '',
                state: '',
                contacts: [],
                branches: [],
                tags: [],
                relationship_type: 'Cliente',
                payment_terms: ''
            });
        }
    }, [customer, open]);

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
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf
                }));
            }
        } catch (error) {
            console.error('CEP Error', error);
        } finally {
            setLoadingCep(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            if (customer) {
                await updateAccount(customer.id, formData);
            } else {
                await createAccount(formData);
            }
            onOpenChange(false);
            router.refresh();
        } catch (error) {
            console.error('Error saving customer:', error);
            alert('Erro ao salvar empresa.');
        } finally {
            setLoading(false);
        }
    };

    const addContact = () => {
        const newContact: AccountContact = {
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            email: '',
            mobile_phone: '',
            landline_phone: '',
            role: 'Colaborador',
            is_primary: formData.contacts?.length === 0
        };
        setFormData(prev => ({ ...prev, contacts: [...(prev.contacts || []), newContact] }));
    };

    const updateContact = (id: string, field: keyof AccountContact, value: string | boolean) => {
        setFormData(prev => ({
            ...prev,
            contacts: prev.contacts?.map(c => c.id === id ? { ...c, [field]: value } : c)
        }));
    };

    const removeContact = (id: string) => {
        setFormData(prev => ({
            ...prev,
            contacts: prev.contacts?.filter(c => c.id !== id)
        }));
    };

    // Branches Logic
    const addBranch = () => {
        const newBranch: AccountBranch = {
            id: Math.random().toString(36).substr(2, 9),
            name: '',
            zip: '',
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            cnpj: '',
            ie: ''
        };
        setFormData(prev => ({ ...prev, branches: [...(prev.branches || []), newBranch] }));
    };

    const updateBranch = (id: string, field: keyof AccountBranch, value: string) => {
        setFormData(prev => ({
            ...prev,
            branches: prev.branches?.map(b => b.id === id ? { ...b, [field]: value } : b)
        }));
    };

    const removeBranch = (id: string) => {
        setFormData(prev => ({
            ...prev,
            branches: prev.branches?.filter(b => b.id !== id)
        }));
    };

    // Tags Logic
    const addTag = () => {
        if (!newTag.trim()) return;
        setFormData(prev => ({
            ...prev,
            tags: [...(prev.tags || []), newTag.trim()]
        }));
        setNewTag('');
    };

    const removeTag = (tag: string) => {
        setFormData(prev => ({
            ...prev,
            tags: prev.tags?.filter(t => t !== tag)
        }));
    };


    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[800px] bg-card border-border text-foreground rounded-[var(--radius-panel)] max-h-[var(--ds-form-dialog-max-height)] overflow-y-auto p-0">
                <DialogHeader className="px-6 py-4 border-b border-border bg-surface-subtle flex flex-row items-center justify-between">
                    <DialogTitle className="text-section-title font-bold text-foreground tracking-tight">
                        {customer ? 'Editar Empresa' : 'Nova Empresa'}
                    </DialogTitle>
                    <DialogDescription className="sr-only">Gerenciar informações, contatos e endereço da empresa.</DialogDescription>
                    {!customer && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsParserOpen(true)}
                            className="gap-2 text-primary border-primary/20 hover:bg-primary/10 hover:text-primary"
                        >
                            <Sparkles className="h-4 w-4" />
                            Preencher com IA (CNPJ/Print)
                        </Button>
                    )}
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-6 p-6">
                    {/* Basic Info */}
                    <div className="space-y-4">
                        <ThemeSectionHeader title="Informações Básicas" />
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <ThemeLabel htmlFor={`${formId}-name`}>Razão Social / Nome</ThemeLabel>
                                <ThemeInput id={`${formId}-name`}
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    placeholder="Ex: Minha Empresa Ltda"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <ThemeLabel htmlFor={`${formId}-cnpj`}>CNPJ</ThemeLabel>
                                    <ThemeInput id={`${formId}-cnpj`}
                                        value={formData.cnpj || ''}
                                        onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
                                        placeholder="00.000.000/0000-00"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <ThemeLabel htmlFor={`${formId}-ie`}>Inscrição Estadual</ThemeLabel>
                                    <ThemeInput id={`${formId}-ie`}
                                        value={formData.ie || ''}
                                        onChange={(e) => setFormData({ ...formData, ie: e.target.value })}
                                        placeholder="Isento ou número"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <ThemeLabel htmlFor={`${formId}-segment`}>Segmento</ThemeLabel>
                                <Select
                                    value={formData.segment}
                                    onValueChange={(val) => setFormData({ ...formData, segment: val })}
                                >
                                    <SelectTrigger id={`${formId}-segment`} aria-label="Segmento" className="bg-background border-border text-foreground h-[34px] rounded-[var(--radius-panel)] text-metadata-ui font-bold focus:ring-1 focus:ring-primary border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border text-popover-foreground">
                                        <SelectItem value="Geral">Geral</SelectItem>
                                        <SelectItem value="Tecnologia">Tecnologia</SelectItem>
                                        <SelectItem value="Varejo">Varejo</SelectItem>
                                        <SelectItem value="Financeiro">Financeiro</SelectItem>
                                        <SelectItem value="Industria">Indústria</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <ThemeLabel htmlFor={`${formId}-type`}>Tipo</ThemeLabel>
                                <Select
                                    value={formData.relationship_type}
                                    onValueChange={(val) => setFormData({ ...formData, relationship_type: val })}
                                >
                                    <SelectTrigger id={`${formId}-type`} aria-label="Tipo" className="bg-background border-border text-foreground h-[34px] rounded-[var(--radius-panel)] text-metadata-ui font-bold focus:ring-1 focus:ring-primary border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border text-popover-foreground">
                                        <SelectItem value="Cliente">Cliente</SelectItem>
                                        <SelectItem value="Parceiro">Parceiro</SelectItem>
                                        <SelectItem value="Fornecedor">Fornecedor</SelectItem>
                                        <SelectItem value="Distribuidor">Distribuidor</SelectItem>
                                        <SelectItem value="Fabricante">Fabricante</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-1">
                                <ThemeLabel htmlFor={`${formId}-status`}>Status</ThemeLabel>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val as Account['status'] })}
                                >
                                    <SelectTrigger id={`${formId}-status`} aria-label="Status" className="bg-background border-border text-foreground h-[34px] rounded-[var(--radius-panel)] text-metadata-ui font-bold focus:ring-1 focus:ring-primary border">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-popover border-border text-popover-foreground">
                                        <SelectItem value="Ativo">Ativo</SelectItem>
                                        <SelectItem value="Inativo">Inativo</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {/* Payment Terms - Conditional */}
                        {formData.relationship_type === 'Distribuidor' && (
                            <div className="space-y-1 pt-2 animate-in slide-in-from-top-2">
                                <ThemeLabel htmlFor={`${formId}-payment`} className="flex items-center gap-2 text-success-readable">
                                    <CreditCard className="h-3 w-3" /> Condições de Pagamento Padrão
                                </ThemeLabel>
                                <Textarea id={`${formId}-payment`}
                                    value={formData.payment_terms || ''}
                                    onChange={(e) => setFormData({ ...formData, payment_terms: e.target.value })}
                                    className="bg-background border-border text-foreground min-h-[80px] rounded-[var(--radius-panel)] text-metadata-ui font-medium focus:ring-1 focus:ring-success"
                                    placeholder="Ex: 30/60/90 dias, Antecipado..."
                                />
                            </div>
                        )}

                        {/* Tags */}
                        <div className="space-y-2 pt-2">
                            <ThemeLabel htmlFor={`${formId}-tags`}>Tags</ThemeLabel>
                            <div className="flex gap-2">
                                <ThemeInput id={`${formId}-tags`}
                                    value={newTag}
                                    onChange={(e) => setNewTag(e.target.value)}
                                    placeholder="Digite uma tag..."
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            addTag();
                                        }
                                    }}
                                />
                                <Button type="button" onClick={addTag} aria-label="Adicionar tag" variant="secondary" className="h-[34px] bg-muted hover:bg-muted/80 text-foreground border border-border">
                                    <Plus className="h-4 w-4" />
                                </Button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {formData.tags?.map(tag => (
                                    <Badge key={tag} variant="secondary" className="bg-primary/10 text-primary border border-primary/20 rounded-[var(--radius-control)] px-2 py-1 text-metadata-ui font-bold uppercase tracking-wider">
                                        {tag}
                                        <button type="button" aria-label={`Remover tag ${tag}`} onClick={() => removeTag(tag)} className="ml-1.5 hover:text-foreground transition-colors">
                                            <X className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>


                    {/* Address */}
                    <div className="space-y-4 pt-6 border-t border-border">
                        <ThemeSectionHeader title="Endereço" iconColor="bg-stage-proposal" />
                        <div className="grid grid-cols-4 gap-4">
                            <div className="space-y-1">
                                <ThemeLabel htmlFor={`${formId}-zip`}>CEP</ThemeLabel>
                                <div className="flex gap-2 relative">
                                    <ThemeInput id={`${formId}-zip`}
                                        value={formData.zip || ''}
                                        onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                                        onBlur={handleCepSearch}
                                        className="pr-8"
                                    />
                                    <div className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground">
                                        {loadingCep ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Search className="h-3.5 w-3.5" />}
                                    </div>
                                </div>
                            </div>
                            <div className="col-span-2 space-y-1">
                                <ThemeLabel htmlFor={`${formId}-street`}>Logradouro</ThemeLabel>
                                <ThemeInput id={`${formId}-street`}
                                    value={formData.street || ''}
                                    onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <ThemeLabel htmlFor={`${formId}-number`}>Número</ThemeLabel>
                                <ThemeInput id={`${formId}-number`}
                                    value={formData.number || ''}
                                    onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <ThemeLabel htmlFor={`${formId}-neighborhood`}>Bairro</ThemeLabel>
                                <ThemeInput id={`${formId}-neighborhood`}
                                    value={formData.neighborhood || ''}
                                    onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <ThemeLabel htmlFor={`${formId}-city`}>Cidade</ThemeLabel>
                                <ThemeInput id={`${formId}-city`}
                                    value={formData.city || ''}
                                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <ThemeLabel htmlFor={`${formId}-state`}>Estado</ThemeLabel>
                                <ThemeInput id={`${formId}-state`}
                                    value={formData.state || ''}
                                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                                    maxLength={2}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Contacts */}
                    <CustomerContactsSection
                        contacts={formData.contacts || []}
                        onAddContact={addContact}
                        onUpdateContact={updateContact}
                        onRemoveContact={removeContact}
                        onSetPrimary={(id) => {
                            setFormData(prev => ({
                                ...prev,
                                contacts: prev.contacts?.map(c => ({ ...c, is_primary: c.id === id }))
                            }));
                        }}
                    />

                    {/* Branches */}
                    <CustomerBranchesSection
                        branches={formData.branches || []}
                        onAddBranch={addBranch}
                        onUpdateBranch={updateBranch}
                        onRemoveBranch={removeBranch}
                        onOpenParser={(id) => {
                            setTargetBranchId(id);
                            setIsParserOpen(true);
                        }}
                    />


                    <DialogFooter>
                        <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="text-muted-foreground">
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} size="lg" className="w-full sm:w-auto">
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {customer ? 'Salvar Alterações' : 'Cadastrar Empresa'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>

            <CompanyParserModal
                isOpen={isParserOpen}
                onClose={() => setIsParserOpen(false)}
                onDataParsed={handleCompanyParsed}
            />
        </Dialog >
    );
}
