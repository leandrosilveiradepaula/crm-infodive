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
            <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden shadow-xl border-none">
                <CardHeader className="bg-muted/30 p-8">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl border border-primary/20">
                            <User className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl font-black tracking-tight tracking-tight uppercase">Meu Perfil</CardTitle>
                            <CardDescription className="text-muted-foreground font-medium">Informações da sua conta pessoal no sistema.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-10">
                    {/* Avatar Section */}
                    <div className="flex flex-col md:flex-row items-center gap-8 p-6 bg-muted/10 rounded-3xl border border-border/50">
                        <div className="relative group">
                            <Avatar className="h-32 w-32 border-4 border-background shadow-2xl ring-1 ring-border group-hover:ring-primary/50 transition-all">
                                <AvatarImage src={profile.avatar_url || undefined} />
                                <AvatarFallback className="bg-gradient-to-br from-primary via-primary/80 to-primary/60 text-white text-3xl font-black">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 bg-primary/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer backdrop-blur-[2px]">
                                <p className="text-[10px] font-black uppercase text-white tracking-widest">Alterar</p>
                            </div>
                        </div>
                        <div className="flex-1 text-center md:text-left space-y-3">
                            <div>
                                <h3 className="text-2xl font-black text-foreground tracking-tight">{fullName || 'Usuário'}</h3>
                                <p className="text-muted-foreground font-medium">{user?.email}</p>
                            </div>
                            <div className="flex flex-wrap justify-center md:justify-start gap-2">
                                <Badge className="bg-primary/10 text-primary border-primary/20 font-black uppercase text-[10px] tracking-widest px-3 py-1 rounded-lg">
                                    <Shield className="h-3 w-3 mr-1.5" />
                                    {profile.role || 'admin'}
                                </Badge>
                                <Badge variant="outline" className="text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-lg border-border">
                                    Membro Ativo
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Fields Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] ml-1">Nome Completo</Label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    value={fullName}
                                    onChange={e => setFullName(e.target.value)}
                                    className="pl-12 h-14 bg-muted/20 border-border focus:bg-background rounded-2xl font-bold shadow-sm transition-all"
                                    placeholder="Digite seu nome completo..."
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] ml-1">Email Principal</Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    value={user?.email || ''}
                                    disabled
                                    className="pl-12 h-14 bg-muted/30 border-border text-muted-foreground cursor-not-allowed rounded-2xl font-bold italic"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] ml-1">Telefone / WhatsApp</Label>
                            <div className="relative group">
                                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    value={phone}
                                    onChange={e => setPhone(e.target.value)}
                                    className="pl-12 h-14 bg-muted/20 border-border focus:bg-background rounded-2xl font-bold shadow-sm"
                                    placeholder="(00) 00000-0000"
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em] ml-1">Nível de Acesso</Label>
                            <div className="relative group">
                                <Shield className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    value={profile.role || ''}
                                    disabled
                                    className="pl-12 h-14 bg-muted/30 border-border text-muted-foreground cursor-not-allowed uppercase rounded-2xl font-bold tracking-widest"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-8 border-t border-border/50">
                        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 font-black uppercase text-[11px] tracking-widest px-10 h-14 rounded-2xl shadow-xl shadow-primary/20 transition-all hover:scale-[1.02]">
                            {saving ? <Loader2 className="h-5 w-5 mr-3 animate-spin" /> : <Save className="h-5 w-5 mr-3" />}
                            Atualizar Perfil
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
