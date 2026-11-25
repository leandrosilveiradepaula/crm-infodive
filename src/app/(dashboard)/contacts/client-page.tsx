'use client';

import { useState } from 'react';
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
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';
import { FilterBar } from '@/components/layout/FilterBar';
import { DirectoryResults } from '@/components/layout/DirectoryResults';
import { toast } from 'sonner';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';

interface ContactsClientPageProps {
    initialContacts: Contact[];
}

export function ContactsClientPage({ initialContacts }: ContactsClientPageProps) {
    const router = useRouter();
    const contacts = initialContacts;
    const [view, setView] = useState<ViewMode>('cards');

    const [searchTerm, setSearchTerm] = useState('');
    const [filterAccount, setFilterAccount] = useState('all');
    const [filterRole, setFilterRole] = useState('all');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contact | undefined>(undefined);

    const uniqueAccounts = Array.from(new Set(contacts.map(c => c.account?.name).filter(Boolean))).sort();
    const uniqueRoles = Array.from(new Set(contacts.map(c => c.role).filter(Boolean))).sort();

    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (contact.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (contact.account?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAccount = filterAccount === 'all' || contact.account?.name === filterAccount;
        const matchesRole = filterRole === 'all' || contact.role === filterRole;
        return matchesSearch && matchesAccount && matchesRole;
    });

    const clearFilters = () => { setSearchTerm(''); setFilterAccount('all'); setFilterRole('all'); };

    const handleEdit = (contact: Contact) => {
        setSelectedContact(contact);
        setIsModalOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja remover este contato?')) {
            try {
                const result = await deleteContact(id);
                if (!result.success) throw new Error('Exclusão não confirmada');
                router.refresh();
            } catch {
                toast.error('Não foi possível excluir o contato.');
            }
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedContact(undefined);
    };

    const hasFilters = searchTerm !== '' || filterAccount !== 'all' || filterRole !== 'all';

    return (
        <div className="flex-1 space-y-6 pb-10">
            <PageHeader
                title="Contatos"
                description="Gerencie todos os contatos da sua base."
            >
                <Button onClick={() => setIsModalOpen(true)} size="lg">
                    <Plus />
                    Novo Contato
                </Button>
            </PageHeader>

            {/* KPI Cards */}
            <StatsGrid density="directory" items={[
                {
                    label: "Total de Contatos",
                    value: contacts.length,
                    description: "Contatos na base",
                    icon: Users,
                    tone: 'primary',
                },
                {
                    label: "Contatos Principais",
                    value: contacts.filter(c => c.is_primary).length,
                    description: "Interlocutores chave",
                    icon: UserCheck,
                    tone: 'info',
                },
                {
                    label: "Com Empresa",
                    value: contacts.filter(c => c.account_id).length,
                    description: "Contatos vinculados",
                    icon: Building2,
                    tone: 'success',
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
                    tone: 'warning',
                }
            ]} />

            {/* Filter Bar */}
            <FilterBar>
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <ThemeInput
                        aria-label="Buscar contatos"
                        placeholder="Buscar por nome, email ou empresa..."
                        className="h-10 w-full pl-11"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex w-full min-w-0 flex-wrap items-center gap-2 md:w-auto">
                    <ThemeSelect
                        aria-label="Filtrar contatos por empresa"
                        value={filterAccount}
                        onChange={e => setFilterAccount(e.target.value)}
                        className="h-10 min-w-0 flex-1 basis-[8rem] md:w-auto md:flex-none"
                    >
                        <option value="all">Empresa: Todas</option>
                        {uniqueAccounts.map(acc => (
                            <option key={acc} value={acc || ''}>{acc}</option>
                        ))}
                    </ThemeSelect>

                    <ThemeSelect
                        aria-label="Filtrar contatos por cargo"
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                        className="h-10 min-w-0 flex-1 basis-[8rem] md:w-auto md:flex-none"
                    >
                        <option value="all">Cargo: Todos</option>
                        {uniqueRoles.map(role => (
                            <option key={role} value={role || ''}>{role}</option>
                        ))}
                    </ThemeSelect>

                    <ViewToggle view={view} onViewChange={setView} />
                </div>
            </FilterBar>

            <DirectoryResults shown={filteredContacts.length} total={contacts.length} hasFilters={hasFilters} onReset={clearFilters} resetLabel="Limpar filtros de contatos" />

            {filteredContacts.length > 0 && (view === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
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
            ))}

            {filteredContacts.length === 0 && (
                <PremiumEmptyState
                    icon={Users}
                    title="Nenhum contato encontrado"
                    description={contacts.length === 0 ? 'Cadastre o primeiro contato para organizar sua base.' : 'Ajuste os filtros para localizar outros contatos.'}
                    actionLabel={contacts.length === 0 ? 'Novo contato' : undefined}
                    onAction={contacts.length === 0 ? () => setIsModalOpen(true) : undefined}
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
