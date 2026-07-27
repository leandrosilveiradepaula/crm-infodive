'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Contact } from '@/types/contact';
import { ContactCard } from '@/components/contacts/ContactCard';
import { ContactsTable } from '@/components/contacts/ContactsTable';
import { ContactFormDrawer } from '@/components/contacts/ContactFormDrawer';
import { ViewContactDrawer } from '@/components/contacts/ViewContactDrawer';
import { deleteContact } from '@/app/(dashboard)/contacts/actions';
import { Plus, Search, Users, UserCheck, Building2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeInput, ThemeSelect } from '@/components/ui/theme/ThemeComponents';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle';
import { PageHeaderActions } from "@/components/layout/PageHeaderActions";
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';
import { FilterBar } from '@/components/layout/FilterBar';
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
    const [viewingContact, setViewingContact] = useState<Contact | null>(null);
    const [isViewOpen, setIsViewOpen] = useState(false);

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

    const handleView = (contact: Contact) => {
        setViewingContact(contact);
        setIsViewOpen(true);
    };

    return (
        <div className="flex-1 space-y-6 pb-10">
            <PageHeaderActions>
                <Button onClick={() => setIsModalOpen(true)} className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Novo Contato
                </Button>
            </PageHeaderActions>
            
            {/* KPI Cards */}
            <StatsGrid items={[
                {
                    label: "Total de Contatos",
                    value: contacts.length,
                    description: "Contatos na base",
                    icon: Users,
                    color: "text-primary",
                    gradient: "from-primary/5 to-white dark:from-primary/10",
                    border: "border-primary/10"
                },
                {
                    label: "Contatos Principais",
                    value: contacts.filter(c => c.is_primary).length,
                    description: "Interlocutores chave",
                    icon: UserCheck,
                    color: "text-teal-600 dark:text-teal-400",
                    gradient: "from-teal-50 to-white dark:from-teal-950/20",
                    border: "border-teal-100 dark:border-teal-900/50"
                },
                {
                    label: "Com Empresa",
                    value: contacts.filter(c => c.account_id).length,
                    description: "Contatos vinculados",
                    icon: Building2,
                    color: "text-emerald-600 dark:text-emerald-400",
                    gradient: "from-emerald-50 to-white dark:from-emerald-950/20",
                    border: "border-emerald-100 dark:border-emerald-900/50"
                },
                {
                    label: "Novos (Mês)",
                    value: contacts.filter(c => {
                        const d = new Date(c.created_at);
                        const now = new Date();
                        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
                    }).length,
                    description: "Adicionados recentemente",
                    icon: Sparkles,
                    color: "text-amber-600 dark:text-amber-400",
                    gradient: "from-amber-50 to-white dark:from-amber-950/20",
                    border: "border-amber-100 dark:border-amber-900/50"
                }
            ]} />

            {/* Filter Bar */}
            <FilterBar>
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <ThemeInput
                        placeholder="Buscar por nome, email ou empresa..."
                        className="pl-11 w-full h-11 bg-muted/30 border-border focus:bg-background transition-all rounded-2xl"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <ThemeSelect
                        value={filterAccount}
                        onChange={e => setFilterAccount(e.target.value)}
                        className="h-11 rounded-2xl bg-muted/30 border-border transition-all"
                    >
                        <option value="all">Empresa: Todas</option>
                        {uniqueAccounts.map(acc => (
                            <option key={acc} value={acc || ''}>{acc}</option>
                        ))}
                    </ThemeSelect>

                    <ThemeSelect
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                        className="h-11 rounded-2xl bg-muted/30 border-border transition-all"
                    >
                        <option value="all">Cargo: Todos</option>
                        {uniqueRoles.map(role => (
                            <option key={role} value={role || ''}>{role}</option>
                        ))}
                    </ThemeSelect>

                    <ViewToggle view={view} onViewChange={setView} />
                </div>
            </FilterBar>

            {view === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                    {filteredContacts.map(contact => (
                        <ContactCard
                            key={contact.id}
                            contact={contact}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onView={handleView}
                        />
                    ))}
                </div>
            ) : (
                <ContactsTable
                    contacts={filteredContacts}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                />
            )}

            <ContactFormDrawer
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                onSuccess={() => router.refresh()}
                contact={selectedContact}
            />

            <ViewContactDrawer
                open={isViewOpen}
                onOpenChange={setIsViewOpen}
                contact={viewingContact}
                onEdit={handleEdit}
            />
        </div>
    );
}
