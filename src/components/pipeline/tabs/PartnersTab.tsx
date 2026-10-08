
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
                <div className="flex items-center gap-2 text-xs">
                    <User className="h-3 w-3 shrink-0 text-muted-foreground" />
                    <span className="font-semibold text-foreground">{c.name}</span>
                    {c.role && <span className="text-muted-foreground">· {c.role}</span>}
                </div>
                {c.email && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Mail className="h-3 w-3 shrink-0" /><span className="truncate">{c.email}</span></div>}
                {(c.mobile_phone || c.landline_phone) && <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone className="h-3 w-3 shrink-0" />{c.mobile_phone || c.landline_phone}</div>}
            </div>
        );
    };

    const ContactSelect = ({ value, onChange, contacts, disabled, ringColor = 'focus:ring-emerald-500/20' }: any) => (
        contacts.length > 0 ? (
            <div className="relative">
                <select
                    className={`w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none appearance-none cursor-pointer hover:bg-muted disabled:opacity-50 pr-8 focus:ring-2 ${ringColor}`}
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
            <p className="text-xs text-amber-600 bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
                Nenhum contato cadastrado. <a href="/accounts" className="underline font-bold">Cadastrar</a>
            </p>
        )
    );

    return (
        <div className="h-full flex flex-col p-8 space-y-8 overflow-y-auto">
            <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg"><Globe className="h-6 w-6 text-blue-400" /></div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Ecosistema de Parceiros</h3>
                    <p className="text-sm text-muted-foreground">Gerencie os fabricantes e distribuidores envolvidos.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ── DISTRIBUIÇÃO ─────────────────────────── */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b border-border">
                        <Building2 className="h-5 w-5 text-emerald-400" />
                        <h4 className="font-bold text-emerald-400 uppercase tracking-widest text-xs">Distribuição</h4>
                    </div>

                    <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Distribuidor Selecionado</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-muted/50 border border-border rounded-xl px-4 py-3 text-sm text-foreground outline-none appearance-none cursor-pointer hover:bg-muted disabled:opacity-60 disabled:cursor-default pr-8 focus:ring-2 focus:ring-emerald-500/20"
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
                                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Contato Comercial</label>
                                <ContactSelect
                                    value={selectedDistributorContact}
                                    onChange={handleDistributorContactChange}
                                    contacts={distributorContacts}
                                    disabled={!isEditing}
                                />
                            </div>
                        )}

                        {selectedDistributorObj && (
                            <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/10">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 border border-emerald-500/20 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold overflow-hidden shrink-0">
                                        {selectedDistributorObj.logo_url
                                            ? <img src={selectedDistributorObj.logo_url} alt="" className="w-full h-full object-contain p-1" />
                                            : selectedDistributorObj.name?.substring(0, 2).toUpperCase()}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h5 className="font-bold text-foreground truncate">{selectedDistributorObj.name}</h5>
                                        <p className="text-xs text-emerald-400 font-mono mt-0.5">Parceiro Estratégico</p>
                                        {selectedDistributorContact && <ContactCard contactId={selectedDistributorContact} contacts={distributorContacts} />}
                                    </div>
                                </div>
                            </div>
                        )}

                        {!selectedDistributorObj && !isEditing && (
                            <p className="text-center py-4 text-xs text-muted-foreground italic">Nenhum distribuidor vinculado.</p>
                        )}
                    </div>
                </div>

                {/* ── FABRICANTES ──────────────────────────── */}
                <div className="space-y-6">
                    <div className="flex items-center gap-2 pb-4 border-b border-border">
                        <Building2 className="h-5 w-5 text-primary" />
                        <h4 className="font-bold text-primary uppercase tracking-widest text-xs">Fabricantes Identificados</h4>
                    </div>

                    <div className="space-y-4">
                        {dealManufacturers.length > 0 ? dealManufacturers.map((m: any) => {
                            const isVirtual = m.id.startsWith('virtual-');
                            const mfContacts = getManufacturerContacts(m);
                            const isFirst = firstRealManufacturer?.id === m.id;

                            return (
                                <div key={m.id} className="bg-card border border-border rounded-2xl p-4 space-y-4 hover:border-primary/30 transition-all">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-12 w-12 rounded-xl bg-muted/50 flex items-center justify-center">
                                                {m.logo_url
                                                    ? <img src={m.logo_url} alt={m.name} className="w-full h-full object-contain p-1" />
                                                    : <span className="font-black text-muted-foreground text-xs">{m.name.substring(0, 3).toUpperCase()}</span>}
                                            </div>
                                            <div>
                                                <h5 className="font-bold text-foreground text-sm">{m.name}</h5>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded font-bold uppercase">Vendor</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button className="p-2 text-muted-foreground hover:text-foreground"><ExternalLink className="h-4 w-4" /></button>
                                    </div>

                                    {!isVirtual && isFirst && (
                                        <div className="space-y-2 border-t border-border/50 pt-4">
                                            <label className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Contato no Fabricante</label>
                                            <ContactSelect
                                                value={selectedManufacturerContact}
                                                onChange={handleManufacturerContactChange}
                                                contacts={mfContacts}
                                                disabled={!isEditing}
                                                ringColor="focus:ring-primary/20"
                                            />
                                            {selectedManufacturerContact && mfContacts.length > 0 && (
                                                <div className="p-3 rounded-xl bg-primary/5 border border-primary/10">
                                                    <ContactCard contactId={selectedManufacturerContact} contacts={mfContacts} />
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {isVirtual && (
                                        <p className="text-xs text-muted-foreground border-t border-border/50 pt-3">
                                            Detectado automaticamente. Cadastre como Conta para vincular contatos.
                                        </p>
                                    )}
                                </div>
                            );
                        }) : (
                            <div className="text-center p-8 bg-muted/30 rounded-2xl border-2 border-dashed border-border">
                                <p className="text-sm text-muted-foreground font-medium">Nenhum fabricante identificado.</p>
                                <p className="text-xs text-muted-foreground mt-2">Adicione produtos com fabricantes conhecidos (IBM, Lenovo, etc).</p>
                            </div>
                        )}

                        {isEditing && (
                            <button className="w-full py-3 border border-dashed border-border rounded-xl text-xs font-bold text-muted-foreground hover:text-foreground transition-all">
                                + Adicionar Fabricante Manualmente
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};
