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
            case 'call': return 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20';
            case 'email': return 'text-primary bg-primary/10 border-primary/20';
            case 'meeting': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            default: return 'text-muted-foreground bg-muted/50 border-border';
        }
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'urgent': return 'text-red-500 bg-red-500/10 border-red-500/20';
            case 'high': return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
            case 'medium': return 'text-amber-500 bg-amber-500/10 border-amber-500/20';
            default: return 'text-muted-foreground bg-muted/50 border-border';
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
            <div className={`bg-gradient-to-br from-primary/5 via-card to-card border border-primary/10 ${compact ? 'rounded-2xl p-3' : 'rounded-3xl p-4'} animate-pulse`}>
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-xl bg-primary/10" />
                    <div className="h-5 w-48 bg-muted rounded-lg" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-20 bg-muted/50 rounded-2xl" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-gradient-to-br from-primary/5 via-card to-card border border-primary/10 shadow-sm ${compact ? 'rounded-2xl' : 'rounded-3xl'} overflow-hidden transition-all animate-in fade-in duration-500`}>
            {/* Header */}
            <div
                className={`flex items-center justify-between ${compact ? 'px-3 py-2.5' : 'px-4 py-3'} cursor-pointer hover:bg-primary/5 transition-colors`}
                onClick={() => setCollapsed(!collapsed)}
            >
                <div className="flex items-center gap-3">
                    <div className={`${compact ? 'p-1.5' : 'p-2'} bg-gradient-to-br from-primary to-primary/80 rounded-lg shadow-lg shadow-primary/20`}>
                        <Sparkles className={`${compact ? 'h-3.5 w-3.5' : 'h-4 w-4'} text-white`} />
                    </div>
                    <div>
                        <h3 className={`font-black text-foreground tracking-tight ${compact ? 'text-xs' : 'text-sm'}`}>
                            Ações Sugeridas pela IA
                        </h3>
                        {!compact && (
                            <p className="text-xs text-muted-foreground font-medium">
                                Recomendações inteligentes baseadas no seu pipeline
                            </p>
                        )}
                    </div>
                    {suggestions.length > 0 && (
                        <span className="px-2.5 py-0.5 text-[10px] font-black bg-primary text-white rounded-full uppercase tracking-widest">
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
                        className="px-3 py-1.5 text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary rounded-xl hover:bg-primary/20 transition-all flex items-center gap-1.5 disabled:opacity-50"
                        title="Gerar novas sugestões"
                    >
                        {generating ? (
                            <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                            <RefreshCw className="h-3 w-3" />
                        )}
                        {generating ? 'Analisando...' : 'Gerar'}
                    </button>
                    {collapsed ? (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                    )}
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
                            <p className="text-sm font-bold text-foreground mb-1">Nenhuma sugestão ativa</p>
                            <p className="text-xs text-muted-foreground">
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
                                        className={`group bg-card border border-border rounded-xl ${compact ? 'p-2.5' : 'p-3'} hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}
                                    >
                                        <div className="flex items-start gap-3">
                                            {/* Type Icon */}
                                            <div className={`p-2 rounded-xl border ${getTypeColor(suggestion.type)} shrink-0`}>
                                                <TypeIcon className="h-4 w-4" />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex-1">
                                                        <h4 className={`font-bold text-foreground ${compact ? 'text-xs' : 'text-sm'} leading-tight`}>
                                                            {suggestion.title}
                                                        </h4>
                                                        {suggestion.dealTitle && (
                                                            <p className="text-[10px] font-bold text-primary mt-0.5 flex items-center gap-1">
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
                                                            className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition-colors"
                                                            title="Aceitar e criar atividade"
                                                        >
                                                            {isProcessing ? (
                                                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                                            ) : (
                                                                <Check className="h-3.5 w-3.5" />
                                                            )}
                                                        </button>
                                                        <button
                                                            onClick={() => handleDismiss(suggestion.id)}
                                                            className="p-1.5 rounded-lg bg-muted/50 text-muted-foreground hover:bg-red-500/10 hover:text-red-500 transition-colors"
                                                            title="Dispensar"
                                                        >
                                                            <X className="h-3.5 w-3.5" />
                                                        </button>
                                                    </div>
                                                </div>

                                                {/* Badges */}
                                                <div className={`flex flex-wrap items-center gap-1.5 ${compact ? 'mt-1.5' : 'mt-2'}`}>
                                                    <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider ${getTypeColor(suggestion.type)}`}>
                                                        {getTypeLabel(suggestion.type)}
                                                    </span>
                                                    <span className={`px-2 py-0.5 rounded-md border text-[9px] font-black uppercase tracking-wider ${getPriorityColor(suggestion.priority)}`}>
                                                        {getPriorityLabel(suggestion.priority)}
                                                    </span>
                                                    {suggestion.suggestedDueDate && (
                                                        <span className="px-2 py-0.5 rounded-md border border-border bg-muted/30 text-[9px] font-bold text-muted-foreground">
                                                            📅 {new Date(suggestion.suggestedDueDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Reasoning (expandable on hover) */}
                                                {suggestion.reasoning && !compact && (
                                                    <p className="mt-2 text-[11px] text-muted-foreground leading-relaxed line-clamp-2 group-hover:line-clamp-none transition-all">
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
