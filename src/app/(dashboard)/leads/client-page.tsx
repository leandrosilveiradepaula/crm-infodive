'use client';

import { useState } from 'react';
import { Lead } from '@/types/lead';
import { LeadCard } from '@/components/leads/LeadCard';
import { LeadsTable } from '@/components/leads/LeadsTable';
import { LeadFormDrawer } from '@/components/leads/LeadFormDrawer';
import { LeadConversionModal } from '@/components/leads/LeadConversionModal';
import { LeadEnrichmentModal } from '@/components/leads/LeadEnrichmentModal';
import { deleteLead } from '@/app/(dashboard)/leads/actions';
import { Plus, Search, Users, Target, TrendingUp, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeInput, ThemeSelect } from '@/components/ui/theme/ThemeComponents';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle';
import { PageHeaderActions } from "@/components/layout/PageHeaderActions";
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';
import { FilterBar } from '@/components/layout/FilterBar';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';

interface LeadsClientPageProps {
    initialLeads: Lead[];
}

export function LeadsClientPage({ initialLeads }: LeadsClientPageProps) {
    const [leads] = useState<Lead[]>(initialLeads);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [filterInterest, setFilterInterest] = useState('all');
    const [view, setView] = useState<ViewMode>('cards');

    // Modal States
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isConversionOpen, setIsConversionOpen] = useState(false);
    const [isEnrichOpen, setIsEnrichOpen] = useState(false);
    const [selectedLead, setSelectedLead] = useState<Lead | undefined>(undefined);

    // Advanced Metrics
    const topInterest = Object.entries(
        leads.reduce((acc, l) => {
            if (l.interest) acc[l.interest] = (acc[l.interest] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    const topCity = Object.entries(
        leads.reduce((acc, l) => {
            if (l.city) acc[l.city] = (acc[l.city] || 0) + 1;
            return acc;
        }, {} as Record<string, number>)
    ).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';

    // Unique Interests for filter
    const uniqueInterests = Array.from(new Set(leads.map(l => l.interest).filter(Boolean))).sort();

    const filteredLeads = leads.filter(lead => {
        const matchesSearch = (lead.contact_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.email || '').toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || lead.status === filterStatus;
        const matchesInterest = filterInterest === 'all' || lead.interest === filterInterest;
        return matchesSearch && matchesStatus && matchesInterest;
    });

    const handleEdit = (lead: Lead) => {
        setSelectedLead(lead);
        setIsFormOpen(true);
    };

    const handleConvert = (lead: Lead) => {
        setSelectedLead(lead);
        setIsConversionOpen(true);
    };

    const handleEnrich = (lead: Lead) => {
        setSelectedLead(lead);
        setIsEnrichOpen(true);
    };

    const onEnrichSubmit = (data: any) => {
        // Here you would typically update the lead in the backend using the enriched data
        console.log('Enriched Data:', data);
        // For visual feedback, we could assume we updated it locally
    };

    const handleDelete = async (lead: Lead) => {
        if (confirm(`Tem certeza que deseja apagar o lead "${lead.contact_name}"?`)) {
            await deleteLead(lead.id);
        }
    };

    const handleCloseForm = () => {
        setIsFormOpen(false);
        setSelectedLead(undefined);
    };

    const handleCloseConversion = () => {
        setIsConversionOpen(false);
        setSelectedLead(undefined);
    };

    const handleCloseEnrich = () => {
        setIsEnrichOpen(false);
        setSelectedLead(undefined);
    };

    const stats: StatItem[] = [
        {
            label: "Total de Leads",
            value: leads.length,
            description: "Base completa",
            icon: Users,
            color: "text-primary",
            gradient: "from-primary/5 to-white dark:from-primary/10",
            border: "border-primary/10"
        },
        {
            label: "Interesse Principal",
            value: topInterest,
            description: "Maior volume",
            icon: Target,
            color: "text-emerald-600 dark:text-emerald-400",
            gradient: "from-emerald-50 to-white dark:from-emerald-950/20",
            border: "border-emerald-100 dark:border-emerald-900/50"
        },
        {
            label: "Cidade Principal",
            value: topCity,
            description: "Localização chave",
            icon: TrendingUp,
            color: "text-teal-600 dark:text-teal-400",
            gradient: "from-teal-50 to-white dark:from-teal-950/20",
            border: "border-teal-100 dark:border-teal-900/50"
        },
        {
            label: "Novos (Mês)",
            value: leads.filter(l => {
                const d = new Date(l.created_at);
                const now = new Date();
                return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            }).length,
            description: "Aquisição recente",
            icon: Zap,
            color: "text-primary dark:text-blue-400",
            gradient: "from-blue-50 to-white dark:from-blue-950/20",
            border: "border-blue-100 dark:border-blue-900/50"
        }
    ];

    return (
        <div className="flex-1 space-y-8 pb-10">
            <PageHeaderActions>
                <Button onClick={() => setIsFormOpen(true)} className="bg-primary hover:bg-primary/90 text-white font-bold h-11 px-6 rounded-2xl shadow-xl shadow-primary/20 transition-all flex items-center gap-2">
                    <Plus className="h-5 w-5" />
                    Novo Lead
                </Button>
            </PageHeaderActions>
            
            <StatsGrid items={stats} />

            <FilterBar>
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <ThemeInput
                        placeholder="Buscar leads por nome, empresa ou email..."
                        className="pl-11 w-full h-11 bg-muted/30 border-border focus:bg-background transition-all rounded-2xl"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 w-full md:w-auto">
                    <ThemeSelect
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="h-11 rounded-2xl bg-muted/30 border-border transition-all"
                    >
                        <option value="all">Status: Todos</option>
                        <option value="Novo">Novo</option>
                        <option value="Em Contato">Em Contato</option>
                        <option value="Qualificado">Qualificado</option>
                        <option value="Desqualificado">Desqualificado</option>
                        <option value="Convertido">Convertido</option>
                    </ThemeSelect>

                    <ThemeSelect
                        value={filterInterest}
                        onChange={e => setFilterInterest(e.target.value)}
                        className="h-11 rounded-2xl bg-muted/30 border-border transition-all"
                    >
                        <option value="all">Interesse: Todos</option>
                        {uniqueInterests.map(interest => (
                            <option key={interest} value={interest || ''}>{interest}</option>
                        ))}
                    </ThemeSelect>

                    <ViewToggle view={view} onViewChange={setView} />
                </div>
            </FilterBar>

            {view === 'cards' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-20">
                    {filteredLeads.map(lead => (
                        <LeadCard
                            key={lead.id}
                            lead={lead}
                            onEdit={handleEdit}
                            onDelete={handleDelete}
                            onConvert={handleConvert}
                            onEnrich={handleEnrich}
                        />
                    ))}
                </div>
            ) : (
                <LeadsTable
                    leads={filteredLeads}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                    onConvert={handleConvert}
                />
            )}

            <LeadFormDrawer
                isOpen={isFormOpen}
                onClose={handleCloseForm}
                lead={selectedLead}
            />

            {selectedLead && (
                <LeadConversionModal
                    isOpen={isConversionOpen}
                    onClose={handleCloseConversion}
                    lead={selectedLead}
                />
            )}

            {selectedLead && (
                <LeadEnrichmentModal
                    isOpen={isEnrichOpen}
                    onClose={handleCloseEnrich}
                    onEnrich={onEnrichSubmit}
                    initialCompany={selectedLead.company}
                    initialWebsite={''} // Add website if avail on lead
                />
            )}
        </div>
    );
}
