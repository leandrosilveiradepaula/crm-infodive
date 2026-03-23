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
                return { icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Saudável' };
            case 'at_risk':
                return { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Atenção' };
            case 'urgent':
                return { icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Urgente' };
            default:
                return { icon: CheckCircle2, color: 'text-muted-foreground', bg: 'bg-muted/50', border: 'border-border', label: 'Análise' };
        }
    };

    if (!analysis && !loading) {
        return (
            <div className="bg-card rounded-xl border border-border p-6 shadow-sm hover:shadow-md transition-all relative group">
                <div className="flex items-start gap-5">
                    <div className="p-3 bg-blue-50 rounded-xl border border-blue-100">
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
                            className="text-xs font-bold bg-primary text-white px-4 py-2.5 rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 shadow-sm"
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
            <div className="bg-card rounded-xl border border-border p-8 flex flex-col items-center justify-center min-h-[200px] relative">
                <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" />
                <h3 className="text-sm font-bold text-foreground">Analisando Pipeline...</h3>
                <p className="text-xs text-muted-foreground mt-1">Processando dados do negócio</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-rose-50 rounded-xl border border-rose-100 p-6 relative">
                <button
                    onClick={handleReset}
                    className="absolute top-4 right-4 p-2 bg-rose-100 text-rose-600 rounded-lg hover:bg-rose-200 transition-colors text-xs font-bold"
                >
                    FECHAR
                </button>
                <div className="flex items-center gap-3 mb-2">
                    <AlertCircle className="h-5 w-5 text-rose-600" />
                    <h3 className="text-sm font-bold text-rose-700">Falha na Análise</h3>
                </div>
                <p className="text-xs text-rose-600 mb-4">{error}</p>
                <button
                    onClick={handleAnalyze}
                    className="text-xs font-bold text-rose-700 hover:text-rose-800 underline decoration-rose-300 underline-offset-4"
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
        <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden animate-in fade-in duration-500">
            {/* Header */}
            <div className="p-6 border-b border-border bg-muted/50/20">
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className={`p-2 rounded-xl ${statusConfig.bg} border ${statusConfig.border} flex-shrink-0`}>
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
                                <span className={`text-base font-bold ${analysis.healthScore >= 70 ? 'text-emerald-600' : analysis.healthScore >= 40 ? 'text-amber-600' : 'text-rose-600'
                                    }`}>
                                    {analysis.healthScore}/100
                                </span>
                                <span className={`ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wide whitespace-nowrap ${statusConfig.bg} ${statusConfig.color} ${statusConfig.border}`}>
                                    {statusConfig.label}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0 ml-1">
                        <button
                            onClick={handleAnalyze}
                            className="flex items-center justify-center w-9 h-9 bg-card hover:bg-muted/50 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-all shadow-sm"
                            title="Atualizar"
                        >
                            <RotateCcw className="h-4 w-4" />
                            <span className="sr-only">Atualizar</span>
                        </button>
                        <button
                            onClick={handleReset}
                            className="flex items-center justify-center w-9 h-9 bg-card hover:bg-muted/50 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-all shadow-sm"
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
                        <Sparkles className="h-3.5 w-3.5 text-blue-500" />
                        Insights
                    </h4>
                    <div className="grid gap-3">
                        {analysis.insights.map((insight, i) => (
                            <div key={i} className="flex gap-3 p-3 bg-muted/50 rounded-lg border border-border">
                                <div className="mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 flex-shrink-0" />
                                <p className="text-sm text-muted-foreground leading-relaxed">{insight}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Mitigation */}
                    <div>
                        <h4 className="text-xs font-bold text-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
                            <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                            Mitigação
                        </h4>
                        <ul className="space-y-3">
                            {analysis.recommendations.map((rec, i) => (
                                <li key={i} className="flex gap-2.5 items-start text-sm text-muted-foreground">
                                    <CheckCircle2 className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
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
                                <li key={i} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors">
                                    <span className="flex items-center justify-center w-5 h-5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-[10px] font-bold">
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
