'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { getUsers, updateUserRole } from '@/app/(dashboard)/settings/actions';
import { InviteUserModal } from './InviteUserModal';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Shield, Clock, AlertCircle, UserPlus, Users } from 'lucide-react';
import { toast } from 'sonner';

interface UserRow {
    id: string;
    name: string;
    email: string;
    role: string;
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
    manager: 'bg-purple-500/15 text-purple-400 border-purple-500/20',
    sales: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/20',
    support: 'bg-orange-500/15 text-orange-400 border-orange-500/20',
};

export function UsersSettings() {
    const [users, setUsers] = useState<UserRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const [inviteOpen, setInviteOpen] = useState(false);
    const { user: currentUser } = useAuth();

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

    const handleRoleChange = async (userId: string, newRole: string) => {
        setUsers(prev => prev.map(u => u.id === userId ? { ...u, role: newRole } : u));
        const result = await updateUserRole(userId, newRole);
        if (result.success) {
            toast.success('Função atualizada!');
        } else {
            toast.error('Erro: ' + result.error);
            fetchUsers();
        }
    };

    return (
        <>
            <InviteUserModal
                isOpen={inviteOpen}
                onClose={() => setInviteOpen(false)}
                inviterOrgId={(currentUser as any)?.user_metadata?.organization_id}
            />

            <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden shadow-xl border-none">
                <CardHeader className="flex flex-row items-center justify-between p-8 bg-muted/30">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20 shadow-lg shadow-primary/5">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight">Equipe & Acessos</CardTitle>
                            <CardDescription className="text-muted-foreground font-medium">Gerencie quem tem acesso à conta e suas permissões.</CardDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            onClick={() => setInviteOpen(true)}
                            className="bg-primary hover:bg-primary/90 text-white font-black uppercase text-[10px] tracking-widest px-6 h-11 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.02]"
                        >
                            <UserPlus className="h-4 w-4 mr-2" />
                            Novo Membro
                        </Button>
                        <Button variant="ghost" size="icon" onClick={fetchUsers} className="text-muted-foreground hover:bg-muted/50 rounded-xl h-11 w-11" disabled={loading}>
                            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        </Button>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    {loading ? (
                        <div className="flex justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
                    ) : errorMsg ? (
                        <div className="flex flex-col items-center gap-3 p-8 text-center">
                            <AlertCircle className="h-8 w-8 text-red-400" />
                            <p className="text-sm font-bold text-red-400">Erro ao carregar usuários</p>
                            <p className="text-xs text-muted-foreground">{errorMsg}</p>
                            <Button variant="outline" size="sm" onClick={fetchUsers}>Tentar novamente</Button>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="flex flex-col items-center gap-3 p-8 text-center">
                            <p className="text-sm text-muted-foreground">Nenhum usuário encontrado.</p>
                            <Button variant="outline" size="sm" onClick={() => setInviteOpen(true)} className="text-primary border-primary/30">
                                <UserPlus className="h-4 w-4 mr-2" /> Convidar primeiro usuário
                            </Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 gap-4">
                            {users.map((user) => (
                                <div key={user.id} className="flex items-center justify-between p-5 bg-muted/20 rounded-3xl border border-border/50 hover:border-primary/30 transition-all group backdrop-blur-sm hover:shadow-lg hover:shadow-primary/5">
                                    <div className="flex items-center gap-5">
                                        <div className="relative">
                                            <Avatar className="h-14 w-14 border-2 border-background shadow-xl ring-1 ring-border group-hover:ring-primary/30 transition-all">
                                                <AvatarFallback className="bg-gradient-to-br from-primary to-primary-foreground/20 text-white font-black text-lg">
                                                    {user.name?.charAt(0) || 'U'}
                                                </AvatarFallback>
                                            </Avatar>
                                            {user.id === currentUser?.id && (
                                                <div className="absolute -bottom-1 -right-1 h-5 w-5 bg-emerald-500 rounded-full border-2 border-background shadow-lg flex items-center justify-center" title="Você">
                                                    <div className="h-1.5 w-1.5 bg-white rounded-full animate-pulse" />
                                                </div>
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-3 flex-wrap">
                                                <p className="text-base font-black text-foreground tracking-tight">{user.name}</p>
                                                <Badge className={`text-[9px] border font-black uppercase tracking-widest px-2.5 py-1 rounded-lg ${ROLE_COLORS[user.role] || ROLE_COLORS.sales}`}>
                                                    {ROLE_LABELS[user.role] || user.role}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground font-medium mt-0.5">{user.email}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-8">
                                        <div className="hidden lg:flex flex-col items-end gap-1">
                                            <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Último Acesso</p>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground bg-background/50 px-3 py-1 rounded-lg border border-border/50">
                                                <Clock className="h-3 w-3 text-primary" />
                                                <span>{user.lastLogin}</span>
                                            </div>
                                        </div>
                                        <div className="w-px h-10 bg-border/50 hidden md:block" />
                                        <Select
                                            value={user.role}
                                            onValueChange={(val) => handleRoleChange(user.id, val)}
                                            disabled={user.id === currentUser?.id}
                                        >
                                            <SelectTrigger className="w-[180px] h-12 bg-background/50 border-border text-xs font-black uppercase tracking-widest focus:ring-primary rounded-2xl hover:bg-background transition-colors">
                                                <div className="flex items-center gap-3">
                                                    <Shield className="h-4 w-4 text-primary flex-shrink-0" />
                                                    <SelectValue />
                                                </div>
                                            </SelectTrigger>
                                            <SelectContent className="bg-card border-border rounded-xl shadow-2xl">
                                                <SelectItem value="admin" className="font-bold text-xs uppercase tracking-widest">Administrador</SelectItem>
                                                <SelectItem value="manager" className="font-bold text-xs uppercase tracking-widest">Gerente</SelectItem>
                                                <SelectItem value="sales" className="font-bold text-xs uppercase tracking-widest">Vendedor</SelectItem>
                                                <SelectItem value="support" className="font-bold text-xs uppercase tracking-widest">Suporte</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </>
    );
}
