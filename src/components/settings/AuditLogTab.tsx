import { useState } from 'react';
import { Filter, Search, Calendar, FileText, UserCircle, Shield, Database, Lock } from 'lucide-react';
import { useAuditLogs } from '../../hooks/useAuditLogs';

export const AuditLogTab = () => {
    const { logs, loading, error } = useAuditLogs();
    const [searchTerm, setSearchTerm] = useState('');

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case 'auth': return <Lock className="h-4 w-4 text-orange-500" />;
            case 'system': return <Database className="h-4 w-4 text-primary" />;
            case 'security': return <Shield className="h-4 w-4 text-red-500" />;
            default: return <FileText className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case 'auth': return 'bg-orange-500/10 border-orange-500/20';
            case 'system': return 'bg-primary/10 border-primary/20';
            case 'security': return 'bg-red-500/10 border-red-500/20';
            default: return 'bg-muted/50 border-border/50';
        }
    };

    const filteredLogs = logs.filter(log =>
        log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.action.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );
    if (error) return <div className="p-8 text-center text-red-500">Erro: {error}</div>;

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Filters */}
            <div className="flex flex-col md:flex-row gap-4 bg-card p-2.5 px-4 rounded-2xl border border-border shadow-sm items-center">
                <div className="relative flex-1 w-full group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar logs por usuário ou ação..."
                        className="w-full pl-12 pr-4 h-[38px] bg-muted/30 border border-border rounded-xl text-foreground focus:outline-none focus:ring-1 focus:ring-primary transition-all font-bold text-xs placeholder-muted-foreground/60"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-3 px-4 h-[38px] bg-muted/30 border border-border rounded-xl text-[10px] font-black text-muted-foreground cursor-pointer hover:bg-muted hover:text-foreground transition-all uppercase tracking-[0.15em]">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Últimos 30 dias</span>
                </div>
                <div className="flex items-center gap-3 px-4 h-[38px] bg-muted/30 border border-border rounded-xl text-[10px] font-black text-muted-foreground cursor-pointer hover:bg-muted hover:text-foreground transition-all uppercase tracking-[0.15em]">
                    <Filter className="h-4 w-4 text-primary" />
                    <span>Todas Categorias</span>
                </div>
            </div>

            {/* Timeline / List */}
            <div className="bg-muted/10 rounded-2xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border bg-muted/30">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                <Database className="h-4 w-4 text-primary" />
                            </div>
                            <h3 className="font-black text-foreground text-sm uppercase tracking-[0.2em]">Registro de Atividades</h3>
                        </div>
                        <span className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-widest">{filteredLogs.length} Entradas Encontradas</span>
                    </div>
                </div>
                <div className="divide-y divide-border">
                    {filteredLogs.map(log => (
                        <div key={log.id} className="p-4 transition-all flex items-start gap-4 hover:bg-muted/20 group relative">
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary scale-y-0 group-hover:scale-y-100 transition-transform origin-top duration-300" />
                            <div className={`p-3 rounded-xl border flex-shrink-0 ${getCategoryColor(log.category)}`}>
                                {getCategoryIcon(log.category)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start gap-4">
                                    <p className="text-sm font-black text-foreground tracking-tight group-hover:text-primary transition-colors leading-tight">{log.action}</p>
                                    <span className="flex-shrink-0 text-[10px] text-muted-foreground font-black uppercase tracking-widest bg-muted/40 px-2.5 py-1 rounded-lg border border-border">{new Date(log.timestamp).toLocaleString('pt-BR')}</span>
                                </div>
                                <p className="text-sm text-muted-foreground mt-2 font-medium leading-relaxed max-w-3xl">{log.details}</p>
                                <div className="flex items-center gap-4 mt-3 text-[10px] text-muted-foreground">
                                    <span className="flex items-center gap-2 font-black text-foreground bg-muted/40 px-2.5 py-1 rounded-lg border border-border">
                                        <UserCircle className="h-4 w-4 text-primary" /> {log.user.toUpperCase()}
                                    </span>
                                    <div className="w-1.5 h-1.5 bg-border rounded-full" />
                                    <span className="font-mono font-bold opacity-60 tracking-wider">IP: {log.ip}</span>
                                    <div className="w-1.5 h-1.5 bg-border rounded-full" />
                                    <span className="uppercase tracking-[0.15em] font-black bg-primary/5 text-primary/70 px-2.5 py-1 rounded-lg border border-primary/10">{log.category}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredLogs.length === 0 && (
                    <div className="p-12 text-center">
                        <div className="h-16 w-16 bg-muted/10 rounded-2xl flex items-center justify-center border border-border mx-auto mb-4">
                            <FileText className="h-8 w-8 text-muted-foreground opacity-30" />
                        </div>
                        <p className="text-muted-foreground font-bold text-sm uppercase tracking-widest opacity-50">Nenhum log encontrado</p>
                    </div>
                )}
            </div>
        </div>
    );
};
