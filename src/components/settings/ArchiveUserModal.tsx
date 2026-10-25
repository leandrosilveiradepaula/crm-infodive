import React, { useState } from 'react';
import { X, AlertTriangle, ChevronDown, UserMinus, ShieldCheck } from 'lucide-react';
import { type UserProfile } from '../../hooks/useUsers';
import { archiveUserAction } from '@/app/(dashboard)/settings/users-actions';
import { toast } from 'sonner';

interface ArchiveUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile | null;
    otherUsers: UserProfile[];
    onSuccess: () => void;
}

export const ArchiveUserModal = ({ isOpen, onClose, user, otherUsers, onSuccess }: ArchiveUserModalProps) => {
    const [newOwnerId, setNewOwnerId] = useState<string>('none');
    const [loading, setLoading] = useState(false);

    if (!isOpen || !user) return null;

    const handleArchive = async () => {
        setLoading(true);
        try {
            const result = await archiveUserAction(user.id, newOwnerId);
            if (result.success) {
                toast.success('Usuário arquivado com sucesso!');
                onSuccess();
                onClose();
            } else {
                toast.error('Erro ao arquivar usuário: ' + result.error);
            }
        } catch (error) {
            toast.error('Erro de conexão ao arquivar usuário.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative bg-card border border-border rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
                
                {/* Header decorativo perigo */}
                <div className="h-1.5 bg-gradient-to-r from-amber-500 via-red-500 to-amber-500"></div>

                <div className="p-6">
                    <div className="flex justify-between items-start mb-6">
                        <div className="p-3 bg-amber-500/10 rounded-2xl border border-amber-500/20">
                            <UserMinus className="h-6 w-6 text-amber-500" />
                        </div>
                        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors p-1">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="space-y-2 mb-8">
                        <h3 className="text-xl font-bold text-foreground tracking-tight">Arquivar Membro da Equipe</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                            Você está prestes a desativar o acesso de <span className="text-foreground font-bold">{user.name}</span>. 
                            O histórico de vendas será preservado.
                        </p>
                    </div>

                    <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-4 mb-6">
                        <div className="flex gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                            <div className="space-y-1">
                                <p className="text-xs font-bold text-foreground tracking-wide uppercase">Transferir Oportunidades</p>
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    Deseja mover as oportunidades ativas deste usuário para outro vendedor agora?
                                </p>
                            </div>
                        </div>

                        <div className="relative">
                            <select 
                                value={newOwnerId}
                                onChange={(e) => setNewOwnerId(e.target.value)}
                                className="w-full pl-4 pr-10 py-2.5 bg-background border border-border rounded-xl text-sm appearance-none focus:ring-2 focus:ring-primary/50 outline-none transition-all cursor-pointer font-medium"
                            >
                                <option value="none">Não transferir (deixar órfãs)</option>
                                {otherUsers
                                    .filter(u => u.id !== user.id && u.status === 'active')
                                    .map(u => (
                                        <option key={u.id} value={u.id}>Transferir para {u.name}</option>
                                    ))
                                }
                            </select>
                            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                        </div>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={handleArchive}
                            disabled={loading}
                            className="w-full bg-red-600 hover:bg-red-700 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <>
                                    Confirmar Arquivamento
                                    <ShieldCheck className="h-4 w-4" />
                                </>
                            )}
                        </button>
                        <button
                            onClick={onClose}
                            className="w-full bg-muted border border-border py-3 rounded-xl font-black text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground transition-all"
                        >
                            Cancelar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const Loader2 = ({ className }: { className?: string }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
);
