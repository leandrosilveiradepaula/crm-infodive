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
    manager: 'bg-info/15 text-info border-info/20',
    sales: 'bg-success/15 text-success-readable border-success/20',
    support: 'bg-warning/15 text-warning-readable border-warning/20',
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
                        <div className="p-2.5 bg-primary/10 rounded-[var(--radius-panel)]">
                            <Users className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h3 className="text-section-title font-black text-foreground tracking-tight">Equipe & Acessos</h3>
                            <p className="text-metadata-ui text-muted-foreground font-medium">Gerencie quem tem acesso à conta e suas permissões.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setInviteOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-white font-bold px-4 h-11 rounded-[var(--radius-panel)] shadow-card-ui shadow-primary/20 transition-all hover:scale-[1.02]"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Novo Membro
                        </Button>
                        <Button variant="ghost" size="icon" onClick={fetchUsers} className="text-muted-foreground hover:bg-muted/50 rounded-[var(--radius-panel)] h-11 w-11" disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : errorMsg ? (
                        <div className="flex flex-col items-center gap-3 p-8 text-center bg-muted/10 rounded-[var(--radius-panel)] border border-border">
                            <AlertCircle className="h-8 w-8 text-destructive-readable" />
                            <p className="text-body-ui font-bold text-destructive-readable">Erro ao carregar usuários</p>
                            <p className="text-metadata-ui text-muted-foreground">{errorMsg}</p>
                            <Button variant="outline" size="sm" onClick={fetchUsers}>Tentar novamente</Button>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 p-12 text-center bg-muted/10 rounded-[var(--radius-panel)] border border-border border-dashed">
                            <p className="text-body-ui text-muted-foreground">Nenhum usuário encontrado.</p>
                            <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)} className="text-primary border-primary/30 mt-2">
                                <UserPlus className="h-4 w-4 mr-2" /> Convidar primeiro usuário
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-3">
                            {users.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-4 bg-card rounded-[var(--radius-panel)] border border-border hover:border-primary/30 transition-all group">
                                    <div className="flex items-center gap-4">
                                        <div className="relative">
                                            <Avatar className="h-12 w-12 border border-border group-hover:border-primary/30 transition-all">
                                                <AvatarFallback className="bg-primary/10 text-primary font-black text-body-ui">
                                                    {user.name?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            {user.id === currentUser?.id && (
                                                <div className="absolute -bottom-1 -right-1 h-4 w-4 bg-success rounded-full border-2 border-background flex items-center justify-center" title="Você">
                                                    <div className="h-1 w-1 bg-white rounded-full animate-pulse" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <p className="text-body-ui font-black text-foreground tracking-tight">{user.name}</p>
                                                <div className="flex flex-wrap gap-1.5 mt-0.5">
                                                    {(user.roles && user.roles.length > 0 ? user.roles : [user.role]).map((role, idx) => (
                                                        <Badge key={idx} className={`text-metadata-ui border font-black uppercase tracking-widest px-2 py-0.5 rounded-[var(--radius-control)] ${ROLE_COLORS[role] || ROLE_COLORS.sales}`}>
                                                            {ROLE_LABELS[role] || role}
                                                        </Badge>
                                                    ))}
                                                    {user.status === 'inactive' && (
                                                        <Badge className="text-metadata-ui border font-black uppercase tracking-widest px-2 py-0.5 rounded-[var(--radius-control)] bg-destructive/10 text-destructive-readable border-destructive/20">
                                                            Arquivado
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-metadata-ui text-muted-foreground font-medium mt-1">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="hidden lg:flex flex-col items-end gap-1">
                                            <p className="text-metadata-ui uppercase font-bold text-muted-foreground tracking-widest">Último Acesso</p>
                                            <div className="flex items-center gap-1.5 text-metadata-ui text-foreground">
                                                <Clock className="h-3 w-3 text-muted-foreground" />
                                                <span>{user.lastLogin}</span>
                                            </div>
                                        </div>
                                        <div className="w-px h-8 bg-border hidden md:block" />
                                        <div className="flex items-center gap-2">
                                            <Button 
                                                variant="outline" 
                                                size="sm" 
                                                className="h-9 text-metadata-ui font-bold border-border hover:bg-muted text-foreground transition-colors px-3 flex items-center"
                                                onClick={() => setEditingUser(user)}
                                                disabled={user.status === 'inactive'}
                                            >
                                                <Edit2 className="h-3.5 w-3.5 mr-2" />
                                                Editar
                                            </Button>
                                            
                                            <Button 
                                                variant="ghost" 
                                                size="icon" 
                                                className="h-9 w-9 rounded-[var(--radius-control)] text-muted-foreground hover:text-destructive-readable hover:bg-destructive/10 transition-all"
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
