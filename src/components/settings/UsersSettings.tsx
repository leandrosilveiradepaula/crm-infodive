'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUsers, updateUserRole, archiveUserAction } from '@/app/(dashboard)/settings/actions';
import { InviteUserModal } from './InviteUserModal';
import { ArchiveUserModal } from './ArchiveUserModal';
import { Button } from '@/components/ui/button';

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Shield, Clock, AlertCircle, UserPlus, Users, UserMinus, Edit2 } from 'lucide-react';
import { toast } from 'sonner';
import { EditUserModal } from './EditUserModal';
import { updateUserProfile } from '@/app/(dashboard)/settings/actions';

interface UserRow {
    id: string;
    name: string;
    email: string;
    role: string;
    roles?: string[];
    status?: string;
    lastLogin: string;
    avatar: string;
}

const ROLE_LABELS: Record<string, string> = {
    admin: 'Administrador',
    manager: 'Gerente',
    sales: 'Vendedor',
    support: 'Suporte',
};

const ROLE_COLORS: Record<string, string> = {
    admin: 'bg-primary/15 text-primary border-primary/20',
    manager: 'bg-teal-500/15 text-teal-400 border-teal-500/20',
    sales: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
    support: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
};

export function UsersSettings() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const [archivingUser, setArchivingUser] = useState<UserRow | null>(null);
    const [editingUser, setEditingUser] = useState<UserRow | null>(null);
    const { user: currentUser, profile: currentProfile } = useAuth();

    const fetchUsers = async () => {
        setLoading(true);
        setErrorMsg(null);
        try {
            const result = await getUsers();
            if (result.error) setErrorMsg(result.error);
            else setUsers(result.users as UserRow[]);
        } catch (err: any) {
            setErrorMsg(err.message || 'Erro ao carregar usuários.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const handleSave = async (userId: string, data: any) => {
        const result = await updateUserProfile(userId, {
            full_name: data.name,
            phone: data.phone,
            email: data.email,
            roles: data.roles
        } as any);

        if (result.success) {
            toast.success('Usuário atualizado com sucesso!');
            fetchUsers();
            return true;
        } else {
            toast.error('Erro ao atualizar: ' + result.error);
            return false;
        }
    };

    return (
        <>
            <InviteUserModal
                isOpen={inviteOpen}
                onClose={() => setInviteOpen(false)}
                inviterOrgId={currentProfile?.organization_id}
            />

            <div className="space-y-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-primary/10 rounded-xl">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-foreground tracking-tight">Equipe & Acessos</h3>
                            <p className="text-xs text-muted-foreground font-medium">Gerencie quem tem acesso à conta e suas permissões.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setInviteOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-white font-bold px-4 h-11 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Novo Membro
                        </Button>
                        <Button variant="ghost" size="icon" onClick={fetchUsers} className="text-muted-foreground hover:bg-muted/50 rounded-xl h-11 w-11" disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : errorMsg ? (
                        <div className="flex flex-col items-center gap-3 p-8 text-center bg-muted/10 rounded-2xl border border-border">
                            <AlertCircle className="h-8 w-8 text-red-400" />
                            <p className="text-sm font-bold text-red-400">Erro ao carregar usuários</p>
                            <p className="text-xs text-muted-foreground">{errorMsg}</p>
                            <Button variant="outline" size="sm" onClick={fetchUsers}>Tentar novamente</Button>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 p-12 text-center bg-muted/10 rounded-2xl border border-border border-dashed">
                            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
                            <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)} className="text-primary border-primary/30 mt-2">
                                <UserPlus className="h-4 w-4 mr-2" /> Convidar primeiro usuário
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {users.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-card rounded-2xl border border-border hover:border-primary/30 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar className="h-12 w-12 border border-border group-hover:border-primary/30 transition-all">
                                                <AvatarFallback className="bg-primary/10 text-primary font-black text-sm">
                                                    {user.name?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            {user.id === currentUser?.id && (
                                                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-emerald-500 rounded-full border-2 border-background flex items-center justify-center" title="Você">
                                                    <div className="h-1 w-1 bg-white rounded-full animate-pulse" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-sm font-black text-foreground tracking-tight">{user.name}</p>
                                                <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                    {(user.roles && user.roles.length > 0 ? user.roles : [user.role]).map((role, idx) => (
                                                        <Badge key={idx} className={`text-[9px] border font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${ROLE_COLORS[role] || ROLE_COLORS.sales}`}>
                                                            {ROLE_LABELS[role] || role}
                                                        </Badge>
                                                    ))}
                                                    {user.status === 'inactive' && (
                                                        <Badge className="text-[9px] border font-black uppercase tracking-widest px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 border-red-500/20">
                                                            Arquivado
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-xs text-muted-foreground font-medium mt-1">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="hidden lg:flex flex-col items-end gap-1">
                                            <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-widest">Último Acesso</p>
                                            <div className="flex items-center gap-1.5 text-xs text-foreground">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                <span>{user.lastLogin}</span>
                                            </div>
                                        </div>
                                        <div className="w-px h-8 bg-border hidden md:block" />
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-9 text-xs font-bold border-border hover:bg-muted text-foreground transition-colors px-3 flex items-center"
                                                onClick={() => setEditingUser(user)}
                                                disabled={user.status === 'inactive'}
                                            >
                                                <Edit2 className="h-3.5 w-3.5 mr-2" />
                                                Editar
                                            </Button>
                                            
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                onClick={() => setArchivingUser(user)}
                                                disabled={user.id === currentUser?.id || user.status === 'inactive'}
                                                title="Arquivar Usuário"
                                            >
                                                <UserMinus className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <ArchiveUserModal
                isOpen={!!archivingUser}
                onClose={() => setArchivingUser(null)}
                user={archivingUser as any}
                otherUsers={users as any}
                onSuccess={fetchUsers}
            />

            <EditUserModal
                isOpen={!!editingUser}
                onClose={() => setEditingUser(null)}
                user={editingUser as any}
                onSave={handleSave}
            />
        </>
    );
}
