'use client';

import { useState, useEffect } from 'react';
import {
    Sparkles, Phone, Mail, Users, CheckSquare, Check, X, Loader2,
    ChevronDown, ChevronUp, Zap, ArrowRight, RefreshCw
} from 'lucide-react';
import type { AiActivitySuggestion } from '@/types/ai-suggestion';
import { getSuggestions, acceptSuggestion, dismissSuggestion } from '@/app/(dashboard)/activities/actions';
import { toast } from 'sonner';

interface AiSuggestionsPanelProps {
    onAccepted?: () => void;
    compact?: boolean;
    dealId?: string;
    maxItems?: number;
}

export function AiSuggestionsPanel({ onAccepted, compact = false, dealId, maxItems }: AiSuggestionsPanelProps) {
    const [suggestions, setSuggestions] = useState<AiActivitySuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [processingIds, setProcessingIds] = useState<Set<string>>(new Set());

    const fetchSuggestions = async () => {
        setLoading(true);
        try {
            const data = await getSuggestions(dealId);
            setSuggestions(data);
        } catch (err) {
            console.error('Failed to fetch suggestions:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleGenerate = async () => {
        setGenerating(true);
        try {
            const res = await fetch('/api/gemini/suggest-activities', { 
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ force: true })
            });
            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.error || 'Failed to generate');
            }
            const { suggestions: newSuggestions, error } = await res.json();
            if (error) {
                console.warn('API Warning:', error);
            }
            await fetchSuggestions();
            toast.success(`${newSuggestions?.length || 0} sugestões geradas pela IA!`);
        } catch (err: any) {
            toast.error(err.message || 'Erro ao gerar sugestões. Tente novamente.');
            console.error('🔥 Error generating suggestions:', err);
        } finally {
            setGenerating(false);
        }
    };

    const handleAccept = async (id: string) => {
        setProcessingIds(prev => new Set(prev).add(id));
        try {
            await acceptSuggestion(id);
            setSuggestions(prev => prev.filter(s => s.id !== id));
            toast.success('Atividade criada com sucesso!');
            onAccepted?.();
        } catch (err) {
            toast.error('Erro ao aceitar sugestão');
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    const handleDismiss = async (id: string) => {
        setProcessingIds(prev => new Set(prev).add(id));
        try {
            await dismissSuggestion(id);
            setSuggestions(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            toast.error('Erro ao dispensar sugestão');
        } finally {
            setProcessingIds(prev => {
                const next = new Set(prev);
                next.delete(id);
                return next;
            });
        }
    };

    useEffect(() => {
        fetchSuggestions();
    }, [dealId]);

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'call': return Phone;
            case 'email': return Mail;
            case 'meeting': return Users;
            default: return CheckSquare;
        }
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'call': return 'Ligação';
            case 'email': return 'E-mail';
            case 'meeting': return 'Reunião';
            default: return 'Tarefa';
        }
    };

    const getTypeColor = (type: string) => {
        switch (type) {
            case 'call': return 'text-foreground bg-surface-subtle border-border';
            case 'email': return 'text-foreground bg-surface-subtle border-border';
            case 'meeting': return 'text-foreground bg-surface-subtle border-border';
            default: return 'text-foreground bg-surface-subtle border-border';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-foreground bg-destructive-subtle border-destructive/30';
            case 'high': return 'text-foreground bg-warning-subtle border-warning/30';
            case 'medium': return 'text-foreground bg-surface-subtle border-border';
            default: return 'text-foreground bg-surface-subtle border-border';
        }
    };

    const getPriorityLabel = (priority: string) => {
        switch (priority) {
            case 'urgent': return '🔥 Urgente';
            case 'high': return 'Alta';
            case 'medium': return 'Média';
            default: return 'Baixa';
        }
    };

    const displaySuggestions = maxItems ? suggestions.slice(0, maxItems) : suggestions;

    if (loading) {
        return (
            <div className={`bg-card border border-border ${compact ? 'rounded-[var(--radius-panel)] p-3' : 'rounded-[var(--radius-panel)] p-4'} animate-pulse`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-[var(--radius-panel)] bg-primary/10" />
                    <div className="h-5 w-48 bg-muted rounded-[var(--radius-control)]" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-muted/50 rounded-[var(--radius-panel)]" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-card border border-border shadow-control-ui ${compact ? 'rounded-[var(--radius-panel)]' : 'rounded-[var(--radius-panel)]'} overflow-hidden`}>
            {/* Header */}
            <div
                className={`flex items-center justify-between ${compact ? 'px-3 py-2.5' : 'px-4 py-3'} cursor-pointer hover:bg-primary/5 transition-colors`}
            >
                <div className="flex items-center gap-3">
                    <div className={`${compact ? 'p-1.5' : 'p-2'} bg-primary rounded-[var(--radius-control)] shadow-card-ui shadow-primary/20`}>
                        <Sparkles className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-primary-foreground`} />
                    </div>
                    <div>
                        <h3 className={`font-black text-foreground tracking-tight ${compact ? 'text-metadata-ui' : 'text-body-ui'}`}>
                            Ações Sugeridas pela IA
                        </h3>
                        {!compact && (
                            <p className="text-metadata-ui text-muted-foreground font-medium">
                                Recomendações inteligentes baseadas no seu pipeline
                            </p>
                        )}
                    </div>
                    {suggestions.length > 0 && (
                        <span className="px-2.5 py-0.5 text-metadata-ui font-black bg-primary text-primary-foreground rounded-full uppercase tracking-widest">
                            {suggestions.length}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            handleGenerate();
                        }}
                        disabled={generating}
                        className="px-3 py-1.5 text-metadata-ui font-black uppercase tracking-widest bg-surface-subtle text-foreground rounded-[var(--radius-panel)] hover:bg-muted transition-all flex items-center gap-1.5 disabled:cursor-progress"
                        title="Gerar novas sugestões"
                    >
                        {generating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <RefreshCw className="h-3 w-3" />
                        )}
                        {generating ? 'Analisando...' : 'Gerar'}
                    </button>
                    <button type="button"
                        aria-label={collapsed ? 'Expandir sugestões de IA' : 'Recolher sugestões de IA'}
                        aria-expanded={!collapsed}
                        onClick={() => setCollapsed(!collapsed)}
                        className="rounded-[var(--radius-control)] p-1 text-muted-foreground hover:bg-muted focus-ring"
                    >
                        {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
                    </button>
                </div>
            </div>

            {/* Suggestions List */}
            {!collapsed && (
                <div className={`${compact ? 'px-3 pb-3' : 'px-4 pb-4'}`}>
                    {displaySuggestions.length === 0 ? (
                        <div className="text-center py-8">
                            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-muted/50 mb-3">
                                <Zap className="h-7 w-7 text-muted-foreground" />
                            </div>
                            <p className="text-body-ui font-bold text-foreground mb-1">Nenhuma sugestão ativa</p>
                            <p className="text-metadata-ui text-muted-foreground">
                                Clique em "Gerar" para que a IA analise seus deals.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {displaySuggestions.map((suggestion) => {
                                const TypeIcon = getTypeIcon(suggestion.type);
                                const isProcessing = processingIds.has(suggestion.id);

                                return (
                                    <div
                                        key={suggestion.id}
                                        className={`group bg-card border border-border rounded-[var(--radius-panel)] ${compact ? 'p-2.5' : 'p-3'} hover:border-primary/30 hover:shadow-card-ui hover:shadow-primary/5 transition-all ${isProcessing ? 'cursor-progress' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Type Icon */}
                                            <div className={`p-2 rounded-[var(--radius-panel)] border ${getTypeColor(suggestion.type)} shrink-0`}>
                                                <TypeIcon className="h-4 w-4" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <h4 className={`font-bold text-foreground ${compact ? 'text-metadata-ui' : 'text-body-ui'} leading-tight`}>
                                                            {suggestion.title}
                                                        </h4>
                                                        {suggestion.dealTitle && (
                                                            <p className="text-metadata-ui font-bold text-primary mt-0.5 flex items-center gap-1">
                                                                <ArrowRight className="h-2.5 w-2.5" />
                                                                {suggestion.dealTitle}
                                                                {suggestion.companyName && (
                                                                    <span className="text-muted-foreground">• {suggestion.companyName}</span>
                                                                )}
                                                            </p>
                                                        )}
                                                    </div>

                                                    {/* Actions */}
                                                    <div className="flex items-center gap-1 shrink-0">
                                                        <button
                                                            onClick={() => handleAccept(suggestion.id)}
                                                            className="p-1.5 rounded-[var(--radius-control)] bg-success-subtle text-foreground hover:bg-muted transition-colors"
                                                            title="Aceitar e criar atividade" aria-label="Aceitar e criar atividade"
                                                        >
                                                            {isProcessing ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Check className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDismiss(suggestion.id)}
                                                            className="p-1.5 rounded-[var(--radius-control)] bg-surface-subtle text-foreground hover:bg-muted transition-colors"
                                                            title="Dispensar" aria-label="Dispensar sugestão"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Badges */}
                                                <div className={`flex flex-wrap items-center gap-1.5 ${compact ? 'mt-1.5' : 'mt-2'}`}>
                                                    <span className={`px-2 py-0.5 rounded-[var(--radius-control)] border text-metadata-ui font-black uppercase tracking-wider ${getTypeColor(suggestion.type)}`}>
                                                        {getTypeLabel(suggestion.type)}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-[var(--radius-control)] border text-metadata-ui font-black uppercase tracking-wider ${getPriorityColor(suggestion.priority)}`}>
                                                        {getPriorityLabel(suggestion.priority)}
                                                    </span>
                                                    {suggestion.suggestedDueDate && (
                                                        <span className="px-2 py-0.5 rounded-[var(--radius-control)] border border-border bg-surface-subtle text-metadata-ui font-bold text-foreground">
                                                            📅 {new Date(suggestion.suggestedDueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Reasoning (expandable on hover) */}
                                                {suggestion.reasoning && !compact && (
                                                    <p className="mt-2 text-metadata-ui text-muted-foreground leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
                                                        💡 {suggestion.reasoning}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
