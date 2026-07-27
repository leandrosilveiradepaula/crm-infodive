'use client';

import React from 'react';
import { User, Mail, Phone, Plus, X, Users, AlertCircle, Briefcase, Star, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Deal } from '@/types/deal';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { updateDeal } from '@/app/(dashboard)/pipeline/actions';

interface StakeholdersTabProps {
    deal: Deal;
    setDeal: (deal: Deal | ((prev: Deal) => Deal)) => void;
    isEditing: boolean;
    /** All contacts fetched server-side from getAccountContacts() */
    allContacts: any[];
    formData?: any;
    updateField?: (field: string, value: any) => void;
}

export const StakeholdersTab = ({ deal, setDeal, isEditing, allContacts, formData, updateField }: StakeholdersTabProps) => {
    // No more useContacts() — contacts come from the server via prop
    const loading = false;
    const error = null;

    // UI state for adding new contact
    const [newStakeholderId, setNewStakeholderId] = React.useState<string>('');
    const [newStakeholderRole, setNewStakeholderRole] = React.useState<string>('');
    const [showAllContacts, setShowAllContacts] = React.useState<boolean>(false);

    // 2. Filter contacts for this specific account
    // Using loose equality and String coercion to be safe with UUIDs from different sources
    const currentAccountId = formData?.account_id || deal?.account_id;
    const availableContacts = React.useMemo(() => {
        if (showAllContacts || !currentAccountId) return allContacts;
        return allContacts.filter(c => String(c.account_id) === String(currentAccountId));
    }, [allContacts, currentAccountId, showAllContacts]);

    // Read from formData (draft state)
    const currentClientContactId = formData?.client_contact_id !== undefined ? formData.client_contact_id : deal.client_contact_id;
    const currentCustomFields = formData?.custom_fields || deal?.custom_fields || {};

    // Safely extract secondary contacts array
    let secondaryContacts: Array<{ contact_id: string; role: string }> = [];
    if (currentCustomFields.secondary_contacts && Array.isArray(currentCustomFields.secondary_contacts)) {
        secondaryContacts = currentCustomFields.secondary_contacts;
    }

    // --- Unified Stakeholders List Logic ---
    const allStakeholders: Array<{ contact_id: string; role: string; isPrimary: boolean }> = React.useMemo(() => {
        const list: Array<{ contact_id: string; role: string; isPrimary: boolean }> = [];

        // 1. Add Primary Client (if exists) at the top
        if (currentClientContactId) {
            list.push({
                contact_id: currentClientContactId,
                role: 'Cliente Principal (Decisor)',
                isPrimary: true
            });
        }

        // 2. Add Secondary Contacts
        secondaryContacts.forEach(sc => {
            if (sc.contact_id !== currentClientContactId && !list.find(l => l.contact_id === sc.contact_id)) {
                list.push({
                    contact_id: sc.contact_id,
                    role: sc.role,
                    isPrimary: false
                });
            }
        });
        return list;
    }, [currentClientContactId, secondaryContacts]);

    // Final list of selectable contacts (not already stakeholders)
    const selectableContacts = React.useMemo(() => {
        return availableContacts.filter(c => !allStakeholders.find(s => s.contact_id === c.id));
    }, [availableContacts, allStakeholders]);

    const setPrimaryStakeholder = (contactId: string) => {
        if (!updateField) return;

        let newSecondary = [...secondaryContacts];
        const oldPrimaryId = deal.client_contact_id;

        // Move old primary into secondary list so they aren't lost
        if (oldPrimaryId && oldPrimaryId !== contactId) {
            if (!newSecondary.find(sc => sc.contact_id === oldPrimaryId)) {
                newSecondary.push({ contact_id: oldPrimaryId, role: 'Stakeholder' });
            }
        }

        // Remove the new primary from secondary list as it's now top-level
        newSecondary = newSecondary.filter(sc => sc.contact_id !== contactId);

        const newCustomFields = { ...(deal.custom_fields || {}), secondary_contacts: newSecondary };

        // Determine if we should also update account_id if it's missing but contact has one
        let accountUpdate: any = {};
        if (!deal.account_id) {
            const contact = allContacts.find(c => c.id === contactId);
            if (contact?.account_id) {
                accountUpdate = { account_id: contact.account_id, company: contact.account?.name || deal.company };
            }
        }

        if (accountUpdate.hasOwnProperty('account_id')) {
            updateField('account_id', accountUpdate.account_id);
            updateField('company', accountUpdate.company);
        }
        updateField('client_contact_id', contactId);
        updateField('custom_fields', newCustomFields);
    };

    const removeStakeholder = (contactId: string, isPrimary: boolean) => {
        if (!updateField) return;
        
        if (isPrimary) {
            updateField('client_contact_id', null);
        } else {
            const newSecondary = secondaryContacts.filter(sc => sc.contact_id !== contactId);
            const newCustomFields = { ...(deal.custom_fields || {}), secondary_contacts: newSecondary };
            updateField('custom_fields', newCustomFields);
        }
    };

    const addStakeholder = () => {
        if (!updateField) return;
        
        if (!newStakeholderId) {
            toast.warning('Selecione um contato na lista antes de adicionar!');
            return;
        }

        const contact = allContacts.find(c => c.id === newStakeholderId);

        let accountUpdate = {};
        if (!deal.account_id && contact?.account_id) {
            accountUpdate = { account_id: contact.account_id, company: contact.account?.name || deal.company };
        }
        if (accountUpdate.hasOwnProperty('account_id')) {
            updateField('account_id', (accountUpdate as any).account_id);
            updateField('company', (accountUpdate as any).company);
        }

        if (!deal.client_contact_id && secondaryContacts.length === 0) {
            updateField('client_contact_id', newStakeholderId);
        } else {
            const newSecondary = [...secondaryContacts, { contact_id: newStakeholderId, role: newStakeholderRole }];
            const newCustomFields = { ...(deal.custom_fields || {}), secondary_contacts: newSecondary };
            updateField('custom_fields', newCustomFields);
        }

        setNewStakeholderId('');
        setNewStakeholderRole('');
        setShowAllContacts(false);
    };

    return (
        <div className="flex flex-col space-y-8 min-h-full">
            {/* Header */}
            <div>
                <h3 className="text-xl font-bold tracking-tight text-foreground">Clientes &amp; Stakeholders</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Gerencie os tomadores de decisão e influenciadores envolvidos nesta oportunidade.
                </p>
                {error && (
                    <div className="mt-4 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-center gap-3 text-rose-500 text-sm">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>Erro ao carregar contatos do banco de dados: {error}</span>
                    </div>
                )}
                {!loading && allContacts.length > 0 && availableContacts.length === 0 && deal?.account_id && !showAllContacts && (
                    <div className="flex flex-col gap-3 text-xs text-amber-500 mt-4 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p className="font-bold uppercase tracking-wider">Nenhum contato encontrado para esta empresa</p>
                        </div>
                        <p>Você pode buscar contatos de outras empresas ou contatos sem empresa vinculada clicando no botão abaixo.</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-fit h-8 text-[10px] uppercase font-bold border-amber-500/30 hover:bg-amber-500/10 text-amber-600"
                            onClick={() => setShowAllContacts(true)}
                        >
                            <Search className="w-3 h-3 mr-1.5" /> Buscar em todos os contatos
                        </Button>
                    </div>
                )}
                {!deal?.account_id && !showAllContacts && (
                    <div className="flex flex-col gap-3 text-xs text-amber-500 mt-4 bg-amber-500/10 p-4 rounded-xl border border-amber-500/20">
                        <div className="flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 shrink-0" />
                            <p className="font-bold uppercase tracking-wider">Oportunidade sem empresa vinculada</p>
                        </div>
                        <p>Sem uma empresa vinculada no cabeçalho, não podemos sugerir contatos específicos. Você pode vincular uma empresa ou buscar por qualquer contato existente no sistema.</p>
                        <Button
                            variant="outline"
                            size="sm"
                            className="w-fit h-8 text-[10px] uppercase font-bold border-amber-500/30 hover:bg-amber-500/10 text-amber-600"
                            onClick={() => setShowAllContacts(true)}
                        >
                            <Search className="w-3 h-3 mr-1.5" /> Buscar em todos os contatos
                        </Button>
                    </div>
                )}
            </div>

            {/* ── Unifed Stakeholders Section ──────────────────────────────────── */}
            <div className="space-y-4">

                {/* Unified Add Form — only visible when editing */}
                {isEditing && (
                    <div className="bg-card border border-primary/30 bg-primary/5 shadow-sm rounded-2xl p-5 flex flex-col md:flex-row gap-4 mb-6 relative">
                        <div className="flex-1 space-y-2.5">
                            <div className="flex justify-between items-center">
                                <Label className="text-[10px] uppercase tracking-wider font-bold text-primary">Selecionar Contato</Label>
                                {deal?.account_id && (
                                    <button
                                        onClick={() => setShowAllContacts(!showAllContacts)}
                                        className="text-[9px] uppercase font-black text-primary/60 hover:text-primary transition-colors underline decoration-dotted"
                                    >
                                        {showAllContacts ? 'Filtrar por empresa' : 'Ver todos'}
                                    </button>
                                )}
                            </div>
                            <Select
                                disabled={loading}
                                value={newStakeholderId || 'none'}
                                onValueChange={(val) => setNewStakeholderId(val === 'none' ? '' : val)}
                            >
                                <SelectTrigger className="w-full h-11 rounded-lg border-border/60 bg-background">
                                    <SelectValue placeholder="Selecione um contato…" />
                                </SelectTrigger>
                                <SelectContent className="rounded-xl border-border/60 shadow-lg max-h-[300px]">
                                    <SelectItem value="none" className="text-muted-foreground italic">Selecionar contato...</SelectItem>
                                    {selectableContacts.map(c => (
                                        <SelectItem key={c.id} value={c.id}>
                                            {c.name}
                                            {c.role ? ` (${c.role})` : ''}
                                            {showAllContacts && c.account?.name && ` - ${c.account.name}`}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex-1 space-y-2.5">
                            <Label className="text-[10px] uppercase tracking-wider font-bold text-primary">Papel no Negócio</Label>
                            <Input
                                type="text"
                                className="w-full h-11 bg-background border-border/60 rounded-lg placeholder:text-muted-foreground/40"
                                placeholder="Ex: Diretor, Jurídico, Técnico…"
                                value={newStakeholderRole}
                                onChange={e => setNewStakeholderRole(e.target.value)}
                            />
                        </div>

                        <div className="flex items-end md:pb-0">
                            <Button
                                className={`h-11 px-6 rounded-lg shadow-sm transition-all whitespace-nowrap ${!newStakeholderId
                                    ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                                    : 'bg-primary hover:bg-primary/90 text-white'
                                    }`}
                                onClick={addStakeholder}
                            >
                                <Plus className="w-4 h-4 mr-2" /> Adicionar
                            </Button>
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {allStakeholders.length === 0 && (
                    <div className="bg-card border-2 border-dashed border-border/50 rounded-2xl p-10 flex flex-col items-center text-center opacity-70 hover:opacity-100 transition-opacity">
                        <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
                            <Users className="h-8 w-8 text-muted-foreground opacity-60" />
                        </div>
                        <p className="font-bold text-foreground text-base">Nenhum stakeholder associado</p>
                        <p className="text-sm text-muted-foreground mt-2 max-w-sm">
                            Adicione o cliente principal e outros influenciadores (compras, jurídico, área técnica) que participam do negócio.
                        </p>
                    </div>
                )}

                {/* Stakeholders List */}
                <div className="grid gap-4">
                    {allStakeholders.map((stakeholder) => {
                        const contact = allContacts.find(c => c.id === stakeholder.contact_id);
                        if (!contact) return null;

                        return (
                            <div key={stakeholder.contact_id} className={`bg-card border shadow-sm rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center gap-4 transition-all relative overflow-hidden group ${stakeholder.isPrimary ? 'border-amber-500/30 shadow-md' : 'border-border/50 hover:shadow-md hover:border-border'}`}>
                                {stakeholder.isPrimary && (
                                    <div className="absolute top-0 left-0 w-1.5 h-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
                                )}

                                <Avatar className={`h-12 w-12 border-2 shrink-0 ${stakeholder.isPrimary ? 'border-amber-500/20 sm:ml-2' : 'border-border/50'}`}>
                                    <AvatarFallback className="bg-muted text-foreground font-bold">
                                        {contact.name.substring(0, 2).toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                <div className={`space-y-1.5 flex-1 w-full ${stakeholder.isPrimary ? 'sm:pl-2' : ''}`}>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                                        <h4 className="font-bold text-foreground text-sm truncate">{contact.name}</h4>
                                        {stakeholder.role && (
                                            <span className={`inline-flex text-[10px] px-2.5 py-1 rounded-md font-semibold tracking-wide border w-fit ${stakeholder.isPrimary ? 'bg-amber-500/10 text-amber-600 border-amber-500/20' : 'bg-muted text-foreground border-border/50'}`}>
                                                {stakeholder.role}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1.5">
                                            <Mail className="w-3.5 h-3.5 opacity-70" />
                                            <span className="truncate">{contact.email || 'Email não informado'}</span>
                                        </div>
                                        {(contact.mobile_phone || contact.landline_phone) && (
                                            <div className="flex items-center gap-1.5">
                                                <Phone className="w-3.5 h-3.5 opacity-70" />
                                                <span>{contact.mobile_phone || contact.landline_phone}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Actions visible only when editing */}
                                {isEditing && (
                                    <div className="flex items-center justify-end sm:pl-4 sm:border-l border-border/50 gap-2">
                                        {!stakeholder.isPrimary ? (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-10 w-10 text-amber-500 hover:text-amber-600 hover:bg-amber-500/10 rounded-lg transition-all"
                                                onClick={() => setPrimaryStakeholder(stakeholder.contact_id)}
                                                title="Definir como Cliente Principal"
                                            >
                                                <Star className="w-5 h-5" />
                                            </Button>
                                        ) : (
                                            <div
                                                className="h-10 w-10 flex items-center justify-center text-amber-500 bg-amber-500/10 rounded-lg"
                                                title="Cliente Principal Atual"
                                            >
                                                <Star className="w-5 h-5 fill-current" />
                                            </div>
                                        )}
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-10 w-10 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 rounded-lg transition-all"
                                            onClick={() => removeStakeholder(stakeholder.contact_id, stakeholder.isPrimary)}
                                            title="Remover Stakeholder"
                                        >
                                            <X className="w-5 h-5" />
                                        </Button>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};
