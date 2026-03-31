import { useState, useEffect } from 'react';
import { Plus, Search, Mail, Edit2, ShieldAlert, Loader2 } from 'lucide-react';
import { getUsers, updateUserProfile } from '@/app/(dashboard)/settings/actions';
import type { UserProfile } from '../../hooks/useUsers';
import { InviteUserModal } from './InviteUserModal';
import { EditUserModal } from './EditUserModal';

export const UsersTab = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showInviteModal, setShowInviteModal] = useState(false);
    const [editingUser, setEditingUser] = useState<UserProfile | null>(null);

    useEffect(() => {
        setLoading(true);
        getUsers()
            .then(({ users: data, error: err }) => {
                if (err) setError(err);
                else setUsers(data as unknown as UserProfile[]);
            })
            .finally(() => setLoading(false));
    }, []);

    const handleUpdateUser = async (userId: string, updates: Partial<UserProfile>): Promise<boolean> => {
        const result = await updateUserProfile(userId, {
            name: updates.name,
            phone: updates.phone,
            email: updates.email,
            role: updates.role,
        });
        if (result.success) {
            // Refresh list
            const { users: fresh } = await getUsers();
            setUsers(fresh as unknown as UserProfile[]);
        }
        return result.success;
    };


    const filteredUsers = users.filter(user =>
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role: string) => {
        switch (role) {
            case 'admin': return 'bg-primary/10 text-primary border-primary/20';
            case 'manager': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
            case 'sales': return 'bg-orange-500/10 text-orange-400 border-orange-500/20';
            case 'support': return 'bg-teal-500/10 text-teal-400 border-teal-500/20';
            default: return 'bg-muted/50 text-muted-foreground border-border/50';
        }
    };

    if (loading) return (
        <div className="flex justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
    );

    if (error) return <div className="p-8 text-center text-red-500">Erro: {error}</div>;

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Header Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-card p-4 rounded-2xl border border-border shadow-xl">
                <div className="relative w-full sm:w-80 group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                    <input
                        type="text"
                        placeholder="Buscar usuários..."
                        className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all font-medium"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
                <button
                    onClick={() => setShowInviteModal(true)}
                    className="w-full sm:w-auto bg-primary text-white px-6 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary transition-all shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98]"
                >
                    <Plus className="h-4 w-4" /> Novo Usuário
                </button>
            </div>

            {/* Users Table */}
            <div className="bg-card rounded-2xl shadow-xl border border-border overflow-hidden relative">
                {/* Cyberpunk decoration */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full -mr-24 -mt-24 blur-3xl pointer-events-none"></div>

                <div className="overflow-x-auto relative z-10">
                    <table className="w-full">
                        <thead className="bg-muted/50 border-b border-border">
                            <tr>
                                <th className="text-left py-3 px-6 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Usuário</th>
                                <th className="text-left py-3 px-6 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Função</th>
                                <th className="text-left py-3 px-6 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Status</th>
                                <th className="text-right py-3 px-6 text-[9px] font-black text-muted-foreground uppercase tracking-widest">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="transition-all hover:bg-muted/50 group">
                                    <td className="py-3 px-6 whitespace-nowrap">
                                        <div className="flex items-center gap-3">
                                            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-800 dark:to-black flex items-center justify-center text-foreground font-black text-xs border border-border shadow-lg group-hover:scale-110 transition-transform">
                                                {user.avatar}
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-bold text-foreground leading-tight">{user.name}</p>
                                                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-tight opacity-70">
                                                    <Mail className="h-2.5 w-2.5" /> {user.email}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-6">
                                        <span className={`px-2.5 py-0.5 rounded-lg text-[9px] font-black border capitalize flex items-center w-fit gap-1.5 tracking-wider shadow-sm ${getRoleBadge(user.role)}`}>
                                            <ShieldAlert className="h-2.5 w-2.5" />
                                            {user.role}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6">
                                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${user.status === 'active' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${user.status === 'active' ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-red-400'}`}></span>
                                            {user.status === 'active' ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 text-right">
                                        <button
                                            onClick={() => setEditingUser(user)}
                                            className="text-muted-foreground hover:text-primary p-1.5 rounded-lg hover:bg-primary/10 transition-all"
                                            title="Editar Usuário"
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="p-16 text-center">
                        <div className="h-20 w-20 bg-muted/20 rounded-full flex items-center justify-center border border-border/50 shadow-2xl mx-auto mb-6">
                            <Search className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground font-bold text-lg">Nenhum usuário encontrado</p>
                        <p className="text-muted-foreground/70 text-sm mt-1">Tente buscar por outro termo ou adicione um novo.</p>
                    </div>
                )}
            </div>

            {/* Invite Modal */}
            <InviteUserModal
                isOpen={showInviteModal}
                onClose={() => setShowInviteModal(false)}
            />

            {/* Edit User Modal */}
            <EditUserModal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                user={editingUser}
                onSave={handleUpdateUser}
            />
        </div>
    );
};
