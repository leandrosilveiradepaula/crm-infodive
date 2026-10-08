'use client';

import React, { useState, useCallback } from 'react';
import {
    X, Building2, MapPin, Users, Phone, Mail, User, FolderOpen,
    Briefcase, GitBranch, Edit2, Tag, FileText, ExternalLink,
    LayoutDashboard, Shield
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

import type { Account, AccountContact, AccountBranch } from '@/types/account';
import { DocumentsTab } from '@/components/shared/DocumentsTab';
import {
    getAccountDocuments,
    uploadAccountDocument,
    getAccountDocumentSignedUrl,
    deleteAccountDocument,
} from '@/app/(dashboard)/accounts/actions';
import { PostSalesTab } from '@/components/customers/PostSalesTab';
import { getAccountAssets, getAccountContracts } from '@/app/(dashboard)/customers/postSalesActions';

interface ViewAccountModalProps {
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

export function ViewAccountModal({ open, onOpenChange, account, onEdit }: ViewAccountModalProps) {
    const [activeTab, setActiveTab] = useState('overview');

    if (!account) return null;

    const primaryContact = account.contacts?.find(c => c.is_primary) || account.contacts?.[0];

    const tabs = [
        { id: 'overview', label: 'Visão Geral', icon: LayoutDashboard },
        { id: 'contacts', label: 'Contatos', icon: Users },
        { id: 'branches', label: 'Filiais', icon: GitBranch },
        { id: 'documents', label: 'Documentos', icon: FolderOpen },
        { id: 'postsales', label: 'Pós-Venda', icon: Shield },
    ];

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[95vw] w-[1200px] max-h-[92vh] h-[92vh] p-0 overflow-hidden bg-background border-border rounded-2xl flex flex-col">
                <DialogHeader className="sr-only">
                    <DialogTitle>{account.name}</DialogTitle>
                    <DialogDescription>Detalhes da empresa</DialogDescription>
                </DialogHeader>

                {/* Header */}
                <div className="flex items-center justify-between px-8 py-5 border-b border-border bg-card/50 shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center text-primary font-black text-xl border border-border overflow-hidden">
                            {account.logo_url ? (
                                <img src={account.logo_url} alt={account.name} className="w-full h-full object-cover" />
                            ) : (
                                <Building2 className="w-7 h-7" />
                            )}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h2 className="text-xl font-bold text-foreground tracking-tight">{account.name}</h2>
                                <Badge variant="outline" className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 ${statusColors[account.status] || statusColors.Ativo}`}>
                                    {account.status || 'Ativo'}
                                </Badge>
                                <Badge variant="outline" className={`text-xs font-black uppercase tracking-wider px-2 py-0.5 border-0 ${relationshipColors[account.relationship_type || 'Cliente'] || relationshipColors.Outro}`}>
                                    {account.relationship_type || 'Cliente'}
                                </Badge>
                            </div>
                            <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                {account.cnpj && (
                                    <span className="font-mono">{account.cnpj}</span>
                                )}
                                {account.segment && (
                                    <span className="flex items-center gap-1">
                                        <Briefcase className="w-3 h-3" /> {account.segment}
                                    </span>
                                )}
                                {account.city && (
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {account.city}{account.state ? `, ${account.state}` : ''}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {onEdit && (
                            <Button
                                variant="outline"
                                size="sm"
                                className="text-xs font-bold"
                                onClick={() => {
                                    onOpenChange(false);
                                    setTimeout(() => onEdit(account), 200);
                                }}
                            >
                                <Edit2 className="w-3.5 h-3.5 mr-1.5" /> Editar
                            </Button>
                        )}
                    </div>
                </div>

                {/* Tabs */}
                <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col min-h-0">
                    <div className="px-8 pt-4 shrink-0">
                        <TabsList>
                            {tabs.map((tab) => (
                                <TabsTrigger
                                    key={tab.id}
                                    value={tab.id}
                                >
                                    <tab.icon className="w-4 h-4" />
                                    {tab.label}
                                    {tab.id === 'contacts' && account.contacts?.length > 0 && (
                                        <span className="ml-1 text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">{account.contacts.length}</span>
                                    )}
                                    {tab.id === 'branches' && account.branches?.length > 0 && (
                                        <span className="ml-1 text-xs bg-primary/20 px-1.5 py-0.5 rounded-full">{account.branches.length}</span>
                                    )}
                                </TabsTrigger>
                            ))}
                        </TabsList>
                    </div>

                    {/* Overview Tab */}
                    <TabsContent value="overview" className="m-0 flex-1 overflow-y-auto custom-scrollbar p-8">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Company Info */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Dados Cadastrais</h3>
                                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                                    <InfoRow label="Razão Social" value={account.name} />
                                    <InfoRow label="CNPJ" value={account.cnpj} mono />
                                    <InfoRow label="Inscrição Estadual" value={account.ie} mono />
                                    <InfoRow label="Segmento" value={account.segment} />
                                    <InfoRow label="Tipo" value={account.relationship_type || 'Cliente'} />
                                    <InfoRow label="Cond. Pagamento" value={account.payment_terms} />
                                </div>
                            </div>

                            {/* Address */}
                            <div className="space-y-6">
                                <h3 className="text-sm font-black text-foreground uppercase tracking-widest">Endereço</h3>
                                <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
                                    <InfoRow label="CEP" value={account.zip} mono />
                                    <InfoRow label="Logradouro" value={`${account.street || ''}${account.number ? `, ${account.number}` : ''}`} />
                                    {account.complement && <InfoRow label="Complemento" value={account.complement} />}
                                    <InfoRow label="Bairro" value={account.neighborhood} />
                                    <InfoRow label="Cidade" value={account.city} />
                                    <InfoRow label="Estado" value={account.state} />
                                </div>

                                {/* Tags */}
                                {account.tags && account.tags.length > 0 && (
                                    <div>
                                        <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-3">Tags</h3>
                                        <div className="flex flex-wrap gap-2">
                                            {account.tags.map((tag: string) => (
                                                <Badge key={tag} variant="outline" className="bg-muted/50 text-xs font-bold">
                                                    <Tag className="w-3 h-3 mr-1" /> {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Description */}
                                {account.description && (
                                    <div>
                                        <h3 className="text-sm font-black text-foreground uppercase tracking-widest mb-3">Observações</h3>
                                        <div className="bg-card border border-border rounded-2xl p-4">
                                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{account.description}</p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </TabsContent>

                    {/* Contacts Tab */}
                    <TabsContent value="contacts" className="m-0 flex-1 overflow-y-auto custom-scrollbar p-8">
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
                                Contatos ({account.contacts?.length || 0})
                            </h3>
                            {(!account.contacts || account.contacts.length === 0) ? (
                                <EmptyState icon={Users} text="Nenhum contato cadastrado" sub="Adicione contatos na edição da empresa." />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {account.contacts.map((contact) => (
                                        <ContactCard key={contact.id} contact={contact} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* Branches Tab */}
                    <TabsContent value="branches" className="m-0 flex-1 overflow-y-auto custom-scrollbar p-8">
                        <div className="space-y-6">
                            <h3 className="text-sm font-black text-foreground uppercase tracking-widest">
                                Filiais ({account.branches?.length || 0})
                            </h3>
                            {(!account.branches || account.branches.length === 0) ? (
                                <EmptyState icon={GitBranch} text="Nenhuma filial cadastrada" sub="Adicione filiais na edição da empresa." />
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {account.branches.map((branch) => (
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
                            entityId={account.id}
                            fetchDocuments={getAccountDocuments}
                            uploadDocument={uploadAccountDocument}
                            getSignedUrl={getAccountDocumentSignedUrl}
                            deleteDocument={deleteAccountDocument}
                        />
                    </TabsContent>

                    {/* Post Sales Tab */}
                    <TabsContent value="postsales" className="m-0 flex-1 overflow-hidden h-full p-8">
                        <PostSalesTab
                            accountId={account.id}
                            getAssets={getAccountAssets}
                            getContracts={getAccountContracts}
                        />
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
}

// --- Sub-Components ---

function InfoRow({ label, value, mono }: { label: string; value?: string | null; mono?: boolean }) {
    return (
        <div className="flex items-center justify-between py-1">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{label}</span>
            <span className={`text-sm font-bold text-foreground ${mono ? 'font-mono' : ''}`}>
                {value || '—'}
            </span>
        </div>
    );
}

function ContactCard({ contact }: { contact: AccountContact }) {
    return (
        <div className="bg-card border border-border rounded-2xl p-5 hover:border-primary/30 transition-all group">
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{contact.name}</p>
                        <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">{contact.role || 'Contato'}</p>
                    </div>
                </div>
                {contact.is_primary && (
                    <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/20 text-xs font-black uppercase">
                        Principal
                    </Badge>
                )}
            </div>
            <div className="space-y-2 pt-3 border-t border-border">
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
        <div className="bg-card border border-border rounded-2xl p-5 hover:border-stage-proposal/30 transition-all group">
            <div className="flex items-center gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-stage-proposal/10 flex items-center justify-center">
                    <Building2 className="w-5 h-5 text-stage-proposal" />
                </div>
                <div>
                    <p className="text-sm font-bold text-foreground group-hover:text-stage-proposal transition-colors">{branch.name}</p>
                    {branch.cnpj && <p className="text-xs text-muted-foreground font-mono">{branch.cnpj}</p>}
                </div>
            </div>
            <div className="space-y-1.5 pt-3 border-t border-border text-xs text-muted-foreground">
                <p>{branch.street}{branch.number ? `, ${branch.number}` : ''}{branch.complement ? ` - ${branch.complement}` : ''}</p>
                <p>{branch.neighborhood} — {branch.city}/{branch.state}</p>
                {branch.zip && <p className="font-mono text-xs">CEP: {branch.zip}</p>}
                {branch.ie && <p className="font-mono text-xs">IE: {branch.ie}</p>}
            </div>
        </div>
    );
}

function EmptyState({ icon: Icon, text, sub }: { icon: any; text: string; sub: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-16 w-16 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <Icon className="w-8 h-8 text-muted-foreground/40" />
            </div>
            <p className="text-sm font-bold text-foreground">{text}</p>
            <p className="text-xs text-muted-foreground mt-1">{sub}</p>
        </div>
    );
}
