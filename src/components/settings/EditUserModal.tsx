import React, { useState, useEffect } from 'react';
import { X, Save, AlertCircle, Plus } from 'lucide-react';
import { type UserProfile } from '../../hooks/useUsers';
import { RoleSelect } from './RoleSelect';

interface EditUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    user: UserProfile | null;
    onSave: (userId: string, data: Partial<UserProfile>) => Promise<boolean>;
}

export const EditUserModal = ({ isOpen, onClose, user, onSave }: EditUserModalProps) => {
    const [formData, setFormData] = useState<Partial<UserProfile>>({});
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name,
                phone: user.phone,
                role: user.role,
                roles: user.roles || (user.role ? [user.role] : []),
                monthly_goal: user.monthly_goal,
                commission_rate: user.commission_rate
            });
        }
    }, [user]);

    if (!isOpen || !user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        const success = await onSave(user.id, formData);

        setLoading(false);
        if (success) {
            onClose();
        } else {
            setError('Falha ao atualizar usuário. Tente novamente.');
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="relative bg-card border border-border rounded-2xl shadow-xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
                <div className="px-6 py-4 border-b border-border flex justify-between items-center">
                    <h3 className="text-lg font-bold text-foreground">Editar Usuário</h3>
                    <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    {error && (
                        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-lg flex items-center gap-2">
                            <AlertCircle className="h-4 w-4" />
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-1">Nome Completo</label>
                        <input
                            type="text"
                            required
                            className="w-full px-4 py-2 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            value={formData.name || ''}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-1">Email</label>
                        <input
                            type="email"
                            required
                            className="w-full px-4 py-2 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            value={formData.email || ''}
                            onChange={e => setFormData({ ...formData, email: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-1">Telefone (WhatsApp)</label>
                        <input
                            type="tel"
                            placeholder="ex: 5511999999999"
                            className="w-full px-4 py-2 bg-background border border-border rounded-xl text-foreground focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all"
                            value={formData.phone || ''}
                            onChange={e => setFormData({ ...formData, phone: e.target.value })}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-bold text-muted-foreground mb-2">Funções de Acesso (Roles)</label>
                        <RoleSelect
                            value={formData.roles || []}
                            onChange={(roles) => setFormData({ ...formData, roles: roles as any })}
                        />
                    </div>

                    {/* Advanced Commission Rules Removed as per request */}

                    <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-muted-foreground font-medium hover:bg-muted rounded-lg transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-6 py-2 bg-primary text-white font-bold rounded-lg hover:bg-primary transition-all shadow-lg shadow-blue-500/20 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Salvando...' : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Salvar Alterações
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};
