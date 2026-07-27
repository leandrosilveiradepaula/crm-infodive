'use client';

import { useState, useMemo } from 'react';
import { type Account } from '@/types/account';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { CustomersTable } from '@/components/customers/CustomersTable';
import { Button } from '@/components/ui/button';
import { Plus, Search, Download, Building, Briefcase, MapPin, User, X, FileSpreadsheet } from 'lucide-react';
import { deleteAccount } from '@/app/(dashboard)/customers/actions';
import { useRouter } from 'next/navigation';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle';

import { CustomerFormDrawer } from '@/components/customers/CustomerFormDrawer';
import { ViewAccountDrawer } from '@/components/customers/ViewAccountDrawer';
import { ThemeInput, ThemeSelect } from '@/components/ui/theme/ThemeComponents';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeaderActions } from "@/components/layout/PageHeaderActions";
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';
import { FilterBar } from '@/components/layout/FilterBar';
import { ImportCustomersModal } from '@/components/customers/ImportCustomersModal';

interface CustomersClientPageProps {
    initialAccounts: Account[];
}

export default function CustomersClientPage({ initialAccounts }: CustomersClientPageProps) {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');
    const [segmentFilter, setSegmentFilter] = useState('Todos');
    const [relationshipFilter, setRelationshipFilter] = useState('Todos');
    const [view, setView] = useState<ViewMode>('cards');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<Account | null>(null);
    const [viewingAccount, setViewingAccount] = useState<Account | null>(null);
    const [isViewModalOpen, setIsViewModalOpen] = useState(false);
    const [isImportModalOpen, setIsImportModalOpen] = useState(false);

    // Get unique segments for filter
    const uniqueSegments = useMemo(() => {
        return Array.from(new Set(initialAccounts.map(c => c.segment).filter(Boolean)));
    }, [initialAccounts]);

    // Filtering Logic
    const filteredAccounts = useMemo(() => {
        return initialAccounts.filter(acc => {
            const matchesSearch = searchTerm === '' ||
                acc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                acc.cnpj?.includes(searchTerm) ||
                acc.city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                acc.segment?.toLowerCase().includes(searchTerm.toLowerCase());

            const matchesStatus = statusFilter === 'Todos' || acc.status === statusFilter;
            const matchesSegment = segmentFilter === 'Todos' || acc.segment === segmentFilter;
            const matchesRelationship = relationshipFilter === 'Todos' || (acc.relationship_type || 'Cliente') === relationshipFilter;

            return matchesSearch && matchesStatus && matchesSegment && matchesRelationship;
        });
    }, [initialAccounts, searchTerm, statusFilter, segmentFilter, relationshipFilter]);

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja remover este cliente?')) {
            await deleteAccount(id);
            router.refresh();
        }
    };

    const handleEdit = (customer: Account) => {
        setEditingAccount(customer);
        setIsModalOpen(true);
    };

    const handleView = (customer: Account) => {
        setViewingAccount(customer);
        setIsViewModalOpen(true);
    };

    const handleCreate = () => {
        setEditingAccount(null);
        setIsModalOpen(true);
    };

    const handleExportCSV = () => {
        // Todo implementation
        alert("Exporting CSV...");
    };

    const clearFilters = () => {
        setSearchTerm('');
        setStatusFilter('Todos');
        setSegmentFilter('Todos');
        setRelationshipFilter('Todos');
    };

    // Calculate Top Segment
    const topSegment = useMemo(() => {
        const segments = initialAccounts.map(c => c.segment).filter(Boolean);
        if (segments.length === 0) return 'N/A';
        return segments.sort((a, b) =>
            segments.filter(v => v === a).length - segments.filter(v => v === b).length
        ).pop();
    }, [initialAccounts]);

    // Calculate Top City
    const topCity = useMemo(() => {
        const cities = initialAccounts.map(c => c.city).filter(Boolean);
        if (cities.length === 0) return 'N/A';
        return cities.sort((a, b) =>
            cities.filter(v => v === a).length - cities.filter(v => v === b).length
        ).pop();
    }, [initialAccounts]);

    return (
        <div className="space-y-6 pb-10">
            {/* Header */}
            <PageHeaderActions>
                <div className="flex gap-3">
                    <Button variant="outline" className="text-muted-foreground hover:text-foreground hover:bg-muted h-11 rounded-md" onClick={() => setIsImportModalOpen(true)}>
                        <FileSpreadsheet className="h-4 w-4 mr-2" />
                        Importar Planilha
                    </Button>
                    <Button variant="outline" className="text-muted-foreground hover:text-foreground hover:bg-muted h-11 rounded-md" onClick={handleExportCSV}>
                        <Download className="h-4 w-4 mr-2" />
                        Exportar CSV
                    </Button>
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 rounded-md shadow-xl shadow-primary/20 transition-all flex items-center gap-2" onClick={handleCreate}>
                        <Plus className="h-5 w-5" />
                        Novo Cadastro
                    </Button>
                </div>
            </PageHeaderActions>

            {/* KPIs Dashboard */}
            <StatsGrid items={[
                {
                    label: "Empresas Ativas",
                    value: initialAccounts.filter(c => c.status === 'Ativo').length,
                    description: `de ${initialAccounts.length} total`,
                    icon: Building,
                    color: "text-primary",
                    gradient: "from-primary/5 to-white dark:from-primary/10",
                    border: "border-primary/10"
                },
                {
                    label: "Segmento Principal",
                    value: topSegment || 'N/A',
                    description: `${uniqueSegments.length} segmentos`,
                    icon: Briefcase,
                    color: "text-teal-600 dark:text-teal-400",
                    gradient: "from-teal-50 to-white dark:from-teal-950/20",
                    border: "border-teal-100 dark:border-teal-900/50"
                },
                {
                    label: "Cidade Principal",
                    value: topCity || 'N/A',
                    description: `${Array.from(new Set(initialAccounts.map(c => c.city).filter(Boolean))).length} cidades`,
                    icon: MapPin,
                    color: "text-emerald-600 dark:text-emerald-400",
                    gradient: "from-emerald-50 to-white dark:from-emerald-950/20",
                    border: "border-emerald-100 dark:border-emerald-900/50"
                },
                {
                    label: "Total de Contatos",
                    value: initialAccounts.reduce((sum, c) => sum + (c.contacts?.length || 0), 0),
                    description: `Média ${(initialAccounts.length > 0 ? (initialAccounts.reduce((sum, c) => sum + (c.contacts?.length || 0), 0) / initialAccounts.length).toFixed(1) : 0)} por empresa`,
                    icon: User,
                    color: "text-amber-600 dark:text-amber-400",
                    gradient: "from-amber-50 to-white dark:from-amber-950/20",
                    border: "border-amber-100 dark:border-amber-900/50"
                }
            ]} />

            {/* Filters */}
            <FilterBar>
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <ThemeInput
                        placeholder="Buscar por nome, cidade ou segmento..."
                        className="pl-11 w-full h-11 bg-muted/30 border-border focus:bg-background transition-all rounded-md"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 px-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-[140px] text-muted-foreground hover:text-foreground font-bold h-11 rounded-md text-xs bg-muted/30 border-border hover:bg-muted/50 transition-colors">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem value="Todos">Status: Todos</SelectItem>
                            <SelectItem value="Ativo">Ativo</SelectItem>
                            <SelectItem value="Inativo">Inativo</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select value={segmentFilter} onValueChange={setSegmentFilter}>
                        <SelectTrigger className="w-[160px] text-muted-foreground hover:text-foreground font-bold h-11 rounded-md text-xs bg-muted/30 border-border hover:bg-muted/50 transition-colors">
                            <SelectValue placeholder="Segmento" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem value="Todos">Segmento: Todos</SelectItem>
                            {uniqueSegments.map(seg => (
                                <SelectItem key={seg} value={seg}>{seg}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    <Select value={relationshipFilter} onValueChange={setRelationshipFilter}>
                        <SelectTrigger className="w-[180px] text-muted-foreground hover:text-foreground font-bold h-11 rounded-md text-xs bg-muted/30 border-border hover:bg-muted/50 transition-colors">
                            <SelectValue placeholder="Relacionamento" />
                        </SelectTrigger>
                        <SelectContent className="bg-popover border-border text-popover-foreground">
                            <SelectItem value="Todos">Relacionamento: Todos</SelectItem>
                            <SelectItem value="Cliente">Cliente</SelectItem>
                            <SelectItem value="Fabricante">Fabricante</SelectItem>
                            <SelectItem value="Distribuidor">Distribuidor</SelectItem>
                            <SelectItem value="Parceiro">Parceiro</SelectItem>
                            <SelectItem value="Outro">Outro</SelectItem>
                        </SelectContent>
                    </Select>

                    {(searchTerm || statusFilter !== 'Todos' || segmentFilter !== 'Todos' || relationshipFilter !== 'Todos') && (
                        <Button variant="ghost" size="icon" onClick={clearFilters} className="text-muted-foreground hover:text-red-500 hover:bg-red-500/10 h-10 w-10 rounded-md transition-colors">
                            <X className="h-5 w-5" />
                        </Button>
                    )}
                    <ViewToggle view={view} onViewChange={setView} />
                </div>
            </FilterBar>

            {/* Grid / Table */}
            {view === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                    {filteredAccounts.map(account => (
                        <CustomerCard
                            key={account.id}
                            customer={account}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onView={handleView}
                        />
                    ))}
                </div>
            ) : (
                <CustomersTable
                    accounts={filteredAccounts}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onView={handleView}
                />
            )}

            {filteredAccounts.length === 0 && (
                <div className="text-center py-20 bg-muted/10 border-2 border-dashed border-border rounded-md">
                    <p className="text-muted-foreground font-medium">Nenhuma empresa encontrada com os filtros atuais.</p>
                    <Button variant="link" onClick={clearFilters} className="text-primary mt-2">Limpar Filtros</Button>
                </div>
            )}

            <CustomerFormDrawer
                open={isModalOpen}
                onOpenChange={setIsModalOpen}
                customer={editingAccount}
            />

            <ViewAccountDrawer
                open={isViewModalOpen}
                onOpenChange={setIsViewModalOpen}
                account={viewingAccount}
                onEdit={handleEdit}
            />

            <ImportCustomersModal
                isOpen={isImportModalOpen}
                onClose={() => setIsImportModalOpen(false)}
            />
        </div>
    );
}
