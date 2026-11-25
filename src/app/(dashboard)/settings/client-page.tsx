'use client';


import { organizationBrandDefaults } from '@/design-system/domain-visual-defaults';
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
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-primary/10 rounded-[var(--radius-panel)]">
                    <Palette className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-section-title font-black text-foreground tracking-tight">Identidade Visual</h3>
                    <p className="text-metadata-ui text-muted-foreground font-medium">Customize como sua empresa aparece no CRM e nas Propostas.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Logo Upload */}
                <div className="space-y-3">
                    <Label className="uppercase tracking-[0.2em] text-metadata-ui font-black text-muted-foreground">Logo da Empresa</Label>
                    <div className="flex items-center gap-6 p-5 bg-muted/20 border-2 border-dashed border-border rounded-[var(--radius-panel)] group hover:border-primary/50 transition-all">
                        <div className="h-20 w-20 bg-card rounded-[var(--radius-panel)] border border-border flex items-center justify-center overflow-hidden shadow-inner group-hover:scale-105 transition-transform">
                            {form.logo_url ? (
                                <img src={form.logo_url} alt="Logo" className="w-full h-full object-contain" />
                            ) : (
                                <Building2 className="h-7 w-7 text-muted-foreground opacity-30" />
                            )}
                        </div>
                        <div className="space-y-2">
                            <Button variant="outline" size="sm" className="font-bold uppercase text-metadata-ui tracking-widest border-border hover:bg-muted">
                                Alterar Logo
                            </Button>
                            <p className="text-metadata-ui text-muted-foreground font-medium uppercase tracking-wide">PNG ou SVG. Máx 2MB.</p>
                        </div>
                    </div>
                </div>

                {/* Brand Colors */}
                <div className="space-y-3">
                    <Label className="uppercase tracking-[0.2em] text-metadata-ui font-black text-muted-foreground">Cores da Marca</Label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/20 rounded-[var(--radius-panel)] border border-border">
                            <Label className="text-metadata-ui font-bold text-muted-foreground uppercase mb-2 block">Cor Primária</Label>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="color"
                                    aria-label="Selecionar cor primária da marca"
                                    value={form.primary_color || organizationBrandDefaults.primary}
                                    onChange={e => setForm({ ...form, primary_color: e.target.value })}
                                    className="h-8 w-8 rounded cursor-pointer border-none bg-transparent"
                                />
                                <span className="font-mono text-metadata-ui font-bold">{form.primary_color || organizationBrandDefaults.primary}</span>
                            </div>
                        </div>
                        <div className="p-4 bg-muted/20 rounded-[var(--radius-panel)] border border-border">
                            <Label className="text-metadata-ui font-bold text-muted-foreground uppercase mb-2 block">Cor Secundária</Label>
                            <div className="flex items-center gap-3">
                                <input 
                                    type="color"
                                    aria-label="Selecionar cor secundária da marca"
                                    value={form.secondary_color || organizationBrandDefaults.secondary}
                                    onChange={e => setForm({ ...form, secondary_color: e.target.value })}
                                    className="h-8 w-8 rounded cursor-pointer border-none bg-transparent"
                                />
                                <span className="font-mono text-metadata-ui font-bold">{form.secondary_color || organizationBrandDefaults.secondary}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Separator className="bg-border/50" />
            
            <OrganizationThemeSettings />

            <div className="flex justify-end pt-4">
                <Button onClick={handleSave} disabled={saving} size="lg">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Identidade
                </Button>
            </div>
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
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 bg-primary/10 rounded-[var(--radius-panel)]">
                    <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                    <h3 className="text-section-title font-black text-foreground tracking-tight">Dados da Instituição</h3>
                    <p className="text-metadata-ui text-muted-foreground font-medium">Informações cadastrais e fiscais da organização.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-muted-foreground text-metadata-ui font-black uppercase tracking-[0.2em]">Razão Social / Nome Fantasia</Label>
                    <div className="relative group">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            aria-label="Razão social ou nome fantasia"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                            className="pl-10 h-[38px] bg-surface-raised border-border focus:bg-background rounded-[var(--radius-panel)] font-bold text-body-ui"
                            placeholder="Nome da sua empresa"
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-muted-foreground text-metadata-ui font-black uppercase tracking-[0.2em]">Email Institucional</Label>
                    <div className="relative group">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                        <Input
                            aria-label="Email institucional"
                            value={form.support_email}
                            onChange={e => setForm({ ...form, support_email: e.target.value })}
                            className="pl-10 h-[38px] bg-surface-raised border-border focus:bg-background rounded-[var(--radius-panel)] font-bold text-body-ui"
                            placeholder="suporte@empresa.com"
                        />
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-muted-foreground text-metadata-ui font-black uppercase tracking-[0.2em]">CNPJ</Label>
                    <Input
                        aria-label="CNPJ da empresa"
                            value={form.cnpj || ''}
                        onChange={e => setForm({ ...form, cnpj: e.target.value })}
                        className="h-[38px] bg-surface-raised border-border focus:bg-background rounded-[var(--radius-panel)] font-mono text-body-ui font-bold"
                        placeholder="00.000.000/0000-00"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-muted-foreground text-metadata-ui font-black uppercase tracking-[0.2em]">Inscrição Estadual (IE)</Label>
                    <Input
                        aria-label="Inscrição estadual"
                            value={form.ie || ''}
                        onChange={e => setForm({ ...form, ie: e.target.value })}
                        className="h-[38px] bg-surface-raised border-border focus:bg-background rounded-[var(--radius-panel)] font-mono text-body-ui font-bold"
                        placeholder="IE da empresa"
                    />
                </div>
            </div>

            <Separator className="bg-border/50" />

            <div className="space-y-4">
                <h4 className="text-metadata-ui font-black text-muted-foreground uppercase tracking-[0.2em] flex items-center gap-2">
                    <span className="w-6 h-[1px] bg-border" />
                    Endereço Sede
                    <span className="flex-1 h-[1px] bg-border" />
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                    <div className="md:col-span-2 space-y-2">
                        <Label className="text-muted-foreground text-metadata-ui font-black uppercase tracking-[0.2em]">CEP</Label>
                        <Input
                            aria-label="CEP"
                            value={form.zip || ''}
                            onChange={e => setForm({ ...form, zip: e.target.value })}
                            className="h-[34px] bg-surface-raised border-border focus:bg-background rounded-[var(--radius-panel)] font-bold text-body-ui"
                            placeholder="00000-000"
                        />
                    </div>
                    <div className="md:col-span-3 space-y-2">
                        <Label className="text-muted-foreground text-metadata-ui font-black uppercase tracking-[0.2em]">Logradouro</Label>
                        <Input
                            aria-label="Logradouro"
                            value={form.street || ''}
                            onChange={e => setForm({ ...form, street: e.target.value })}
                            className="h-[34px] bg-surface-raised border-border focus:bg-background rounded-[var(--radius-panel)] font-bold text-body-ui"
                        />
                    </div>
                    <div className="md:col-span-1 space-y-2">
                        <Label className="text-muted-foreground text-metadata-ui font-black uppercase tracking-[0.2em]">Nº</Label>
                        <Input
                            aria-label="Número do endereço"
                            value={form.number || ''}
                            onChange={e => setForm({ ...form, number: e.target.value })}
                            className="h-[34px] bg-surface-raised border-border focus:bg-background rounded-[var(--radius-panel)] font-bold text-body-ui"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-metadata-ui font-black uppercase tracking-[0.2em]">Bairro</Label>
                        <Input
                            aria-label="Bairro"
                            value={form.neighborhood || ''}
                            onChange={e => setForm({ ...form, neighborhood: e.target.value })}
                            className="h-[34px] bg-surface-raised border-border focus:bg-background rounded-[var(--radius-panel)] font-bold text-body-ui"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-metadata-ui font-black uppercase tracking-[0.2em]">Cidade</Label>
                        <Input
                            aria-label="Cidade"
                            value={form.city || ''}
                            onChange={e => setForm({ ...form, city: e.target.value })}
                            className="h-[34px] bg-surface-raised border-border focus:bg-background rounded-[var(--radius-panel)] font-bold text-body-ui"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-muted-foreground text-metadata-ui font-black uppercase tracking-[0.2em]">UF</Label>
                        <Input
                            aria-label="Estado (UF)"
                            value={form.state || ''}
                            onChange={e => setForm({ ...form, state: e.target.value })}
                            className="h-[34px] bg-surface-raised border-border focus:bg-background rounded-[var(--radius-panel)] font-bold text-body-ui uppercase"
                            maxLength={2}
                        />
                    </div>
                </div>
            </div>

            <div className="flex justify-end pt-4">
                <Button onClick={handleSaveOrg} disabled={saving} size="lg">
                    {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                    Salvar Alterações
                </Button>
            </div>

            <Separator className="bg-border/50" />

            {/* Application Preferences */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-muted rounded-[var(--radius-control)] border border-border">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <h3 className="text-body-ui font-black text-foreground">Preferências da Aplicação</h3>
                </div>
                <div className="flex items-center justify-between p-4 bg-muted/10 rounded-[var(--radius-panel)] border border-border">
                    <div className="space-y-0.5">
                        <Label className="text-body-ui text-foreground font-bold">Modo Escuro / Claro</Label>
                        <p className="text-metadata-ui text-muted-foreground font-medium uppercase tracking-wide">Alternar tema da interface pessoal</p>
                    </div>
                    <Switch
                        aria-label="Alternar modo escuro"
                        checked={mounted && theme === 'dark'}
                        onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
                        disabled={!mounted}
                        className="data-[state=checked]:bg-primary"
                    />
                </div>
            </div>
        </div>
    );
}

