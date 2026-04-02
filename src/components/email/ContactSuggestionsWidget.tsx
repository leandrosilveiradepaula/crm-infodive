import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X, UserPlus, Building2, Phone, Sparkles, Ban, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ThemeSelect } from '../ui/theme/ThemeComponents';
import {
    getContactSuggestions,
    rejectContactSuggestion,
    ignoreContactForever,
    approveContactSuggestion,
    getAccountsForSelect
} from '@/app/(dashboard)/contacts/suggestions-actions';

interface Suggestion {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    role: string | null;
    company_name: string | null;
}

interface Account {
    id: string;
    name: string;
}

export function ContactSuggestionsWidget({ initialAccounts = [] }: { initialAccounts?: Account[] }) {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [accounts, setAccounts] = useState<Account[]>(initialAccounts);
    const [loading, setLoading] = useState(true);
    const [expanded, setExpanded] = useState(false);
    const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
    const [selectedAccountId, setSelectedAccountId] = useState<string>('');
    const [isCreatingNewAccount, setIsCreatingNewAccount] = useState(false);
    const [newAccountName, setNewAccountName] = useState('');
    const [newAccountCnpj, setNewAccountCnpj] = useState('');
    const [newAccountIe, setNewAccountIe] = useState('');

    useEffect(() => {
        fetchSuggestions();
    }, []);

    const fetchSuggestions = async () => {
        try {
            const [data, accountsData] = await Promise.all([
                getContactSuggestions(),
                getAccountsForSelect()
            ]);
            setSuggestions(data || []);
            if (initialAccounts.length === 0 && accountsData) {
                setAccounts(accountsData);
            }
        } catch (error) {
            console.error("Error fetching suggestions or accounts:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleReject = async (id: string) => {
        try {
            await rejectContactSuggestion(id);
            setSuggestions(s => s.filter(item => item.id !== id));
            toast.success('Sugestão descartada');
        } catch {
            toast.error('Erro ao descartar sugestão');
        }
    };

    const handleIgnoreForever = async (suggestion: Suggestion) => {
        if (!suggestion.email) {
            toast.error('O contato não possui e-mail para ser ignorado');
            return;
        }
        try {
            await ignoreContactForever(suggestion.id, suggestion.email);
            setSuggestions(s => s.filter(item => item.id !== suggestion.id));
            toast.success(`${suggestion.email} foi adicionado à Blocklist`);
        } catch {
            toast.error('Falha ao adicionar à Blocklist');
        }
    };

    const handleApproveClick = (suggestion: Suggestion) => {
        setSelectedSuggestion(suggestion);
        setIsCreatingNewAccount(false);
        setNewAccountName(suggestion.company_name || '');
        setNewAccountCnpj('');
        setNewAccountIe('');

        let accountMatched = false;

        if (suggestion.company_name && accounts.length > 0) {
            const aiName = suggestion.company_name.toLowerCase();
            const match = accounts.find(a => {
                const dbName = a.name.toLowerCase();
                return dbName.includes(aiName) || aiName.includes(dbName);
            });
            if (match) {
                setSelectedAccountId(match.id);
                accountMatched = true;
            }
        }

        if (!accountMatched && suggestion.email && accounts.length > 0) {
            const domain = suggestion.email.split('@')[1];
            const publicDomains = ['gmail.com', 'hotmail.com', 'yahoo.com', 'outlook.com', 'uol.com.br', 'bol.com.br', 'icloud.com', 'terra.com.br'];

            if (domain && !publicDomains.includes(domain.toLowerCase())) {
                const inferredCompanyName = domain.split('.')[0];

                if (!suggestion.company_name) {
                    const formattedInferred = inferredCompanyName.charAt(0).toUpperCase() + inferredCompanyName.slice(1);
                    setNewAccountName(formattedInferred);
                }

                const domainMatch = accounts.find(a => a.name.toLowerCase().includes(inferredCompanyName.toLowerCase()));
                if (domainMatch) {
                    setSelectedAccountId(domainMatch.id);
                    accountMatched = true;
                }
            }
        }

        if (!accountMatched) {
            setSelectedAccountId('');
        }
    };

    const confirmApproval = async () => {
        if (!selectedSuggestion) return;

        if (isCreatingNewAccount && (!newAccountName.trim() || !newAccountCnpj.trim() || !newAccountIe.trim())) {
            toast.error('Informe Nome, CNPJ e Inscrição Estadual para a nova empresa');
            return;
        }

        if (!isCreatingNewAccount && !selectedAccountId) {
            toast.error('Selecione uma empresa para vincular o contato');
            return;
        }

        try {
            await approveContactSuggestion(
                selectedSuggestion.id,
                {
                    name: selectedSuggestion.name,
                    email: selectedSuggestion.email,
                    phone: selectedSuggestion.phone,
                    role: selectedSuggestion.role
                },
                selectedAccountId,
                isCreatingNewAccount,
                { name: newAccountName.trim(), cnpj: newAccountCnpj.trim(), ie: newAccountIe.trim() }
            );

            setSuggestions(s => s.filter(item => item.id !== selectedSuggestion.id));
            setSelectedSuggestion(null);
            toast.success('Contato aprovado e vinculado com sucesso!');
        } catch (error: any) {
            toast.error('Falha ao aprovar: ' + error.message);
        }
    };

    if (loading || suggestions.length === 0) return null;

    return (
        <>
            {/* Compact banner */}
            <button
                onClick={() => setExpanded(!expanded)}
                className="w-full flex items-center justify-between px-3 py-2 bg-primary/5 dark:bg-primary/10 border border-primary/20 rounded-lg text-sm hover:bg-primary/10 transition-colors"
            >
                <span className="flex items-center gap-2 text-primary dark:text-blue-400 font-medium">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>{suggestions.length} sugestão(ões) de contato</span>
                </span>
                {expanded ? (
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                ) : (
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                )}
            </button>

            {/* Expandable list */}
            {expanded && (
                <div className="mt-2 space-y-2 animate-in slide-in-from-top-2 duration-200">
                    {suggestions.map((suggestion) => (
                        <div key={suggestion.id} className="flex items-center justify-between p-2.5 bg-background rounded-lg border border-border text-sm">
                            <div className="min-w-0 flex-1">
                                <p className="font-medium text-foreground truncate flex items-center gap-1.5">
                                    <UserPlus className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                                    <span className="truncate">{suggestion.name || 'Sem nome'}</span>
                                </p>
                                <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-muted-foreground mt-0.5 ml-5">
                                    {suggestion.email && <span className="truncate">{suggestion.email}</span>}
                                    {suggestion.company_name && (
                                        <span className="flex items-center text-amber-600 dark:text-amber-400">
                                            <Building2 className="h-3 w-3 mr-0.5" />
                                            {suggestion.company_name}
                                        </span>
                                    )}
                                    {suggestion.phone && (
                                        <span className="flex items-center">
                                            <Phone className="h-3 w-3 mr-0.5" />
                                            {suggestion.phone}
                                        </span>
                                    )}
                                </div>
                            </div>
                            <div className="flex gap-1 ml-2 shrink-0">
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:bg-destructive/10 hover:text-destructive" onClick={() => handleIgnoreForever(suggestion)} title="Blocklist">
                                    <Ban className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive hover:bg-destructive/10" onClick={() => handleReject(suggestion.id)} title="Descartar">
                                    <X className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="sm" className="h-7 px-2.5 text-xs bg-primary hover:bg-primary/90" onClick={() => handleApproveClick(suggestion)}>
                                    <Check className="h-3.5 w-3.5 mr-1" />
                                    Aprovar
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modal de Vinculação */}
            <Dialog open={!!selectedSuggestion} onOpenChange={(open) => !open && setSelectedSuggestion(null)}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Vincular Contato à Empresa</DialogTitle>
                        <DialogDescription>
                            Para cadastrar <b>{selectedSuggestion?.name}</b>, você precisa dizer de qual Empresa ele é cliente/funcionário.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Empresa Identificada pela IA:</label>
                            <p className="text-sm text-muted-foreground p-2 bg-muted rounded-md font-mono">
                                {selectedSuggestion?.company_name || 'Desconhecida'}
                            </p>
                        </div>
                        <div className="space-y-4">
                            <label className="text-sm font-medium flex items-center justify-between">
                                <span>{isCreatingNewAccount ? 'Nome da Nova Empresa' : 'Vincular à Empresa Existente'} <span className="text-destructive">*</span></span>
                                <Button
                                    variant="link"
                                    size="sm"
                                    className="h-auto p-0 text-xs text-primary"
                                    onClick={() => setIsCreatingNewAccount(!isCreatingNewAccount)}
                                >
                                    {isCreatingNewAccount ? 'Selecione uma existente' : '+ Criar Nova Empresa'}
                                </Button>
                            </label>

                            {isCreatingNewAccount ? (
                                <div className="space-y-3">
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border rounded-md text-sm bg-transparent"
                                        placeholder="Nome da Empresa (ex: ACME Corp)"
                                        value={newAccountName}
                                        onChange={(e) => setNewAccountName(e.target.value)}
                                        autoFocus
                                    />
                                    <div className="grid grid-cols-2 gap-3">
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border rounded-md text-sm bg-transparent"
                                            placeholder="CNPJ"
                                            value={newAccountCnpj}
                                            onChange={(e) => setNewAccountCnpj(e.target.value)}
                                        />
                                        <input
                                            type="text"
                                            className="w-full px-3 py-2 border rounded-md text-sm bg-transparent"
                                            placeholder="Inscr. Estadual"
                                            value={newAccountIe}
                                            onChange={(e) => setNewAccountIe(e.target.value)}
                                        />
                                    </div>
                                </div>
                            ) : (
                                <ThemeSelect
                                    value={selectedAccountId}
                                    onChange={(e) => setSelectedAccountId(e.target.value)}
                                >
                                    <option value="" disabled>Selecione uma empresa...</option>
                                    {accounts.map(acc => (
                                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                                    ))}
                                </ThemeSelect>
                            )}
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSelectedSuggestion(null)}>Cancelar</Button>
                        <Button onClick={confirmApproval} disabled={isCreatingNewAccount ? (!newAccountName.trim() || !newAccountCnpj.trim() || !newAccountIe.trim()) : !selectedAccountId}>
                            {isCreatingNewAccount ? 'Criar Empresa e Vincular' : 'Confirmar Vínculo'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
