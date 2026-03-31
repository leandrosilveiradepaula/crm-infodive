'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Contact } from '@/types/contact';
import { ContactCard } from '@/components/contacts/ContactCard';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { ContactFormModal } from '@/components/contacts/ContactFormModal';
import { deleteContact } from '@/app/(dashboard)/contacts/actions';
import { Plus, Search, Users, UserCheck, Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeInput, ThemeSelect } from '@/components/ui/theme/ThemeComponents';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle';
import { PageHeader } from '@/components/layout/PageHeader';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';

interface ContactsClientPageProps {
    initialContacts: Contact[];
}

export function ContactsClientPage({ initialContacts }: ContactsClientPageProps) {
    const router = useRouter();
    const [contacts, setContacts] = useState<Contact[]>(initialContacts);
    const [view, setView] = useState<ViewMode>('cards');

    useEffect(() => {
        setContacts(initialContacts);
    }, [initialContacts]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterAccount, setFilterAccount] = useState('all');
    const [filterRole, setFilterRole] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | undefined>(undefined);

    const uniqueAccounts = Array.from(new Set(contacts.map(c => c.account?.name).filter(Boolean))).sort();
    const uniqueRoles = Array.from(new Set(contacts.map(c => c.role).filter(Boolean))).sort();

    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (contact.account?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAccount = filterAccount === 'all' || contact.account?.name === filterAccount;
        const matchesRole = filterRole === 'all' || contact.role === filterRole;
        return matchesSearch && matchesAccount && matchesRole;
    });

    const handleEdit = (contact: Contact) => {
        setSelectedContact(contact);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja remover este contato?')) {
            await deleteContact(id);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedContact(undefined);
    };

    return (
        <div className="flex-1 space-y-6 pb-10">
            <PageHeader 
                title="Contatos" 
                description="Gerencie todos os contatos da sua base."
            >
                <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 font-bold text-white shadow-lg shadow-primary/20">
                    <Plus className="h-5 w-5 mr-2" />
                    Novo Contato
                </Button>
            </PageHeader>
            
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Total Contacts */}
                <div className="bg-gradient-to-br from-primary/5 to-white dark:from-primary/10 dark:to-card p-4 rounded-2xl border border-primary/10 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-16 opacity-[0.03] transform translate-x-1/2 -translate-y-1/2">
                        <Users className="w-32 h-32 text-primary" />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <h3 className="text-[10px] font-black text-primary/70 uppercase tracking-[0.2em]">Total de Contatos</h3>
                        <div className="p-2.5 bg-primary/10 rounded-xl group-hover:scale-110 transition-transform">
                            <Users className="h-4 w-4 text-primary" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-3xl font-black text-foreground tracking-tighter">{contacts.length}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Contatos na base</p>
                    </div>
                </div>

                {/* Primary Contacts */}
                <div className="bg-gradient-to-br from-teal-50 to-white dark:from-teal-950/20 dark:to-card p-4 rounded-2xl border border-teal-100 dark:border-teal-900/50 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-16 opacity-[0.03] transform translate-x-1/2 -translate-y-1/2">
                        <UserCheck className="w-32 h-32 text-teal-600" />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <h3 className="text-[10px] font-black text-teal-600/70 dark:text-teal-400 uppercase tracking-[0.2em]">Contatos Principais</h3>
                        <div className="p-2.5 bg-teal-100 dark:bg-teal-900/30 rounded-xl group-hover:scale-110 transition-transform">
                            <UserCheck className="h-4 w-4 text-teal-600 dark:text-teal-400" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-3xl font-black text-foreground tracking-tighter">{contacts.filter(c => c.is_primary).length}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Interlocutores chave</p>
                    </div>
                </div>

                {/* Linked Contacts */}
                <div className="bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/20 dark:to-card p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/50 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-16 opacity-[0.03] transform translate-x-1/2 -translate-y-1/2">
                        <Building2 className="w-32 h-32 text-emerald-600" />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <h3 className="text-[10px] font-black text-emerald-600/70 dark:text-emerald-400 uppercase tracking-[0.2em]">Com Empresa</h3>
                        <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl group-hover:scale-110 transition-transform">
                            <Building2 className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-3xl font-black text-foreground tracking-tighter">{contacts.filter(c => c.account_id).length}</p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Contatos vinculados</p>
                    </div>
                </div>

                {/* New Contacts */}
                <div className="bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-card p-4 rounded-2xl border border-amber-100 dark:border-amber-900/50 shadow-sm group hover:shadow-md transition-all relative overflow-hidden">
                    <div className="absolute right-0 top-0 p-16 opacity-[0.03] transform translate-x-1/2 -translate-y-1/2">
                        <Sparkles className="w-32 h-32 text-amber-600" />
                    </div>
                    <div className="flex items-center justify-between mb-4 relative z-10">
                        <h3 className="text-[10px] font-black text-amber-600/70 dark:text-amber-400 uppercase tracking-[0.2em]">Novos (Mês)</h3>
                        <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl group-hover:scale-110 transition-transform">
                            <Sparkles className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        </div>
                    </div>
                    <div className="relative z-10">
                        <p className="text-3xl font-black text-foreground tracking-tighter">
                            {contacts.filter(c => {
                                const d = new Date(c.created_at);
                                const now = new Date();
                                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                            }).length}
                        </p>
                        <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-1">Adicionados recentemente</p>
                    </div>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center bg-card p-2.5 px-4 rounded-2xl border border-border shadow-sm animate-in fade-in duration-500">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <ThemeInput
                        placeholder="Buscar por nome, email ou empresa..."
                        className="pl-11 w-full h-[38px] bg-muted/30 border-border focus:bg-background transition-all rounded-xl"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <ThemeSelect
                        value={filterAccount}
                        onChange={e => setFilterAccount(e.target.value)}
                        className="h-[38px] rounded-xl bg-muted/30 border-border transition-all"
                    >
                        <option value="all">Empresa: Todas</option>
                        {uniqueAccounts.map(acc => (
                            <option key={acc} value={acc || ''}>{acc}</option>
                        ))}
                    </ThemeSelect>

                    <ThemeSelect
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                        className="h-[38px] rounded-xl bg-muted/30 border-border transition-all"
                    >
                        <option value="all">Cargo: Todos</option>
                        {uniqueRoles.map(role => (
                            <option key={role} value={role || ''}>{role}</option>
                        ))}
                    </ThemeSelect>

                    <ViewToggle view={view} onViewChange={setView} />
                </div>
            </div>

            {view === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                    {filteredContacts.map(contact => (
                        <ContactCard
                            key={contact.id}
                            contact={contact}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            ) : (
                <ContactsTable
                    contacts={filteredContacts}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            <ContactFormModal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={() => router.refresh()}
                contact={selectedContact}
            />
        </div>
    );
}
