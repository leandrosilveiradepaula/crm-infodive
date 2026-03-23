'use client';

import { useState, useEffect } from 'react';
import { PipelineSettings } from '@/components/settings/PipelineSettings';
import { OrganizationThemeSettings } from '@/components/settings/OrganizationThemeSettings';
import { ProfileSettings } from '@/components/settings/ProfileSettings';
import { UsersSettings } from '@/components/settings/UsersSettings';
import { SecurityTab } from '@/components/settings/SecurityTab';
import { AuditLogTab } from '@/components/settings/AuditLogTab';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { 
    Settings, Shield, Users, Kanban, Save, Loader2, 
    Building2, Mail, Palette, Database 
} from 'lucide-react';
import { toast } from 'sonner';
import { useTheme } from 'next-themes';
import { saveOrgSettings } from '@/app/(dashboard)/settings/actions';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuth } from '@/hooks/useAuth';
import type { PipelineStage, OrgSettings } from '@/services/SettingsService';
import { PageHeader } from '@/components/layout/PageHeader';

function BrandingSettings({ initial }: { initial: OrgSettings }) {
    const [form, setForm] = useState<OrgSettings>(initial);
    const [saving, setSaving] = useState(false);

    const handleSave = async () => {
        setSaving(true);
        const result = await saveOrgSettings(form);
        setSaving(false);
        if (result.success) toast.success('Identidade visual atualizada!');
        else toast.error('Erro ao salvar: ' + result.error);
    };

    return (
        <div className="space-y-6">
            <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden">
                <CardHeader className="bg-muted/30 pb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Palette className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Identidade Visual</CardTitle>
                            <CardDescription>Customize como sua empresa aparece no CRM e nas Propostas.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                        {/* Logo Upload */}
                        <div className="space-y-4">
                            <Label className="uppercase tracking-[0.2em] text-[10px] font-black text-muted-foreground">Logo da Empresa</Label>
                            <div className="flex items-center gap-6 p-6 bg-muted/20 border-2 border-dashed border-border rounded-3xl group hover:border-primary/50 transition-all">
                                <div className="h-24 w-24 bg-card rounded-2xl border border-border flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                                    {form.logo_url ? (
                                        <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain" />
                                    ) : (
                                        <Building2 className="h-8 w-8 text-muted-foreground opacity-30" />
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <Button variant="outline" size="sm" className="font-bold uppercase text-[10px] tracking-widest border-border hover:bg-muted">
                                        Alterar Logo
                                    </Button>
                                    <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">PNG ou SVG. Máx 2MB.</p>
                                </div>
                            </div>
                        </div>

                        {/* Brand Colors */}
                        <div className="space-y-4">
                            <Label className="uppercase tracking-[0.2em] text-[10px] font-black text-muted-foreground">Cores da Marca</Label>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/20 rounded-2xl border border-border">
                                    <Label className="text-[9px] font-bold text-muted-foreground uppercase mb-2 block">Cor Primária</Label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="color" 
                                            value={form.primary_color || '#3b82f6'} 
                                            onChange={e => setForm({ ...form, primary_color: e.target.value })}
                                            className="h-8 w-8 rounded cursor-pointer border-none bg-transparent"
                                        />
                                        <span className="font-mono text-xs font-bold">{form.primary_color || '#3b82f6'}</span>
                                    </div>
                                </div>
                                <div className="p-4 bg-muted/20 rounded-2xl border border-border">
                                    <Label className="text-[9px] font-bold text-muted-foreground uppercase mb-2 block">Cor Secundária</Label>
                                    <div className="flex items-center gap-3">
                                        <input 
                                            type="color" 
                                            value={form.secondary_color || '#1e293b'} 
                                            onChange={e => setForm({ ...form, secondary_color: e.target.value })}
                                            className="h-8 w-8 rounded cursor-pointer border-none bg-transparent"
                                        />
                                        <span className="font-mono text-xs font-bold">{form.secondary_color || '#1e293b'}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator className="bg-border/50" />
                    
                    <OrganizationThemeSettings />

                    <div className="flex justify-end">
                        <Button onClick={handleSave} disabled={saving} className="bg-primary hover:bg-primary/90 font-black uppercase text-[11px] tracking-widest px-8 h-12 rounded-2xl shadow-xl shadow-primary/20 transition-all">
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Salvar Identidade
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

function GeneralSettings({ initial }: { initial: OrgSettings }) {
    const { theme, setTheme } = useTheme();
    const [mounted, setMounted] = useState(false);
    const [form, setForm] = useState<OrgSettings>(initial);
    const [saving, setSaving] = useState(false);

    useEffect(() => { setMounted(true); }, []);

    const handleSaveOrg = async () => {
        setSaving(true);
        const result = await saveOrgSettings(form);
        setSaving(false);
        if (result.success) toast.success('Configurações da organização salvas!');
        else toast.error('Erro ao salvar: ' + result.error);
    };

    return (
        <div className="space-y-6">
            <Card className="bg-card border-border rounded-[2.5rem] overflow-hidden shadow-xl">
                <CardHeader className="bg-muted/30 pb-8">
                    <div className="flex items-center gap-3">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <CardTitle className="text-xl">Dados da Instituição</CardTitle>
                            <CardDescription>Informações cadastrais e fiscais da organização.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Razão Social / Nome Fantasia</Label>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    value={form.name}
                                    onChange={e => setForm({ ...form, name: e.target.value })}
                                    className="pl-12 h-14 bg-muted/20 border-border focus:bg-background rounded-2xl font-bold"
                                    placeholder="Nome da sua empresa"
                                />
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Email Institucional</Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    value={form.support_email}
                                    onChange={e => setForm({ ...form, support_email: e.target.value })}
                                    className="pl-12 h-14 bg-muted/20 border-border focus:bg-background rounded-2xl font-bold"
                                    placeholder="suporte@empresa.com"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-3">
                            <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">CNPJ</Label>
                            <Input
                                value={form.cnpj || ''}
                                onChange={e => setForm({ ...form, cnpj: e.target.value })}
                                className="h-14 bg-muted/20 border-border focus:bg-background rounded-2xl font-mono text-sm font-bold"
                                placeholder="00.000.000/0000-00"
                            />
                        </div>
                        <div className="space-y-3">
                            <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Inscrição Estadual (IE)</Label>
                            <Input
                                value={form.ie || ''}
                                onChange={e => setForm({ ...form, ie: e.target.value })}
                                className="h-14 bg-muted/20 border-border focus:bg-background rounded-2xl font-mono text-sm font-bold"
                                placeholder="IE da empresa"
                            />
                        </div>
                    </div>

                    <Separator className="bg-border/50" />

                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black text-muted-foreground uppercase tracking-[0.3em] flex items-center gap-2">
                            <span className="w-8 h-[1px] bg-border" />
                            Endereço Sede
                            <span className="flex-1 h-[1px] bg-border" />
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                            <div className="md:col-span-2 space-y-3">
                                <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">CEP</Label>
                                <Input
                                    value={form.zip || ''}
                                    onChange={e => setForm({ ...form, zip: e.target.value })}
                                    className="h-12 bg-muted/20 border-border focus:bg-background rounded-xl font-bold"
                                    placeholder="00000-000"
                                />
                            </div>
                            <div className="md:col-span-3 space-y-3">
                                <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Logradouro</Label>
                                <Input
                                    value={form.street || ''}
                                    onChange={e => setForm({ ...form, street: e.target.value })}
                                    className="h-12 bg-muted/20 border-border focus:bg-background rounded-xl font-bold"
                                />
                            </div>
                            <div className="md:col-span-1 space-y-3">
                                <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Nº</Label>
                                <Input
                                    value={form.number || ''}
                                    onChange={e => setForm({ ...form, number: e.target.value })}
                                    className="h-12 bg-muted/20 border-border focus:bg-background rounded-xl font-bold"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div className="space-y-3">
                                <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Bairro</Label>
                                <Input
                                    value={form.neighborhood || ''}
                                    onChange={e => setForm({ ...form, neighborhood: e.target.value })}
                                    className="h-12 bg-muted/20 border-border focus:bg-background rounded-xl font-bold"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">Cidade</Label>
                                <Input
                                    value={form.city || ''}
                                    onChange={e => setForm({ ...form, city: e.target.value })}
                                    className="h-12 bg-muted/20 border-border focus:bg-background rounded-xl font-bold"
                                />
                            </div>
                            <div className="space-y-3">
                                <Label className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.2em]">UF</Label>
                                <Input
                                    value={form.state || ''}
                                    onChange={e => setForm({ ...form, state: e.target.value })}
                                    className="h-12 bg-muted/20 border-border focus:bg-background rounded-xl font-bold uppercase"
                                    maxLength={2}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6">
                        <Button onClick={handleSaveOrg} disabled={saving} className="bg-primary hover:bg-primary/90 font-black uppercase text-[11px] tracking-widest px-10 h-14 rounded-2xl shadow-xl shadow-primary/20">
                            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                            Salvar Alterações
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Application Preferences */}
            <Card className="bg-card border-border rounded-[2.5rem] mt-10 overflow-hidden border-dashed">
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-muted rounded-lg border border-border">
                            <Palette className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <CardTitle className="text-base">Preferências da Aplicação</CardTitle>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="flex items-center justify-between p-4 bg-muted/10 rounded-2xl border border-border">
                        <div className="space-y-0.5">
                            <Label className="text-base text-foreground font-bold">Modo Escuro / Claro</Label>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Alternar tema da interface pessoal</p>
                        </div>
                        <Switch
                            checked={mounted && theme === 'dark'}
                            onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                            disabled={!mounted}
                            className="data-[state=checked]:bg-primary scale-125 mr-2"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export function SettingsClientPage({ initialOrgSettings, initialStages }: { initialOrgSettings: OrgSettings; initialStages: PipelineStage[] }) {
    const { can } = usePermissions();

    return (
        <div className="space-y-8 pb-10">
            <PageHeader 
                title="Centro de Configurações" 
                description="Gestão organizacional, segurança e personalização." 
            />

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="bg-muted/50 p-1.5 rounded-2xl border border-border mb-8 h-14 gap-2">
                    <TabsTrigger value="general" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-[0.15em] px-6 h-full transition-all flex items-center gap-2">
                        <Building2 className="h-4 w-4" /> Geral
                    </TabsTrigger>
                    <TabsTrigger value="branding" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-[0.15em] px-6 h-full transition-all flex items-center gap-2">
                        <Palette className="h-4 w-4" /> Aparência
                    </TabsTrigger>
                    <TabsTrigger value="profile" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-[0.15em] px-6 h-full transition-all flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Perfil
                    </TabsTrigger>
                    <TabsTrigger value="pipeline" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-[0.15em] px-6 h-full transition-all flex items-center gap-2">
                        <Kanban className="h-4 w-4" /> Funil
                    </TabsTrigger>
                    <TabsTrigger value="users" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-[0.15em] px-6 h-full transition-all flex items-center gap-2">
                        <Users className="h-4 w-4" /> Equipe
                    </TabsTrigger>
                    <TabsTrigger value="security" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-[0.15em] px-6 h-full transition-all flex items-center gap-2">
                        <Shield className="h-4 w-4" /> Segurança
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-black uppercase text-[10px] tracking-[0.15em] px-6 h-full transition-all flex items-center gap-2">
                        <Database className="h-4 w-4" /> Auditoria
                    </TabsTrigger>
                </TabsList>

                <div className="mt-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <TabsContent value="general"><GeneralSettings initial={initialOrgSettings} /></TabsContent>
                    <TabsContent value="branding"><BrandingSettings initial={initialOrgSettings} /></TabsContent>
                    <TabsContent value="profile"><ProfileSettings /></TabsContent>
                    <TabsContent value="pipeline"><PipelineSettings initialStages={initialStages} /></TabsContent>
                    <TabsContent value="users"><UsersSettings /></TabsContent>
                    <TabsContent value="security"><SecurityTab /></TabsContent>
                    <TabsContent value="audit"><AuditLogTab /></TabsContent>
                </div>
            </Tabs>
        </div>
    );
}