export function SettingsClientPage({ initialOrgSettings, initialStages }: { initialOrgSettings: OrgSettings; initialStages: PipelineStage[] }) {
    const { can } = usePermissions();

    return (
        <div className="space-y-6 pb-10 animate-in fade-in duration-500">
            <PageHeader 
                title="Configurações" 
                description="Gestão organizacional, segurança e personalização." 
            />

            <Tabs defaultValue="general" className="w-full">
                <TabsList layout="workspace" aria-label="Seções de configurações" className="mb-3">
                    <TabsTrigger value="general">
                        <Building2 className="h-4 w-4" /> Geral
                    </TabsTrigger>
                    <TabsTrigger value="branding">
                        <Palette className="h-4 w-4" /> Identidade
                    </TabsTrigger>
                    <TabsTrigger value="profile">
                        <Settings className="h-4 w-4" /> Perfil
                    </TabsTrigger>
                    <TabsTrigger value="pipeline">
                        <Kanban className="h-4 w-4" /> Funil
                    </TabsTrigger>
                    <TabsTrigger value="users">
                        <Users className="h-4 w-4" /> Equipe
                    </TabsTrigger>
                    <TabsTrigger value="security">
                        <Shield className="h-4 w-4" /> Segurança
                    </TabsTrigger>
                    <TabsTrigger value="audit">
                        <Database className="h-4 w-4" /> Auditoria
                    </TabsTrigger>
                </TabsList>

                <div className="min-h-[600px] rounded-[var(--radius-panel)] border border-border bg-card p-4 shadow-[var(--shadow-card)]">
                    <TabsContent value="general" className="mt-0 outline-none"><GeneralSettings initial={initialOrgSettings} /></TabsContent>
                    <TabsContent value="branding" className="mt-0 outline-none"><BrandingSettings initial={initialOrgSettings} /></TabsContent>
                    <TabsContent value="profile" className="mt-0 outline-none"><ProfileSettings /></TabsContent>
                    <TabsContent value="pipeline" className="mt-0 outline-none"><PipelineSettings /></TabsContent>
                    <TabsContent value="users" className="mt-0 outline-none"><UsersSettings /></TabsContent>
                    <TabsContent value="security" className="mt-0 outline-none"><SecurityTab /></TabsContent>
                    <TabsContent value="audit" className="mt-0 outline-none"><AuditLogTab /></TabsContent>
                </div>
            </Tabs>
        </div>
    );
}

