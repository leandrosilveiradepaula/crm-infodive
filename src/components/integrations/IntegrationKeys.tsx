import { useState } from 'react';
import { useApiKeys } from '../../hooks/useApiKeys';
import { Key, Plus, Trash2, Copy, Check, AlertCircle, ShieldAlert } from 'lucide-react';
import { LoadingSpinner } from '../common/LoadingSpinner';

export const IntegrationKeys = () => {
    const { keys, loading, error, addKey, revokeKey, deleteKey } = useApiKeys();
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    const handleCopy = (prefix: string, id: string) => {
        const fullToken = `${prefix}••••••••`;
        navigator.clipboard.writeText(fullToken);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    const handleCreate = async () => {
        const name = prompt('Nome da Chave (ex: Website Produção):');
        if (name) {
            setIsCreating(true);
            await addKey(name);
            setIsCreating(false);
        }
    };

    const handleDelete = async (id: string, status: string) => {
        if (status === 'active') {
            if (confirm('Deseja revogar esta chave? Ela não poderá mais ser usada.')) {
                await revokeKey(id);
            }
        } else {
            if (confirm('Deseja excluir permanentemente este registro?')) {
                await deleteKey(id);
            }
        }
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
    };

    if (loading) return <div className="h-64 flex items-center justify-center"><LoadingSpinner /></div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-card p-6 rounded-2xl border border-border shadow-sm">
                <div>
                    <h3 className="font-bold text-foreground text-lg">Chaves de API</h3>
                    <p className="text-sm text-muted-foreground">Gerencie tokens de acesso para seus scripts e integrações.</p>
                </div>
                <button
                    onClick={handleCreate}
                    disabled={isCreating}
                    className="bg-primary text-white px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-primary/90 transition-all shadow-lg shadow-blue-900/10 flex items-center gap-2 disabled:opacity-50"
                >
                    <Plus className="h-4 w-4" /> {isCreating ? 'Criando...' : 'Nova Chave'}
                </button>
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 p-4 rounded-xl flex items-center gap-3 text-red-600">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">{error}</span>
                </div>
            )}

            <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-muted/50/50 border-b border-border/50">
                            <tr>
                                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-widest">Nome</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-widest">Token (Prefixo)</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-widest">Status</th>
                                <th className="text-left py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-widest">Criado em</th>
                                <th className="text-right py-4 px-6 text-xs font-bold text-muted-foreground uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-5">
                            {keys.map(key => (
                                <tr key={key.id} className="hover:bg-muted/50/50 transition-colors group">
                                    <td className="py-5 px-6">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${key.status === 'active' ? 'bg-blue-50 text-primary' : 'bg-muted/50 text-muted-foreground'}`}>
                                                <Key className="h-4 w-4" />
                                            </div>
                                            <span className={`font-bold text-sm ${key.status === 'active' ? 'text-foreground' : 'text-muted-foreground line-through'}`}>{key.name}</span>
                                        </div>
                                    </td>
                                    <td className="py-5 px-6 font-mono text-xs text-muted-foreground">
                                        {key.token_prefix}••••••••
                                    </td>
                                    <td className="py-5 px-6">
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase border ${key.status === 'active' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${key.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></span>
                                            {key.status === 'active' ? 'Ativo' : 'Revogado'}
                                        </span>
                                    </td>
                                    <td className="py-5 px-6 text-sm text-muted-foreground">{formatDate(key.created_at)}</td>
                                    <td className="py-5 px-6 text-right">
                                        <div className="flex justify-end gap-1">
                                            {key.status === 'active' && (
                                                <button
                                                    onClick={() => handleCopy(key.token_prefix, key.id)}
                                                    className="p-2 text-muted-foreground hover:text-primary hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Copiar Prefixo"
                                                >
                                                    {copiedId === key.id ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleDelete(key.id, key.status)}
                                                className={`p-2 text-muted-foreground hover:bg-red-50 transition-all rounded-lg ${key.status === 'active' ? 'hover:text-amber-600' : 'hover:text-red-600'}`}
                                                title={key.status === 'active' ? 'Revogar Chave' : 'Excluir Permanentemente'}
                                            >
                                                {key.status === 'active' ? <ShieldAlert className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {keys.length === 0 && (
                    <div className="p-12 text-center text-muted-foreground">
                        <Key className="h-10 w-10 mx-auto mb-3 opacity-20" />
                        <p className="font-medium text-sm">Nenhuma chave de API encontrada.</p>
                        <p className="text-xs mt-1">Crie sua primeira chave para começar a integrar.</p>
                    </div>
                )}
            </div>
        </div>
    );
};
