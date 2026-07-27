'use client';

import React, { useState, useEffect } from 'react';
import {
    Building2, MapPin, Users, Phone, Mail, User, FolderOpen,
    Briefcase, GitBranch, Edit2, Tag, Shield,
    LayoutDashboard, X
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

import type { Account, AccountContact, AccountBranch } from '@/types/account';
import { DocumentsTab } from '@/components/shared/DocumentsTab';
import {
    getAccountDocuments,
    uploadAccountDocument,
    getAccountDocumentSignedUrl,
    deleteAccountDocument,
    updateAccount,
} from '@/app/(dashboard)/accounts/actions';
import { useDraftForm, FloatingSaveBar, UnsavedChangesDialog } from '@/components/ui/floating-save-bar';
import { GhostField, GhostSelect, GhostTextarea } from '@/components/ui/ghost-field';
import { PostSalesTab } from '@/components/customers/PostSalesTab';
import { getAccountAssets, getAccountContracts } from '@/app/(dashboard)/customers/postSalesActions';

interface ViewAccountDrawerProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    account: Account | null;
    onEdit?: (account: Account) => void;
}

const statusColors: Record<string, string> = {
    Ativo: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
    Inativo: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const relationshipColors: Record<string, string> = {
    Cliente: 'bg-primary/10 text-primary',
    Fabricante: 'bg-stage-proposal/10 text-stage-proposal',
    Distribuidor: 'bg-warning/10 text-warning',
    Parceiro: 'bg-info/10 text-info',
    Outro: 'bg-muted text-muted-foreground',
};

export function ViewAccountDrawer({ open, onOpenChange, account: initialAccount, onEdit }: ViewAccountDrawerProps) {
    const router = useRouter();
    const [localAccount, setLocalAccount] = useState<Account | null>(initialAccount);

    // Sync state with prop changes (when a different account is selected)
    useEffect(() => {
        setLocalAccount(initialAccount);
    }, [initialAccount?.id]);

    const initialAccountData = React.useMemo(() => ({
        name: localAccount?.name || '',
        cnpj: localAccount?.cnpj || '',
        ie: localAccount?.ie || '',
        segment: localAccount?.segment || '',
        status: localAccount?.status || 'Ativo',
        relationship_type: localAccount?.relationship_type || 'Cliente',
        payment_terms: localAccount?.payment_terms || '',
        zip: localAccount?.zip || '',
        street: localAccount?.street || '',
        number: localAccount?.number || '',
        complement: localAccount?.complement || '',
        neighborhood: localAccount?.neighborhood || '',
        city: localAccount?.city || '',
        state: localAccount?.state || '',
        description: localAccount?.description || '',
    }), [localAccount]);

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
        initialData: initialAccountData,
        onSave: async (updated) => {
            if (!localAccount?.id) return;
            await updateAccount(localAccount.id, updated as Partial<Account>);
            setLocalAccount(prev => prev ? { ...prev, ...updated } : null);
            router.refresh();
        }
    });

    const [activeTab, setActiveTab] = useState('overview');

    // Reset tab when drawer opens with new account
    React.useEffect(() => {
        if (open) setActiveTab('overview');
    }, [localAccount?.id, open]);

    if (!localAccount) return null;

    const tabs = [
        { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
        { id: 'contacts', label: 'Contatos', icon: Users },
        { id: 'branches', label: 'Filiais', icon: GitBranch },
        { id: 'documents', label: 'Documentos', icon: FolderOpen },
        { id: 'postsales', label: 'Pós-Venda', icon: Shield },
    ];

    return (
        <Sheet open={open} onOpenChange={(val) => !val && safeExecute(() => onOpenChange(false))}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="w-full sm:max-w-[720px] flex flex-col p-0 gap-0"
                onPointerDownOutside={(e) => {
                    if (e.target instanceof Element && e.target.closest('.floating-save-bar')) {
                        e.preventDefault();
                    }
                }}
            >
                {/* ── Header ── */}
                <div className="border-b border-border px-6 pt-5 pb-4 shrink-0">
                    {/* Top row: title + actions */}
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                            <div className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center text-primary font-black text-lg border border-border overflow-hidden shrink-0">
                                {localAccount.logo_url ? (
                                    <img src={localAccount.logo_url} alt={localAccount.name} className="w-full h-full object-cover" />
                                ) : (
                                    <Building2 className="w-6 h-6" />
                                )}
                            </div>
                            <div className="min-w-0">
                                <SheetTitle className="font-bold text-foreground text-base tracking-tight leading-tight truncate">
                                    {formData.name || localAccount.name}
                                </SheetTitle>
                                <SheetDescription className="sr-only">Detalhes da empresa {localAccount.name}</SheetDescription>
                                <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 ${statusColors[localAccount.status] || statusColors.Ativo}`}>
                                        {localAccount.status || 'Ativo'}
                                    </Badge>
                                    <Badge variant="outline" className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 border-0 ${relationshipColors[localAccount.relationship_type || 'Cliente'] || relationshipColors.Outro}`}>
                                        {localAccount.relationship_type || 'Cliente'}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => safeExecute(() => onOpenChange(false))}>
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Subtitle info */}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {localAccount.cnpj && (
                            <span className="font-mono">{localAccount.cnpj}</span>
                        )}
                        {localAccount.segment && (
                            <span className="flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> {localAccount.segment}
                            </span>
                        )}
                        {localAccount.city && (
                            <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3" /> {localAccount.city}{localAccount.state ? `, ${localAccount.state}` : ''}
                            </span>
                        )}
                    </div>
                </div>

                {/* ── Tabs Bar ── */}
                <Tabs value={activeTab} onValueChange={(t) => safeExecute(() => setActiveTab(t))} className="flex-1 flex flex-col min-h-0">
                    <div className="border-b border-border bg-muted/20 px-4 shrink-0">
                        <div className="flex gap-0">
                            {tabs.map((tab) => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-1.5 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide border-b-2 transition-colors whitespace-nowrap ${activeTab === tab.id
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                                        }`}
                                >
                                    <tab.icon className="w-3.5 h-3.5" />
                                    {tab.label}
                                    {tab.id === 'contacts' && localAccount.contacts && localAccount.contacts.length > 0 && (
                                        <span className="ml-1 text-[9px] bg-primary/20 px-1.5 py-0.5 rounded-full">{localAccount.contacts.length}</span>
                                    )}
                                    {tab.id === 'branches' && localAccount.branches && localAccount.branches.length > 0 && (
                                        <span className="ml-1 text-[9px] bg-primary/20 px-1.5 py-0.5 rounded-full">{localAccount.branches.length}</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* ── Tab Content (scrollable) ── */}

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="m-0 flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
                        <div className="space-y-6">
                            {/* Company Info */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Dados Cadastrais</h3>
                                <div className="bg-card border border-border rounded-xl p-4 space-y-0.5">
                                    <GhostField label="Razão Social" value={formData.name} onChange={v => updateField('name', v)} />
                                    <GhostField label="CNPJ" value={formData.cnpj} onChange={v => updateField('cnpj', v)} mono />
                                    <GhostField label="Inscrição Estadual" value={formData.ie} onChange={v => updateField('ie', v)} mono />
                                    <GhostField label="Segmento" value={formData.segment} onChange={v => updateField('segment', v)} />
                                    <GhostSelect
                                        label="Tipo"
                                        value={formData.relationship_type}
                                        onChange={v => updateField('relationship_type', v)}
                                        options={[
                                            { value: 'Cliente', label: 'Cliente' },
                                            { value: 'Fabricante', label: 'Fabricante' },
                                            { value: 'Distribuidor', label: 'Distribuidor' },
                                            { value: 'Parceiro', label: 'Parceiro' },
                                            { value: 'Outro', label: 'Outro' },
                                        ]}
                                    />
                                    <GhostField label="Cond. Pagamento" value={formData.payment_terms} onChange={v => updateField('payment_terms', v)} />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Endereço</h3>
                                <div className="bg-card border border-border rounded-xl p-4 space-y-0.5">
                                    <GhostField label="CEP" value={formData.zip} onChange={v => updateField('zip', v)} mono />
                                    <GhostField label="Logradouro" value={formData.street} onChange={v => updateField('street', v)} />
                                    <GhostField label="Número" value={formData.number} onChange={v => updateField('number', v)} />
                                    <GhostField label="Complemento" value={formData.complement} onChange={v => updateField('complement', v)} />
                                    <GhostField label="Bairro" value={formData.neighborhood} onChange={v => updateField('neighborhood', v)} />
                                    <GhostField label="Cidade" value={formData.city} onChange={v => updateField('city', v)} />
                                    <GhostField label="Estado" value={formData.state} onChange={v => updateField('state', v)} />
                                </div>
                            </div>

                            {/* Tags */}
                            {localAccount.tags && localAccount.tags.length > 0 && (
                                <div className="space-y-3">
                                    <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Tags</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {localAccount.tags.map((tag: string) => (
                                            <Badge key={tag} variant="outline" className="bg-muted/50 text-xs font-bold">
                                                <Tag className="w-3 h-3 mr-1" /> {tag}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Description */}
                            <div className="space-y-3">
                                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Observações</h3>
                                <div className="bg-card border border-border rounded-xl p-4">
                                    <GhostTextarea
                                        value={formData.description}
                                        onChange={v => updateField('description', v)}
                                        placeholder="Adicione observações sobre esta empresa..."
                                    />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Contacts Tab */}
                    <TabsContent value="contacts" className="m-0 flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                Contatos ({localAccount.contacts?.length || 0})
                            </h3>
                            {(!localAccount.contacts || localAccount.contacts.length === 0) ? (
                                <EmptyState icon={Users} text="Nenhum contato cadastrado" sub="Adicione contatos na edição da empresa." />
                            ) : (
                                <div className="space-y-3">
                                    {localAccount.contacts.map((contact) => (
                                        <ContactCard key={contact.id} contact={contact} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Branches Tab */}
                    <TabsContent value="branches" className="m-0 flex-1 overflow-y-auto custom-scrollbar px-6 py-6">
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">
                                Filiais ({localAccount.branches?.length || 0})
                            </h3>
                            {(!localAccount.branches || localAccount.branches.length === 0) ? (
                                <EmptyState icon={GitBranch} text="Nenhuma filial cadastrada" sub="Adicione filiais na edição da empresa." />
                            ) : (
                                <div className="space-y-3">
                                    {localAccount.branches.map((branch) => (
                                        <BranchCard key={branch.id} branch={branch} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Documents Tab */}
                    <TabsContent value="documents" className="m-0 flex-1 min-h-0 overflow-hidden h-full">
                        <DocumentsTab
                            entityType="account"
                            entityId={localAccount.id}
                            fetchDocuments={getAccountDocuments}
                            uploadDocument={uploadAccountDocument}
                            getSignedUrl={getAccountDocumentSignedUrl}
                            deleteDocument={deleteAccountDocument}
                        />
                    </TabsContent>

                    {/* Post Sales Tab */}
                    <TabsContent value="postsales" className="m-0 flex-1 overflow-hidden h-full px-6 py-6">
                        <PostSalesTab
                            accountId={localAccount.id}
                            getAssets={getAccountAssets}
                            getContracts={getAccountContracts}
                        />
                    </TabsContent>
                </Tabs>

                <FloatingSaveBar
                    isDirty={isDirty && !showUnsavedModal}
                    changedCount={changedCount}
                    isSaving={isSaving}
                    onSave={saveChanges}
                    onDiscard={discardChanges}
                />

                <UnsavedChangesDialog
                    open={showUnsavedModal}
                    onOpenChange={setShowUnsavedModal}
                    onSave={saveChanges}
                    onDiscard={discardChanges}
                    isSaving={isSaving}
                />
            </SheetContent>
        </Sheet>
    );
}

// --- Sub-Components ---

function InfoRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
            <span className={`text-sm font-bold text-foreground ${mono ? 'font-mono' : ''}`}>
                {value || '—'}
            </span>
        </div>
    );
}

function ContactCard({ contact }: { contact: AccountContact }) {
    return (
        <div className="bg-card border border-border rounded-xl p-4 hover:border-primary/30 transition-all group">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                        <User className="w-4 h-4 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{contact.name}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">{contact.role || 'Contato'}</p>
                    </div>
                </div>
                {contact.is_primary && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-[9px] font-black uppercase">
                        Principal
                    </Badge>
                )}
            </div>
            <div className="space-y-1.5 pt-3 border-t border-border">
                {contact.email && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{contact.email}</span>
                    </div>
                )}
                {contact.mobile_phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{contact.mobile_phone}</span>
                    </div>
                )}
                {contact.landline_phone && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{contact.landline_phone}</span>
                    </div>
                )}
            </div>
        </div>
    );
}

function BranchCard({ branch }: { branch: AccountBranch }) {
    return (
        <div className="bg-card border border-border rounded-xl p-4 hover:border-stage-proposal/30 transition-all group">
            <div className="flex items-center gap-3 mb-3">
                <div className="h-9 w-9 rounded-full bg-stage-proposal/10 flex items-center justify-center shrink-0">
                    <Building2 className="w-4 h-4 text-stage-proposal" />
                </div>
                <div>
                    <p className="text-sm font-bold text-foreground group-hover:text-stage-proposal transition-colors">{branch.name}</p>
                    {branch.cnpj && <p className="text-[10px] text-muted-foreground font-mono">{branch.cnpj}</p>}
                </div>
            </div>
            <div className="space-y-1.5 pt-3 border-t border-border text-xs text-muted-foreground">
                <p>{branch.street}{branch.number ? `, ${branch.number}` : ''}{branch.complement ? ` - ${branch.complement}` : ''}</p>
                <p>{branch.neighborhood} — {branch.city}/{branch.state}</p>
                {branch.zip && <p className="font-mono text-[10px]">CEP: {branch.zip}</p>}
                {branch.ie && <p className="font-mono text-[10px]">IE: {branch.ie}</p>}
            </div>
        </div>
    );
}

function EmptyState({ icon: Icon, text, sub }: { icon: any; text: string; sub: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Icon className="w-7 h-7 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-bold text-foreground">{text}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        </div>
    );
}
