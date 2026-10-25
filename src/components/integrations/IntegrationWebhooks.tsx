import { useState } from 'react';
import { useWebhooks } from '../../hooks/useWebhooks';
import { Plus, Trash2, Activity, Globe, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const IntegrationWebhooks = () => {
    const { webhooks, loading, error, addWebhook, deleteWebhook } = useWebhooks();
    const [isAdding, setIsAdding] = useState(false);

    const handleAdd = async () => {
        const url = prompt('URL do Webhook (ex: https://api.empresa.com/webhook):');
        if (url) {
            setIsAdding(true);
            await addWebhook({
                url,
                events: ['deal.created', 'deal.updated'],
                status: 'active'
            });
            setIsAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm('Deseja remover este webhook?')) {
            await deleteWebhook(id);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return 'Nunca disparado';
        return new Date(dateStr).toLocaleString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (loading) return <div className="h-64 flex items-center justify-center"><LoadingSpinner /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div>
                    <h3 className="font-bold text-foreground text-lg">Webhooks</h3>
                    <p className="text-sm text-muted-foreground">Receba notificações de eventos em tempo real em seus sistemas.</p>
                </div>
                <button
                    onClick={handleAdd}
                    disabled={isAdding}
                    className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-blue-900/10 flex items-center gap-2 disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" /> {isAdding ? 'Adicionando...' : 'Adicionar Endpoint'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            <div className="grid gap-4">
                {webhooks.map(hook => (
                    <div key={hook.id} className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:border-primary/30 hover:shadow-md transition-all group">
                        <div className="flex items-start gap-4 flex-1 min-w-0">
                            <div className={`p-3 rounded-xl shrink-0 ${hook.status === 'active' ? 'bg-teal-50 text-teal-600' : 'bg-muted/50 text-muted-foreground'}`}>
                                <Globe className="h-6 w-6" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-3 mb-2 flex-wrap">
                                    <h4 className="font-bold text-foreground truncate max-w-full" title={hook.url}>{hook.url}</h4>
                                    <span className={`text-xs uppercase font-bold px-2 py-0.5 rounded-full border ${hook.status === 'active' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-muted/50 text-muted-foreground border-border'}`}>
                                        {hook.status}
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {hook.events.map(event => (
                                        <span key={event} className="text-xs font-bold bg-muted/50 text-muted-foreground px-2 py-0.5 rounded border border-border/50 uppercase tracking-wider">
                                            {event}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between md:justify-end gap-8 border-t md:border-t-0 pt-4 md:pt-0">
                            <div className="text-left md:text-right">
                                <p className="text-xs font-bold text-muted-foreground uppercase mb-1">Último disparo</p>
                                <p className="text-sm font-semibold text-foreground flex items-center gap-1.5 md:justify-end">
                                    <Activity className={`h-3.5 w-3.5 ${hook.status === 'active' ? 'text-green-500' : 'text-muted-foreground'}`} />
                                    {formatDate(hook.last_triggered)}
                                </p>
                            </div>
                            <button
                                onClick={() => handleDelete(hook.id)}
                                className="p-2 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                                title="Remover Webhook"
                            >
                                <Trash2 className="h-5 w-5" />
                            </button>
                        </div>
                    </div>
                ))}

                {webhooks.length === 0 && (
                    <div className="bg-muted/50/50 border-2 border-dashed border-border rounded-2xl p-12 text-center text-muted-foreground">
                        <Globe className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="font-medium text-sm">Nenhum webhook configurado.</p>
                        <p className="text-xs mt-1">Envie atualizações em tempo real para seu servidor.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
