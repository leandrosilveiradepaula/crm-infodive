import { useState } from 'react';
import { Brain, AlertTriangle, CheckCircle2, AlertCircle, Loader2, Sparkles, ShieldCheck, Target, RefreshCw, ChevronUp, RotateCcw } from 'lucide-react';
import { analyzeDeal, type DealAnalysis } from '@/lib/gemini';
import type { Deal } from '@/types/deal';

interface DealDoctorProps {
    deal: Deal;
    onClose?: () => void;
    onAnalysisComplete?: (analysis: DealAnalysis) => void;
}

export const DealDoctorFinal = ({ deal, onClose, onAnalysisComplete }: DealDoctorProps) => {
    const [analysis, setAnalysis] = useState<DealAnalysis | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleReset = () => {
        setAnalysis(null);
        setError(null);
    };

    const handleAnalyze = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await analyzeDeal(deal);
            console.log('[DealDoctorFinal] Analysis result:', result);
            setAnalysis(result);
            console.log('[DealDoctorFinal] Checking onAnalysisComplete:', typeof onAnalysisComplete);

            if (onAnalysisComplete) {
                console.log('[DealDoctorFinal] Calling onAnalysisComplete...');
                onAnalysisComplete(result);
                console.log('[DealDoctorFinal] Called onAnalysisComplete.');
            } else {
                console.warn('[DealDoctorFinal] onAnalysisComplete prop is missing!');
            }
        } catch (err: any) {
            setError(err.message || 'Erro ao analisar deal');
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status: DealAnalysis['status']) => {
        switch (status) {
            case 'healthy':
                return { icon: CheckCircle2, color: 'text-success-readable', bg: 'bg-success-subtle', border: 'border-success/30', label: 'Saudável' };
            case 'at_risk':
                return { icon: AlertCircle, color: 'text-warning-readable', bg: 'bg-warning-subtle', border: 'border-warning/30', label: 'Atenção' };
            case 'urgent':
                return { icon: AlertTriangle, color: 'text-destructive-readable', bg: 'bg-destructive-subtle', border: 'border-destructive/30', label: 'Urgente' };
            default:
                return { icon: CheckCircle2, color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border', label: 'Análise' };
        }
    };

    if (!analysis && !loading) {
        return (
            <div className="bg-card rounded-[var(--radius-panel)] border border-border p-6 shadow-control-ui hover:shadow-md transition-all relative group">
                <div className="flex items-start gap-5">
                    <div className="p-3 bg-info-subtle rounded-[var(--radius-panel)] border border-info/30">
                        <Brain className="h-6 w-6 text-primary" />
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                                Diagnóstico de Oportunidade
                            </h3>
                        </div>
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                            Obtenha uma análise instantânea desta oportunidade. A IA identificará riscos, calculará a saúde do negócio e sugerirá os próximos passos.
                        </p>
                        <button
                            onClick={handleAnalyze}
                            className="text-xs font-bold bg-primary text-primary-foreground px-4 py-2.5 rounded-[var(--radius-control)] hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-control-ui"
                        >
                            <Sparkles className="h-3.5 w-3.5" />
                            Iniciar Diagnóstico
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="bg-card rounded-[var(--radius-panel)] border border-border p-8 flex flex-col items-center justify-center min-h-[200px] relative">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                <h3 className="text-sm font-bold text-foreground">Analisando Pipeline...</h3>
                <p className="text-xs text-muted-foreground mt-1">Processando dados do negócio</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-destructive-subtle rounded-[var(--radius-panel)] border border-destructive/30 p-6 relative">
                <button
                    onClick={handleReset}
                    className="absolute top-4 right-4 p-2 bg-destructive-subtle text-destructive-readable rounded-[var(--radius-control)] hover:bg-destructive-subtle transition-colors text-xs font-bold"
                >
                    FECHAR
                </button>
                <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="h-5 w-5 text-destructive-readable" />
                    <h3 className="text-sm font-bold text-destructive-readable">Falha na Análise</h3>
                </div>
                <p className="text-xs text-destructive-readable mb-4">{error}</p>
                <button
                    onClick={handleAnalyze}
                    className="text-xs font-bold text-destructive-readable hover:text-destructive-readable underline decoration-destructive/40 underline-offset-4"
                >
                    Tentar Novamente
                </button>
            </div>
        );
    }

    if (!analysis) return null;

    const statusConfig = getStatusConfig(analysis.status);
    const StatusIcon = statusConfig.icon;

    return (
        <div className="bg-card rounded-[var(--radius-panel)] border border-border shadow-control-ui overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-6 border-b border-border bg-muted/50/20">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-[var(--radius-panel)] ${statusConfig.bg} border ${statusConfig.border} flex-shrink-0`}>
                            <StatusIcon className={`h-5 w-5 ${statusConfig.color}`} />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 h-9">
                                <h3 className="text-lg font-bold text-foreground whitespace-nowrap">
                                    Relatório AI
                                </h3>
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Score:</span>
                                <span className={`text-base font-bold ${analysis.healthScore >= 70 ? 'text-success-readable' : analysis.healthScore >= 40 ? 'text-warning-readable' : 'text-destructive-readable'
                                    }`}>
                                    {analysis.healthScore}/100
                                </span>
                                <span className={`ml-2 px-2 py-0.5 rounded-full ds-type-metadata font-bold border uppercase tracking-wide whitespace-nowrap ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                                    {statusConfig.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-1">
                        <button
                            onClick={handleAnalyze}
                            className="flex items-center justify-center w-9 h-9 bg-card hover:bg-muted/50 border border-border rounded-[var(--radius-control)] text-muted-foreground hover:text-foreground transition-all shadow-control-ui"
                            title="Atualizar"
                        >
                            <RotateCcw className="h-4 w-4" />
                            <span className="sr-only">Atualizar</span>
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex items-center justify-center w-9 h-9 bg-card hover:bg-muted/50 border border-border rounded-[var(--radius-control)] text-muted-foreground hover:text-foreground transition-all shadow-control-ui"
                            title="Minimizar"
                        >
                            <ChevronUp className="h-5 w-5" />
                            <span className="sr-only">Minimizar</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Content - Identical to V2 */}
            <div className="p-6 space-y-8">
                {/* Insights */}
                <div>
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                        <Sparkles className="h-3.5 w-3.5 text-foreground" />
                        Insights
                    </h4>
                    <div className="grid gap-3">
                        {analysis.insights.map((insight, i) => (
                            <div key={i} className="flex gap-3 p-3 bg-muted/50 rounded-[var(--radius-control)] border border-border">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-info flex-shrink-0" />
                                <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Mitigation */}
                    <div>
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-success-readable" />
                            Mitigação
                        </h4>
                        <ul className="space-y-3">
                            {analysis.recommendations.map((rec, i) => (
                                <li key={i} className="flex gap-2.5 items-start text-sm text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-success-readable mt-0.5 flex-shrink-0" />
                                    <span>{rec}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Next Steps */}
                    <div>
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                            <Target className="h-3.5 w-3.5 text-primary" />
                            Próximos Passos
                        </h4>
                        <ul className="space-y-2">
                            {analysis.nextSteps.map((step, i) => (
                                <li key={i} className="flex items-center gap-3 p-2 rounded-[var(--radius-control)] hover:bg-muted/50 transition-colors">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-info-subtle dark:bg-info-subtle text-foreground dark:text-foreground ds-type-metadata font-bold">
                                        {i + 1}
                                    </span>
                                    <span className="text-sm text-foreground font-medium">{step}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};
