import React from 'react';
import { Button } from '@/components/ui/button';
import { Plus, X, Sparkles } from 'lucide-react';
import { ThemeInput, ThemeSectionHeader } from '@/components/ui/theme/ThemeComponents';
import { type AccountBranch } from '@/types/account';

interface CustomerBranchesSectionProps {
    branches: AccountBranch[];
    onAddBranch: () => void;
    onUpdateBranch: (id: string, field: keyof AccountBranch, value: any) => void;
    onRemoveBranch: (id: string) => void;
    onOpenParser: (id: string) => void;
}

export function CustomerBranchesSection({ branches, onAddBranch, onUpdateBranch, onRemoveBranch, onOpenParser }: CustomerBranchesSectionProps) {
    return (
        <div className="space-y-4 pt-6 border-t border-border">
            <div className="flex justify-between items-center h-6 mb-2">
                <ThemeSectionHeader title="Filiais" iconColor="bg-amber-500" />
                <Button type="button" size="sm" variant="ghost" onClick={onAddBranch} className="h-6 text-[10px] font-bold uppercase tracking-wide text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 px-2 rounded-lg">
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Filial
                </Button>
            </div>

            <div className="space-y-3">
                {branches.map((branch) => (
                    <div key={branch.id} className="bg-card p-4 rounded-xl border border-border space-y-3 group hover:border-muted-foreground/30 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                            <div className="grid grid-cols-2 gap-3 flex-1">
                                <div className="col-span-2 flex justify-between items-center bg-muted/20 p-2 rounded-lg border border-border/50">
                                    <ThemeInput
                                        placeholder="Nome da Filial"
                                        value={branch.name || ''}
                                        onChange={(e) => onUpdateBranch(branch.id, 'name', e.target.value)}
                                        className="h-[30px] text-xs border-transparent bg-transparent focus:bg-background"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onOpenParser(branch.id)}
                                        className="h-6 gap-1 text-[10px] text-blue-500 hover:text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 px-2"
                                    >
                                        <Sparkles className="h-3 w-3" />
                                        Preencher (IA)
                                    </Button>
                                </div>

                                <div className="flex gap-2">
                                    <ThemeInput
                                        placeholder="CEP"
                                        value={branch.zip || ''}
                                        onChange={(e) => onUpdateBranch(branch.id, 'zip', e.target.value)}
                                        className="h-[30px] text-xs w-24"
                                    />
                                    <ThemeInput
                                        placeholder="Cidade"
                                        value={branch.city || ''}
                                        onChange={(e) => onUpdateBranch(branch.id, 'city', e.target.value)}
                                        className="h-[30px] text-xs flex-1"
                                    />
                                </div>
                                <ThemeInput
                                    placeholder="CNPJ Filial"
                                    value={branch.cnpj || ''}
                                    onChange={(e) => onUpdateBranch(branch.id, 'cnpj', e.target.value)}
                                    className="h-[30px] text-xs"
                                />
                                <ThemeInput
                                    placeholder="Logradouro"
                                    value={branch.street || ''}
                                    onChange={(e) => onUpdateBranch(branch.id, 'street', e.target.value)}
                                    className="h-[30px] text-xs"
                                />
                                <div className="flex gap-2">
                                    <ThemeInput
                                        placeholder="Número"
                                        value={branch.number || ''}
                                        onChange={(e) => onUpdateBranch(branch.id, 'number', e.target.value)}
                                        className="h-[30px] text-xs w-20"
                                    />
                                    <ThemeInput
                                        placeholder="Bairro"
                                        value={branch.neighborhood || ''}
                                        onChange={(e) => onUpdateBranch(branch.id, 'neighborhood', e.target.value)}
                                        className="h-[30px] text-xs flex-1"
                                    />
                                </div>
                                <ThemeInput
                                    placeholder="Inscrição Estadual"
                                    value={branch.ie || ''}
                                    onChange={(e) => onUpdateBranch(branch.id, 'ie', e.target.value)}
                                    className="h-[30px] text-xs"
                                />
                                <div className="col-span-2 mt-1">
                                    <textarea
                                        placeholder="Condições e Prazos de Pagamento (Específicos da filial)"
                                        value={branch.payment_terms || ''}
                                        onChange={(e) => onUpdateBranch(branch.id, 'payment_terms', e.target.value)}
                                        rows={2}
                                        className="w-full text-xs px-3 py-2 rounded-lg bg-background border border-border text-foreground placeholder:text-muted-foreground/50 hover:border-muted-foreground/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                                    />
                                </div>
                            </div>
                            <Button type="button" size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-red-400 hover:bg-red-500/10 rounded-lg mt-1" onClick={() => onRemoveBranch(branch.id)}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                ))}
                {branches.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-border rounded-xl bg-muted/30">
                        <p className="text-xs text-muted-foreground font-medium">Nenhuma filial cadastrada.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
