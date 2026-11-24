
import React, { useState } from 'react';
import { Building2, User, Globe, Mail, Phone, ExternalLink, ChevronDown } from 'lucide-react';
import { updateDeal } from '@/app/(dashboard)/pipeline/actions';
import { Deal } from '@/types/deal';
import { Account, AccountContact } from '@/types/account';
import { Contact } from '@/types/contact';
import { toast } from 'sonner';

interface PartnersTabProps {
    deal: Deal;
    isEditing: boolean;
    /** Distributor accounts from server — each has contacts[] embedded */
    distributors?: Account[];
    /** ALL accounts from server (for manufacturer matching) — each has contacts[] */
    allAccounts?: Account[];
    /** ALL contacts from server (getAccountContacts) */
    allContacts?: Contact[];
}

export const PartnersTab = ({
    deal,
    isEditing,
    distributors: propDistributors = [],
    allAccounts = [],
    allContacts = [],
}: PartnersTabProps) => {
    const [selectedDistributor, setSelectedDistributor] = useState<string>(deal.distributor_id || '');
    const [selectedDistributorContact, setSelectedDistributorContact] = useState<string>(deal.distributor_contact_id || '');
    const [selectedManufacturerContact, setSelectedManufacturerContact] = useState<string>(deal.manufacturer_contact_id || '');

    // Distributors: prefer prop list (server), fall back to filtering allAccounts
    const distributors = propDistributors.length > 0
        ? propDistributors
        : allAccounts.filter((a) => a.relationship_type === 'Distribuidor');

    const selectedDistributorObj = distributors.find((d) => d.id === selectedDistributor);

    // Contacts for the selected distributor — prefer embedded contacts, fall back to allContacts filter
    const distributorContacts: Contact[] = selectedDistributorObj?.contacts?.length
        ? selectedDistributorObj.contacts as Contact[]
        : allContacts.filter((c) => c.account_id === selectedDistributor);

    // Auto-detect manufacturers from deal products
    const dealManufacturers = React.useMemo(() => {
        if (!deal.deal_products || deal.deal_products.length === 0) return [];

        const detectedNames = new Set<string>();
        deal.deal_products.forEach((p: any) => {
            if (p.manufacturer?.trim()) {
                detectedNames.add(p.manufacturer.trim().toUpperCase());
                return;
            }
            const first = (p.name || '').split(' ')[0].toUpperCase();
            if (/^[A-Z]{2,10}$/.test(first)) detectedNames.add(first);
            const skuPrefix = (p.sku || '').split('-')[0].toUpperCase();
            if (p.sku?.includes('-') && /^[A-Z]{2,10}$/.test(skuPrefix)) detectedNames.add(skuPrefix);
        });

        if (detectedNames.size === 0) return [];

        // Match against ALL accounts (not just Fabricante type, since name might be "IBM BRASIL...")
        const matched = allAccounts.filter((a) =>
            Array.from(detectedNames).some(name =>
                a.name.toUpperCase().includes(name) || name.includes(a.name.toUpperCase())
            )
        );
        const matchedNames = new Set<string>(
            matched.flatMap((a) =>
                Array.from(detectedNames).filter((name: string) =>
                    a.name.toUpperCase().includes(name) || name.includes(a.name.toUpperCase())
                )
            )
        );
        const virtual = Array.from(detectedNames)
            .filter(name => !matchedNames.has(name))
            .map(name => ({ id: `virtual-${name}`, name, logo_url: null, contacts: [] } as unknown as Account));

        return [...matched, ...virtual];
    }, [deal.deal_products, allAccounts]);

    const firstRealManufacturer = dealManufacturers.find((m) => !m.id.startsWith('virtual-'));

    // Contacts for a manufacturer account (embedded in contacts, or filtered from allContacts)
    const getManufacturerContacts = (mfr: Account): (Contact | AccountContact)[] => {
        if (mfr.id.startsWith('virtual-')) return [];
        if (mfr.contacts?.length) return mfr.contacts;
        return (allContacts || []) as (Contact | AccountContact)[];
    };

    const handleDistributorChange = async (id: string) => {
        setSelectedDistributor(id);
        setSelectedDistributorContact('');
        try {
            await updateDeal(deal.id, { distributor_id: id || null, distributor_contact_id: null });
            toast.success('Distribuidor atualizado!');
        } catch { toast.error('Erro ao atualizar distribuidor'); }
    };

    const handleDistributorContactChange = async (id: string) => {
        setSelectedDistributorContact(id);
        try {
            await updateDeal(deal.id, { distributor_contact_id: id || null });
            toast.success('Contato atualizado!');
        } catch { toast.error('Erro ao atualizar contato'); }
    };

    const handleManufacturerContactChange = async (id: string) => {
        setSelectedManufacturerContact(id);
        try {
            await updateDeal(deal.id, { manufacturer_contact_id: id || null });
            toast.success('Contato do fabricante atualizado!');
        } catch { toast.error('Erro ao atualizar contato'); }
    };

    const ContactCard = ({ contactId, contacts }: { contactId: string; contacts: (Contact | AccountContact)[] }) => {
        const c = contacts.find((x) => x.id === contactId);
        if (!c) return null;
        return (
            <div className="mt-3 pt-3 border-t border-border/30 space-y-1.5">
                <div className="flex items-center gap-2 ds-type-metadata">
                    <User className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{c.name}</span>
                    {c.role && <span className="text-muted-foreground">· {c.role}</span>}
                </div>
                {c.email && <div className="flex items-center gap-2 ds-type-metadata text-muted-foreground"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{c.email}</span></div>}
                {(c.mobile_phone || c.landline_phone) && <div className="flex items-center gap-2 ds-type-metadata text-muted-foreground"><Phone className="h-3 w-3 shrink-0" />{c.mobile_phone || c.landline_phone}</div>}
            </div>
        );
    };

    const ContactSelect = ({ value, onChange, contacts, disabled, ringColor = 'focus:ring-primary/20' }: any) => (
        contacts.length > 0 ? (
            <div className="relative">
                <select
                    aria-label="Selecionar contato do parceiro" className={`w-full bg-muted/50 border border-border rounded-[var(--radius-panel)] px-4 py-3 ds-type-body text-foreground outline-none appearance-none cursor-pointer hover:bg-muted disabled:opacity-50 pr-8 focus:ring-2 ${ringColor}`}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    disabled={disabled}
                >
                    <option value="">Selecione o contato...</option>
                    {contacts.map((c: any) => (
                        <option key={c.id} value={c.id}>{c.name}{c.role ? ` — ${c.role}` : ''}</option>
                    ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
        ) : (
            <p className="ds-type-metadata text-warning-readable bg-warning-subtle border border-warning/20 rounded-[var(--radius-panel)] px-4 py-3">
                Nenhum contato cadastrado. <a href="/accounts" className="underline font-[var(--ds-type-control-weight)]">Cadastrar</a>
            </p>
        )
    );

    return (
        <div className="flex h-full min-w-0 flex-col space-y-6 overflow-y-auto p-4 sm:p-6 lg:p-8">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-info-subtle rounded-[var(--radius-panel)]"><Globe className="h-6 w-6 text-primary" /></div>
                <div>
                    <h3 className="ds-type-section-title font-[var(--ds-type-control-weight)] text-foreground">Ecosistema de Parceiros</h3>
                    <p className="ds-type-body text-muted-foreground">Gerencie os fabricantes e distribuidores envolvidos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ── DISTRIBUIÇÃO ─────────────────────────── */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b border-border">
                        <Building2 className="h-5 w-5 text-success-readable" />
                        <h4 className="font-[var(--ds-type-control-weight)] text-success-readable uppercase tracking-widest ds-type-metadata">Distribuição</h4>
                    </div>

                    <div className="bg-card border border-border rounded-[var(--radius-panel)] p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="ds-type-metadata font-[var(--ds-type-control-weight)] text-muted-foreground uppercase tracking-wide">Distribuidor Selecionado</label>
                            <div className="relative">
                                <select
                                    aria-label="Selecionar distribuidor" className="w-full bg-muted/50 border border-border rounded-[var(--radius-panel)] px-4 py-3 ds-type-body text-foreground outline-none appearance-none cursor-pointer hover:bg-muted disabled:opacity-60 disabled:cursor-default pr-8 focus:ring-2 focus:ring-success/20"
                                    value={selectedDistributor}
                                    onChange={e => handleDistributorChange(e.target.value)}
                                    disabled={!isEditing}
                                >
                                    <option value="">Selecione um Distribuidor...</option>
                                    {distributors.map((d: any) => (
                                        <option key={d.id} value={d.id}>{d.name}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                            </div>
                        </div>

                        {selectedDistributor && (
                            <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                                <label className="ds-type-metadata font-[var(--ds-type-control-weight)] text-muted-foreground uppercase tracking-wide">Contato Comercial</label>
                                <ContactSelect
                                    value={selectedDistributorContact}
                                    onChange={handleDistributorContactChange}
                                    contacts={distributorContacts}
                                    disabled={!isEditing}
                                />
                            </div>
                        )}

                        {selectedDistributorObj && (
                            <div className="p-4 rounded-[var(--radius-panel)] bg-success-subtle border border-success/10">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 border border-success/20 rounded-full bg-success-subtle flex items-center justify-center text-success-readable font-[var(--ds-type-control-weight)] overflow-hidden shrink-0">
                                        {selectedDistributorObj.logo_url
                                            ? <img src={selectedDistributorObj.logo_url} alt="" className="w-full h-full object-contain p-1" />
                                            : selectedDistributorObj.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-[var(--ds-type-control-weight)] text-foreground truncate">{selectedDistributorObj.name}</h5>
                                        <p className="ds-type-metadata text-success-readable font-mono mt-0.5">Parceiro Estratégico</p>
                                        {selectedDistributorContact && <ContactCard contactId={selectedDistributorContact} contacts={distributorContacts} />}
                                    </div>
                                </div>
                            </div>
                        )}

                        {!selectedDistributorObj && !isEditing && (
                            <p className="text-center py-4 ds-type-metadata text-muted-foreground italic">Nenhum distribuidor vinculado.</p>
                        )}
                    </div>
                </div>

                {/* ── FABRICANTES ──────────────────────────── */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b border-border">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h4 className="font-[var(--ds-type-control-weight)] text-primary uppercase tracking-widest ds-type-metadata">Fabricantes Identificados</h4>
                    </div>

                    <div className="space-y-4">
                        {dealManufacturers.length > 0 ? dealManufacturers.map((m: any) => {
                            const isVirtual = m.id.startsWith('virtual-');
                            const mfContacts = getManufacturerContacts(m);
                            const isFirst = firstRealManufacturer?.id === m.id;

                            return (
                                <div key={m.id} className="bg-card border border-border rounded-[var(--radius-panel)] p-4 space-y-4 hover:border-primary/30 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-[var(--radius-panel)] bg-muted/50 flex items-center justify-center">
                                                {m.logo_url
                                                    ? <img src={m.logo_url} alt={m.name} className="w-full h-full object-contain p-1" />
                                                    : <span className="font-[var(--ds-type-metric-weight)] text-muted-foreground ds-type-metadata">{m.name.substring(0, 3).toUpperCase()}</span>}
                                            </div>
                                            <div>
                                                <h5 className="font-[var(--ds-type-control-weight)] text-foreground ds-type-body">{m.name}</h5>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="ds-type-metadata bg-primary/10 text-primary px-2 py-0.5 rounded font-[var(--ds-type-control-weight)] uppercase">Vendor</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="p-2 text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /></button>
                                    </div>

                                    {!isVirtual && isFirst && (
                                        <div className="space-y-2 border-t border-border/50 pt-4">
                                            <label className="ds-type-metadata font-[var(--ds-type-control-weight)] text-muted-foreground uppercase tracking-wide">Contato no Fabricante</label>
                                            <ContactSelect
                                                value={selectedManufacturerContact}
                                                onChange={handleManufacturerContactChange}
                                                contacts={mfContacts}
                                                disabled={!isEditing}
                                                ringColor="focus:ring-primary/20"
                                            />
                                            {selectedManufacturerContact && mfContacts.length > 0 && (
                                                <div className="p-3 rounded-[var(--radius-panel)] bg-primary/5 border border-primary/10">
                                                    <ContactCard contactId={selectedManufacturerContact} contacts={mfContacts} />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isVirtual && (
                                        <p className="ds-type-metadata text-muted-foreground border-t border-border/50 pt-3">
                                            Detectado automaticamente. Cadastre como Conta para vincular contatos.
                                        </p>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="text-center p-8 bg-muted/30 rounded-[var(--radius-panel)] border-2 border-dashed border-border">
                                <p className="ds-type-body text-muted-foreground font-[var(--ds-type-label-weight)]">Nenhum fabricante identificado.</p>
                                <p className="ds-type-metadata text-muted-foreground mt-2">Adicione produtos com fabricantes conhecidos (IBM, Lenovo, etc).</p>
                            </div>
                        )}

                        {isEditing && (
                            <button className="w-full py-3 border border-dashed border-border rounded-[var(--radius-panel)] ds-type-metadata font-[var(--ds-type-control-weight)] text-muted-foreground hover:text-foreground transition-all">
                                + Adicionar Fabricante Manualmente
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
