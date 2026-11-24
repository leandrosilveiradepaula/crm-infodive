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
                <ThemeSectionHeader title="Filiais" iconColor="bg-warning" />
                <Button type="button" size="sm" variant="ghost" onClick={onAddBranch} className="h-6 text-metadata-ui font-bold uppercase tracking-wide text-warning-readable hover:text-warning-readable hover:bg-warning/10 px-2 rounded-[var(--radius-control)]">
                    <Plus className="h-3 w-3 mr-1" /> Adicionar Filial
                </Button>
            </div>

            <div className="space-y-3">
                {branches.map((branch) => (
                    <div key={branch.id} className="bg-card p-4 rounded-[var(--radius-panel)] border border-border space-y-3 group hover:border-muted-foreground/30 transition-colors">
                        <div className="flex justify-between items-start gap-4">
                            <div className="grid grid-cols-2 gap-3 flex-1">
                                <div className="col-span-2 flex justify-between items-center bg-muted/20 p-2 rounded-[var(--radius-control)] border border-border/50">
                                    <ThemeInput
                                        aria-label="Nome da Filial" placeholder="Nome da Filial"
                                        value={branch.name || ''}
                                        onChange={(e) => onUpdateBranch(branch.id, 'name', e.target.value)}
                                        className="h-[30px] text-metadata-ui border-transparent bg-transparent focus:bg-background"
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => onOpenParser(branch.id)}
                                        className="h-6 gap-1 text-metadata-ui text-primary hover:text-primary hover:bg-surface-highlight dark:hover:bg-primary/20 px-2"
                                    >
                                        <Sparkles className="h-3 w-3" />
                                        Preencher (IA)
                                    </Button>
                                </div>

                                <div className="flex gap-2">
                                    <ThemeInput
                                        aria-label="CEP" placeholder="CEP"
                                        value={branch.zip || ''}
                                        onChange={(e) => onUpdateBranch(branch.id, 'zip', e.target.value)}
                                        className="h-[30px] text-metadata-ui w-24"
                                    />
                                    <ThemeInput
                                        aria-label="Cidade" placeholder="Cidade"
                                        value={branch.city || ''}
                                        onChange={(e) => onUpdateBranch(branch.id, 'city', e.target.value)}
                                        className="h-[30px] text-metadata-ui flex-1"
                                    />
                                </div>
                                <ThemeInput
                                    aria-label="CNPJ Filial" placeholder="CNPJ Filial"
                                    value={branch.cnpj || ''}
                                    onChange={(e) => onUpdateBranch(branch.id, 'cnpj', e.target.value)}
                                    className="h-[30px] text-metadata-ui"
                                />
                                <ThemeInput
                                    aria-label="Logradouro" placeholder="Logradouro"
                                    value={branch.street || ''}
                                    onChange={(e) => onUpdateBranch(branch.id, 'street', e.target.value)}
                                    className="h-[30px] text-metadata-ui"
                                />
                                <div className="flex gap-2">
                                    <ThemeInput
                                        aria-label="Número" placeholder="Número"
                                        value={branch.number || ''}
                                        onChange={(e) => onUpdateBranch(branch.id, 'number', e.target.value)}
                                        className="h-[30px] text-metadata-ui w-20"
                                    />
                                    <ThemeInput
                                        aria-label="Bairro" placeholder="Bairro"
                                        value={branch.neighborhood || ''}
                                        onChange={(e) => onUpdateBranch(branch.id, 'neighborhood', e.target.value)}
                                        className="h-[30px] text-metadata-ui flex-1"
                                    />
                                </div>
                                <ThemeInput
                                    aria-label="Inscrição Estadual" placeholder="Inscrição Estadual"
                                    value={branch.ie || ''}
                                    onChange={(e) => onUpdateBranch(branch.id, 'ie', e.target.value)}
                                    className="h-[30px] text-metadata-ui"
                                />
                                <div className="col-span-2 mt-1">
                                    <textarea
                                        aria-label="Condições e prazos de pagamento da filial" placeholder="Condições e Prazos de Pagamento (Específicos da filial)"
                                        value={branch.payment_terms || ''}
                                        onChange={(e) => onUpdateBranch(branch.id, 'payment_terms', e.target.value)}
                                        rows={2}
                                        className="w-full text-metadata-ui px-3 py-2 rounded-[var(--radius-control)] bg-background border border-border text-foreground placeholder:text-muted-foreground/50 hover:border-muted-foreground/30 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                                    />
                                </div>
                            </div>
                            <Button type="button" size="icon" variant="ghost" aria-label="Remover filial" className="h-7 w-7 text-muted-foreground hover:text-destructive-readable hover:bg-destructive/10 rounded-[var(--radius-control)] mt-1" onClick={() => onRemoveBranch(branch.id)}>
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        </div>
                    </div>
                ))}
                {branches.length === 0 && (
                    <div className="text-center py-8 border border-dashed border-border rounded-[var(--radius-panel)] bg-muted/30">
                        <p className="text-metadata-ui text-muted-foreground font-medium">Nenhuma filial cadastrada.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
