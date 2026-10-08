import { useEffect, useState } from 'react';
import { Command } from 'cmdk';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
    LayoutDashboard, Briefcase, Users, Plus, Sparkles, ArrowRight, Loader2
} from 'lucide-react';
import { useDeals } from '../../hooks/useDeals';
import { searchGlobal } from '@/app/(dashboard)/dashboard/actions';
import './CommandPalette.css';

type GlobalSearchResults = Awaited<ReturnType<typeof searchGlobal>>;
const stageOptions = [
    { value: 'qualification', label: 'Qualificação' },
    { value: 'proposal', label: 'Proposta' },
    { value: 'negotiation', label: 'Negociação' },
    { value: 'won', label: 'Ganha' },
    { value: 'lost', label: 'Perdida' },
] as const;

interface CommandBarProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onAskAI?: (query: string) => void;
}

export const CommandBar = ({ open, onOpenChange, onAskAI }: CommandBarProps) => {
    const [search, setSearch] = useState('');
    const [pages, setPages] = useState<string[]>([]);
    const activePage = pages[pages.length - 1];

    // Sub-command State
    const [selectedDealId, setSelectedDealId] = useState<string | null>(null);

    // Search Results State
    const [isSearching, setIsSearching] = useState(false);
    const [searchError, setSearchError] = useState(false);
    const [isMoving, setIsMoving] = useState(false);
    const [foundDeals, setFoundDeals] = useState<GlobalSearchResults['deals']>([]);
    const [foundCustomers, setFoundCustomers] = useState<GlobalSearchResults['customers']>([]);

    const router = useRouter(); // Next.js adaptation
    const { deals, updateDealStage } = useDeals();

    // Reset state when closing
    useEffect(() => {
        if (!open) {
            setSearch('');
            setPages([]);
            setSelectedDealId(null);
            setFoundDeals([]);
            setFoundCustomers([]);
            setSearchError(false);
            setIsSearching(false);
        }
    }, [open]);

    // Debounced, request-identity-safe global search.
    useEffect(() => {
        const term = search.trim();
        if (!open || activePage || term.length < 2) {
            if (!activePage) {
                setFoundDeals([]);
                setFoundCustomers([]);
            }
            setIsSearching(false);
            return;
        }

        let cancelled = false;
        const timer = setTimeout(async () => {
            setIsSearching(true);
            try {
                const { deals, customers } = await searchGlobal(term);
                if (cancelled) return;
                setFoundDeals(deals);
                setFoundCustomers(customers);
                setSearchError(false);
            } catch {
                if (cancelled) return;
                setFoundDeals([]);
                setFoundCustomers([]);
                setSearchError(true);
            } finally {
                if (!cancelled) setIsSearching(false);
            }
        }, 300);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [open, search, activePage]);

    const handleSelect = (callback: () => void) => {
        callback();
        onOpenChange(false);
    };

    const pushPage = (page: string) => {
        setPages([...pages, page]);
        setSearch(''); // Clear search when entering sub-menu
    };

    const popPage = () => {
        setPages(pages.slice(0, -1));
        setSearch('');
    };

    const handleMoveDeal = async (stage: string) => {
        if (!selectedDealId || isMoving) return;
        setIsMoving(true);
        try {
            const updated = await updateDealStage(selectedDealId, stage);
            if (!updated) {
                toast.error('Não foi possível mover a oportunidade. Tente novamente.');
                return;
            }
            toast.success('Etapa da oportunidade atualizada.');
            onOpenChange(false);
        } catch {
            toast.error('Não foi possível mover a oportunidade. Tente novamente.');
        } finally {
            setIsMoving(false);
        }
    };

    return (
        <Command.Dialog
            open={open}
            onOpenChange={onOpenChange}
            label="Menu global de comandos"
            className="command-palette"
            onKeyDown={(e) => {
                if (e.key === 'Escape' && pages.length > 0) {
                    e.preventDefault();
                    popPage();
                }
            }}
            shouldFilter={false}
        >
            <div className="command-palette-wrapper">
                <Command.Input
                    placeholder={!activePage ? "Digite um comando ou busque..." : activePage === 'move-deal' ? "Selecione a oportunidade..." : "Selecione o estágio..."}
                    value={search}
                    onValueChange={value => {
                        setSearch(value);
                        setSearchError(false);
                        setFoundDeals([]);
                        setFoundCustomers([]);
                    }}
                    className="command-input"
                    autoFocus
                />

                <Command.List className="command-list">
                    <Command.Empty className="command-empty">
                        {isSearching ? (
                            <div className="flex items-center justify-center gap-2 py-4 text-muted-foreground">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Buscando...</span>
                            </div>
) : searchError ? 'Busca indisponível no momento. Tente novamente.' : 'Nenhum resultado encontrado.'}
                    </Command.Empty>

                    {/* --- ASK AI FUNCTION --- */}
                    {onAskAI && search.length > 2 && (
                        <Command.Group heading="Assistente do CRM" className="command-group">
                            <Command.Item
                                value="ask-ai"
                                onSelect={() => {
                                    onAskAI(search);
                                    setSearch('');
                                    onOpenChange(false);
                                }}
                                className="command-item"
                            >
                                <Sparkles className="command-icon text-teal-400" />
                                <div className="flex-1">
                                    <div className="font-semibold">Perguntar ao assistente...</div>
                                    <div className="text-xs text-muted-foreground">"{search}"</div>
                                    </div>
                                <kbd className="command-kbd">↵</kbd>
                            </Command.Item>
                        </Command.Group>
                    )}

                    {/* --- ROOT PAGE --- */}
                    {!activePage && (
                        <>
                            {/* SEARCH RESULTS MODE */}
                            {(foundDeals.length > 0 || foundCustomers.length > 0) && (
                                <>
                                    {foundDeals.length > 0 && (
                                        <Command.Group heading="Oportunidades encontradas" className="command-group">
                                            {foundDeals.map(deal => (
                                                <Command.Item
                                                    key={deal.id}
                                                    onSelect={() => handleSelect(() => router.push(`/pipeline?view=deal&id=${deal.id}`))}
                                                    className="command-item"
                                                >
                                                    <Briefcase className="command-icon text-primary" />
                                                    <div className="flex-1">
                                                        <div className="font-semibold">{deal.title}</div>
                                                        <div className="text-xs text-muted-foreground">{deal.company} • {deal.stage}</div>
                                                    </div>
                                                </Command.Item>
                                            ))}
                                        </Command.Group>
                                    )}

                                    {foundCustomers.length > 0 && (
                                        <Command.Group heading="Empresas encontradas" className="command-group">
                                            {foundCustomers.map(client => (
                                                <Command.Item
                                                    key={client.id}
                                                    onSelect={() => handleSelect(() => router.push(`/customers?id=${client.id}`))}
                                                    className="command-item"
                                                >
                                                    <Users className="command-icon text-teal-500" />
                                                    <div className="flex-1">
                                                        <div className="font-semibold">{client.name}</div>
                                                        <div className="text-xs text-muted-foreground">{client.segment}</div>
                                                    </div>
                                                </Command.Item>
                                            ))}
                                        </Command.Group>
                                    )}
                                </>
                            )}

                            {/* DEFAULT MODE (No Search or No Results) */}
                            {search.length < 2 && (
                                <>
                                    <Command.Group heading="Ações rápidas" className="command-group">
                                        <Command.Item value="new-deal" onSelect={() => handleSelect(() => router.push('/pipeline?newDeal=true'))} className="command-item">
                                            <Plus className="command-icon text-green-500" />
                                            <span>Criar Nova Oportunidade</span>
                                            <kbd className="command-kbd">SHIFT+C</kbd>
                                        </Command.Item>
                                        <Command.Item value="new-customer" onSelect={() => handleSelect(() => router.push('/customers?new=true'))} className="command-item">
                                            <Users className="command-icon text-blue-500" />
                                            <span>Cadastrar Nova Empresa</span>
                                        </Command.Item>
                                        <Command.Item value="move-opportunity" onSelect={() => pushPage('move-deal')} className="command-item">
                                            <ArrowRight className="command-icon text-orange-500" />
                                            <span>Mover Oportunidade...</span>
                                        </Command.Item>
                                    </Command.Group>

                                    <Command.Group heading="Navegação" className="command-group">
                                        <Command.Item value="nav-dashboard" onSelect={() => handleSelect(() => router.push('/dashboard'))} className="command-item">
                                            <LayoutDashboard className="command-icon" />
                                            <span>Dashboard</span>
                                        </Command.Item>
                                        <Command.Item value="nav-pipeline" onSelect={() => handleSelect(() => router.push('/pipeline'))} className="command-item">
                                            <Briefcase className="command-icon" />
                                            <span>Pipeline</span>
                                        </Command.Item>
                                        <Command.Item value="nav-customers" onSelect={() => handleSelect(() => router.push('/customers'))} className="command-item">
                                            <Users className="command-icon" />
                                            <span>Empresas</span>
                                        </Command.Item>
                                    </Command.Group>
                                </>
                            )}
                        </>
                    )}

                    {/* --- SUB-PAGE: MOVE DEAL --- */}
                    {activePage === 'move-deal' && (
                        <Command.Group heading="Selecione a oportunidade" className="command-group">
                            {deals.slice(0, 20).map(deal => (
                                <Command.Item
                                    key={deal.id}
                                    onSelect={() => {
                                        setSelectedDealId(deal.id);
                                        pushPage('pick-stage');
                                    }}
                                    className="command-item"
                                >
                                    <Briefcase className="command-icon text-primary" />
                                    <div className="flex-1">
                                        <div className="font-semibold">{deal.company}</div>
                                        <div className="text-xs text-muted-foreground">{deal.title}</div>
                                    </div>
                                    <span className="text-xs text-muted-foreground ml-auto">
                                        {deal.stage}
                                    </span>
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}

                    {/* --- SUB-PAGE: PICK STAGE --- */}
                    {activePage === 'pick-stage' && (
                        <Command.Group heading="Selecione o estágio" className="command-group">
                            {stageOptions.map(stage => (
                                <Command.Item
                                    key={stage.value}
                                    disabled={isMoving}
                                    onSelect={() => void handleMoveDeal(stage.value)}
                                    className="command-item"
                                >
                                    <div className={`h-2 w-2 rounded-full mr-2 ${stage.value === 'won' ? 'bg-green-500' :
                                        stage.value === 'lost' ? 'bg-red-500' : 'bg-blue-500'}`} />
                                    <span>{stage.label}</span>
                                    {isMoving && <Loader2 className="h-4 w-4 ml-auto animate-spin" aria-hidden="true" />}
                                </Command.Item>
                            ))}
                        </Command.Group>
                    )}

                </Command.List>

                <div className="command-footer">
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        {pages.length > 0 && (
                            <span className="flex items-center gap-1">
                                <kbd className="command-kbd-small">Esc</kbd> Voltar
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <kbd className="command-kbd-small">↑↓</kbd> Navegar
                        </span>
                        <span className="flex items-center gap-1">
                            <kbd className="command-kbd-small">Enter</kbd> Selecionar
                        </span>
                    </div>
                </div>
            </div>
        </Command.Dialog>
    );
};
