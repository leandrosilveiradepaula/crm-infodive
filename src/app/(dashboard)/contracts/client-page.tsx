'use client';

import { useRef, useState } from 'react';
import {
    FileText, Plus, Search,
    AlertTriangle, Clock, Eye, Pencil, Download, TrendingUp
} from 'lucide-react';
import { type Contract } from '@/types/contract';
import { createContract, getContractCreationDeals } from '@/app/(dashboard)/contracts/actions';
import { ContractViewer } from '@/components/contracts/ContractViewer';
import { ContractDraftEditor } from '@/components/contracts/ContractDraftEditor';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeInput, ThemeSelect } from '@/components/ui/theme/ThemeComponents';
import { PageHeader } from '@/components/layout/PageHeader';
import { StatsGrid, type StatItem } from '@/components/layout/StatsGrid';
import { FilterBar } from '@/components/layout/FilterBar';
import { PremiumEmptyState } from '@/components/ui/PremiumEmptyState';

interface ContractsClientPageProps {
    initialContracts: Contract[];
}

export function ContractsClientPage({ initialContracts }: ContractsClientPageProps) {
    const router = useRouter();
    const contracts = initialContracts;
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');

    // Modal States
    const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
    const [isViewerOpen, setIsViewerOpen] = useState(false);
    const [editingDraft, setEditingDraft] = useState<Contract | null>(null);
    const [saveFeedback, setSaveFeedback] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);
    const creatingLock = useRef(false);
    const [creationOptions, setCreationOptions] = useState<{requiresDeal: boolean;deals: {id: string;title: string;company: string}[]} | null>(null);
    const [chosenDeal, setChosenDeal] = useState('');
    const [draftTitle, setDraftTitle] = useState('');
    const [draftCompany, setDraftCompany] = useState('');
    const [creationError, setCreationError] = useState<string | null>(null);

    const filteredContracts = contracts.filter(contract => {
        const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contract.company.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = filterStatus === 'all' || contract.status === filterStatus;
        return matchesSearch && matchesStatus;
    });

    const resetCreationForm = () => {
        setCreationOptions(null);
        setChosenDeal('');
        setDraftTitle('');
        setDraftCompany('');
        setCreationError(null);
    };

    const formatCreatedDate = (value: string) => {
        const timestamp = Date.parse(value);
        return Number.isFinite(timestamp)
            ? new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(timestamp))
            : 'Data não disponível';
    };

    const getContractTypeLabel = (value: Contract['type']) => {
        switch (value) {
            case 'service': return 'Prestação de serviços';
            case 'nda': return 'Confidencialidade';
            case 'sales': return 'Vendas';
        }
    };

    const handleCreateContract = async () => {
        if (creatingLock.current) return;
        creatingLock.current = true;
        if (creationOptions === null) {
            setIsCreating(true);
            setCreationError(null);
            setSaveFeedback(null);
            try {
                const options = await getContractCreationDeals();
                setCreationOptions(options);
            } catch {
                setCreationError('Não foi possível consultar as oportunidades autorizadas.');
            } finally {
                setIsCreating(false);
                creatingLock.current = false;
            }
            return;
        }
        const selected = creationOptions.deals.find(item => item.id === chosenDeal);
        if (creationOptions.requiresDeal && !selected) {
            setCreationError('Selecione uma oportunidade para este contrato.');
            creatingLock.current = false;
            return;
        }
        if ((!selected || !selected.company.trim()) && !draftCompany.trim()) {
            setCreationError('Informe a empresa contratante.');
            creatingLock.current = false;
            return;
        }
        setIsCreating(true);
        setCreationError(null);
        try {
            const res = await createContract({
                title: draftTitle.trim() || 'Novo Contrato (Rascunho)',
                company: selected?.company || draftCompany.trim(),
                dealId: selected?.id,
                value: 0,
                status: 'draft',
                type: 'service'
            });
            if (!res.success) throw new Error('Persistência recusada');
            resetCreationForm();
            setSaveFeedback('Rascunho criado e salvo. A listagem será atualizada.');
            router.refresh();
        } catch {
            setCreationError('Não foi possível salvar o contrato. Confira os dados e tente novamente.');
        } finally {
            setIsCreating(false);
            creatingLock.current = false;
        }
    };

    const handleViewContract = (contract: Contract) => {
        setSelectedContract(contract);
        setIsViewerOpen(true);
    };

    const handleEditDraft = (contract: Contract) => {
        if (contract.status !== 'draft') return;
        setIsViewerOpen(false);
        setSaveFeedback(null);
        setEditingDraft(contract);
    };

    const handleDraftSaved = () => {
        setEditingDraft(null);
        setSaveFeedback('Rascunho salvo. A listagem será atualizada.');
        router.refresh();
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'draft': return 'bg-muted/30 text-muted-foreground border-border/50';
            case 'sent':
            case 'viewed':
            case 'signed': return 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20';
            case 'declined': return 'bg-destructive/10 text-destructive border-destructive/20';
            default: return 'bg-muted/30 text-muted-foreground';
        }
    };

    const getStatusLabel = (status: string) => {
        switch (status) {
            case 'draft': return 'Rascunho';
            case 'sent': return 'Enviado (não verificado)';
            case 'viewed': return 'Visualizado (não verificado)';
            case 'signed': return 'Assinado (não verificado)';
            case 'declined': return 'Declinado';
            default: return status;
        }
    };

    return (
        <div className="flex-1 space-y-6 pb-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <PageHeader 
                title="Gestão de Contratos" 
                description="Consulte contratos cadastrados e organize rascunhos. Assinatura eletrônica ainda indisponível."
            >
                <Button
                    onClick={handleCreateContract}
                    aria-busy={isCreating}
                    disabled={isCreating || (creationOptions !== null && creationOptions.requiresDeal && creationOptions.deals.length === 0)}
                    className="bg-primary hover:bg-primary/90 font-bold text-white h-11 px-6 rounded-2xl shadow-xl shadow-primary/20 flex items-center gap-2"
                >
                    <Plus className="h-4 w-4" />
                    {isCreating ? 'Processando...' : creationOptions === null ? 'Novo Contrato' : 'Salvar Rascunho'}
                </Button>
            </PageHeader>

            {creationOptions !== null && (
                <div className="rounded-2xl border border-border bg-card p-4 space-y-3" role="region" aria-label="Novo contrato">
                    <h2 className="font-semibold">Dados do novo contrato</h2>
                    <input aria-label="Título do contrato" className="w-full rounded-lg border border-border bg-background p-2"
                        value={draftTitle} onChange={event => setDraftTitle(event.target.value)} placeholder="Título (opcional)" />
                    {creationOptions.requiresDeal && creationOptions.deals.length === 0 && (
                        <p role="alert" className="text-sm text-destructive">Não existem oportunidades autorizadas para vincular ao contrato.</p>
                    )}
                    {creationOptions.requiresDeal ? (
                        <select aria-label="Oportunidade vinculada" className="w-full rounded-lg border border-border bg-background p-2"
                            value={chosenDeal} onChange={event => setChosenDeal(event.target.value)}>
                            <option value="">Selecione uma oportunidade autorizada</option>
                            {creationOptions.deals.map(item => <option key={item.id} value={item.id}>{item.title} — {item.company || 'Empresa não informada'}</option>)}
                        </select>
                    ) : (
                        <input aria-label="Empresa contratante" className="w-full rounded-lg border border-border bg-background p-2"
                            value={draftCompany} onChange={event => setDraftCompany(event.target.value)} placeholder="Empresa contratante" />
                    )}
                    {creationOptions.requiresDeal && creationOptions.deals.some(item => item.id === chosenDeal && !item.company.trim()) && (
                        <input aria-label="Empresa contratante" className="w-full rounded-lg border border-border bg-background p-2"
                            value={draftCompany} onChange={event => setDraftCompany(event.target.value)} placeholder="Empresa contratante obrigatória" />
                    )}
                    <button type="button" disabled={isCreating} className="text-sm underline disabled:opacity-50"
                        onClick={resetCreationForm}>Cancelar</button>
                </div>
            )}
            {creationError && <p role="alert" className="text-sm text-destructive">{creationError}</p>}
            {saveFeedback && <p role="status" className="text-sm text-success">{saveFeedback}</p>}
            {/* KPI Cards */}
            <StatsGrid items={[
                {
                    label: "Total de Contratos",
                    value: contracts.length,
                    description: "Registros cadastrados",
                    icon: FileText,
                    color: "text-primary",
                    gradient: "from-primary/5 to-white dark:from-primary/10",
                    border: "border-primary/10"
                },
                {
                    label: "Marcados como enviados",
                    value: contracts.filter(c => ['sent', 'viewed'].includes(c.status)).length,
                    description: "Status legado, sem confirmação de envio",
                    icon: Clock,
                    color: "text-amber-600 dark:text-amber-400",
                    gradient: "from-amber-50 to-white dark:from-amber-950/20",
                    border: "border-amber-100 dark:border-amber-900/50"
                },
                {
                    label: "Marcados como assinados",
                    value: contracts.filter(c => c.status === 'signed').length,
                    description: "Sem evidência verificada de assinatura",
                    icon: AlertTriangle,
                    color: "text-amber-600 dark:text-amber-400",
                    gradient: "from-amber-50 to-white dark:from-amber-950/20",
                    border: "border-amber-100 dark:border-amber-900/50"
                },
                {
                    label: "Valor Total",
                    value: new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(
                        contracts.reduce((acc, c) => acc + (c.value || 0), 0)
                    ),
                    description: "Soma dos valores cadastrados",
                    icon: TrendingUp,
                    color: "text-blue-600 dark:text-blue-400",
                    gradient: "from-blue-50 to-white dark:from-blue-950/20",
                    border: "border-blue-100 dark:border-blue-900/50"
                }
            ]} />

            {/* Filter Bar */}
            <FilterBar>
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <ThemeInput
                        placeholder="Buscar contratos por título ou empresa..."
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
                        <option value="all" className="bg-popover text-popover-foreground">Status: Todos</option>
                        <option value="draft" className="bg-popover text-popover-foreground">Rascunho</option>
                        <option value="sent" className="bg-popover text-popover-foreground">Enviado</option>
                        <option value="viewed" className="bg-popover text-popover-foreground">Visualizado</option>
                        <option value="signed" className="bg-popover text-popover-foreground">Assinado (não verificado)</option>
                    </ThemeSelect>
                </div>
            </FilterBar>

            {/* Contracts List */}
            <div className="bg-card rounded-3xl shadow-xl border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Documento</th>
                                <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Cliente</th>
                                <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Valor</th>
                                <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Status</th>
                                <th className="text-left py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Data</th>
                                <th className="text-right py-3 px-4 text-xs font-black text-muted-foreground uppercase tracking-[0.2em]">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredContracts.map(contract => (
                                <tr key={contract.id} aria-label={`Contrato: ${contract.title}, ${contract.company}`} className="transition-all duration-300 group hover:bg-muted/50 border-l-2 border-l-transparent hover:border-l-primary">
                                    <td className="py-3 px-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all">
                                                <FileText className="h-4 w-4" />
                                            </div>
                                            <div>
                                                <button type="button" className="text-left text-sm font-black text-foreground group-hover:text-primary hover:underline focus-visible:underline transition-colors tracking-tight"
                                                    aria-label={`Visualizar contrato: ${contract.title}`}
                                                    onClick={() => handleViewContract(contract)}>{contract.title}</button>
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider mt-0.5">{getContractTypeLabel(contract.type)}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-sm font-bold text-muted-foreground">{contract.company}</span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className="text-sm font-black text-foreground tracking-tight">
                                            {contract.value > 0
                                                ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.value)
                                                : '-'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-0.5 rounded text-xs font-black border ${getStatusColor(contract.status)} uppercase tracking-widest flex items-center w-fit gap-1.5`}>
                                            {contract.status === 'signed' && <AlertTriangle className="h-3 w-3" aria-hidden="true" />}
                                            {contract.status === 'sent' && <Clock className="h-3 w-3" />}
                                            {getStatusLabel(contract.status)}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-foreground">{formatCreatedDate(contract.createdAt)}</span>
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Criado em</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-right">
                                        <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-70 md:group-hover:opacity-100 md:group-focus-within:opacity-100 transition-opacity">
                                            <button
                                                type="button"
                                                className="p-2.5 text-muted-foreground hover:text-foreground hover:bg-muted focus-visible:ring-2 focus-visible:ring-primary rounded-xl transition-colors border border-transparent hover:border-border"
                                                title="Visualizar"
                                                aria-label={`Visualizar contrato: ${contract.title}`}
                                                onClick={() => handleViewContract(contract)}
                                            >
                                                <Eye className="h-4 w-4" />
                                            </button>
                                            {contract.status === 'draft' && (
                                                <button
                                                    type="button"
                                                    className="p-2.5 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl"
                                                    title="Editar rascunho"
                                                    aria-label={`Editar rascunho: ${contract.title}`}
                                                    onClick={() => handleEditDraft(contract)}
                                                >
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                            )}

                                            <button
                                                disabled
                                                className="p-2.5 text-muted-foreground opacity-40 rounded-xl"
                                                title="PDF indisponível: documento ainda não gerado"
                                                aria-label="PDF indisponível"
                                            >
                                                <Download className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredContracts.length === 0 && (
                    <div className="p-12">
                        <PremiumEmptyState 
                            icon={FileText}
                            title={contracts.length === 0 ? 'Nenhum contrato cadastrado' : 'Nenhum resultado para os filtros'}
                            description={contracts.length === 0
                                ? 'Você ainda não possui contratos cadastrados.'
                                : 'Ajuste o título, a empresa ou o status para localizar outros contratos.'}
                            {...(contracts.length === 0 && creationOptions === null && !isCreating
                                ? { actionLabel: 'Novo Contrato', onAction: handleCreateContract }
                                : {})}
                        />
                    </div>
                )}
            </div>

            {editingDraft && (
                <ContractDraftEditor key={editingDraft.id + editingDraft.updatedAt} contract={editingDraft}
                    onClose={() => setEditingDraft(null)} onSaved={handleDraftSaved} />
            )}
            {selectedContract && (
                <>
                    <ContractViewer
                        isOpen={isViewerOpen}
                        onClose={() => setIsViewerOpen(false)}
                        contract={selectedContract}
                    />


                </>
            )}
        </div>
    );
}
