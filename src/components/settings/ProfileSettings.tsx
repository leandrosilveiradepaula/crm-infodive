'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { updateMyProfile } from '@/app/(dashboard)/settings/actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { User, Mail, Shield, Phone, Save, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export function ProfileSettings() {
    const { profile, user } = useAuth();
    const [fullName, setFullName] = useState(profile?.full_name || '');
    const [phone, setPhone] = useState((profile as any)?.phone || '');
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setPhone((profile as any).phone || '');
        }
    }, [profile]);

    const handleSave = async () => {
        if (!fullName.trim()) {
            toast.error('Nome não pode estar vazio.');
            return;
        }
        setSaving(true);
        const result = await updateMyProfile({ full_name: fullName.trim(), phone: phone.trim() });
        setSaving(false);
        if (result.success) {
            toast.success('Perfil atualizado com sucesso!');
        } else {
            toast.error('Erro ao salvar: ' + result.error);
        }
    };

    if (!profile) return null;

    const initials = fullName
        ? fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : user?.email?.charAt(0).toUpperCase() || 'U';

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2.5 bg-primary/10 rounded-xl">
                    <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-foreground tracking-tight">Meu Perfil</h3>
                    <p className="text-xs text-muted-foreground font-medium">Informações da sua conta pessoal no sistema.</p>
                </div>
            </div>

            <div className="space-y-8">
                {/* Avatar Section */}
                <div className="flex flex-col md:flex-row items-center gap-6 p-6 bg-muted/20 rounded-2xl border border-border/50">
                    <div className="relative group">
                        <Avatar className="h-24 w-24 border-2 border-background shadow-lg ring-1 ring-border group-hover:ring-primary/50 transition-all">
                            <AvatarImage src={profile.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-2xl font-black">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                        <div className="absolute inset-0 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                            <p className="text-xs font-bold uppercase text-white tracking-widest">Alterar</p>
                        </div>
                    </div>
                    <div className="flex-1 text-center md:text-left space-y-2">
                        <div>
                            <h3 className="text-xl font-black text-foreground tracking-tight">{fullName || 'Usuário'}</h3>
                            <p className="text-sm text-muted-foreground font-medium">{user?.email}</p>
                        </div>
                        <div className="flex flex-wrap justify-center md:justify-start gap-2">
                            <Badge className="bg-primary/10 text-primary border border-primary/20 font-bold uppercase text-xs tracking-wider px-2.5 py-0.5 rounded-lg">
                                <Shield className="h-3 w-3 mr-1" />
                                {profile.role || 'admin'}
                            </Badge>
                            <Badge variant="outline" className="text-xs font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-lg border-border">
                                Membro Ativo
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Fields Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs font-black uppercase tracking-[0.2em]">Nome Completo</Label>
                        <div className="relative group">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                value={fullName}
                                onChange={e => setFullName(e.target.value)}
                                className="pl-10 h-[38px] bg-muted/20 border-border focus:bg-background rounded-xl font-bold text-sm"
                                placeholder="Digite seu nome completo..."
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs font-black uppercase tracking-[0.2em]">Email Principal</Label>
                        <div className="relative group">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                value={user?.email || ''}
                                disabled
                                className="pl-10 h-[38px] bg-muted/30 border-border text-muted-foreground cursor-not-allowed rounded-xl font-bold text-sm italic"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs font-black uppercase tracking-[0.2em]">Telefone / WhatsApp</Label>
                        <div className="relative group">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                value={phone}
                                onChange={e => setPhone(e.target.value)}
                                className="pl-10 h-[38px] bg-muted/20 border-border focus:bg-background rounded-xl font-bold text-sm"
                                placeholder="(00) 00000-0000"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-xs font-black uppercase tracking-[0.2em]">Nível de Acesso</Label>
                        <div className="relative group">
                            <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                            <Input
                                value={profile.role || ''}
                                disabled
                                className="pl-10 h-[38px] bg-muted/30 border-border text-muted-foreground cursor-not-allowed rounded-xl font-bold text-sm uppercase tracking-widest"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-border">
                    <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 font-bold text-white px-8 h-11 rounded-xl shadow-lg shadow-primary/20 transition-all">
                        {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Atualizar Perfil
                    </Button>
                </div>
            </div>
        </div>
    );
}
