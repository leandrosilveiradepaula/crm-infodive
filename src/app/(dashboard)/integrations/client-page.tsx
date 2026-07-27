'use client';

import { useState } from 'react';
import { Grid, Power, ExternalLink, Plus, Cloud, Laptop, MessageSquare, Zap, Server } from 'lucide-react';
import { IntegrationKeys } from '@/components/integrations/IntegrationKeys';
import { IntegrationWebhooks } from '@/components/integrations/IntegrationWebhooks';
import { type Integration, type ApiKey, type Webhook } from '@/types/integration';
import { toggleIntegrationStatus } from '@/app/(dashboard)/integrations/actions';
import { useRouter } from 'next/navigation';
import { PageHeaderActions } from "@/components/layout/PageHeaderActions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
interface IntegrationsClientPageProps {
    initialIntegrations: Integration[];
    initialKeys: ApiKey[];
    initialWebhooks: Webhook[];
}

export default function IntegrationsClientPage({
    initialIntegrations,
    initialKeys,
    initialWebhooks
}: IntegrationsClientPageProps) {
    const router = useRouter();
    const [view, setView] = useState<'apps' | 'dev'>('apps');

    // Simple optimistic UI for toggles can be added, relying on router refresh for now
    const handleToggle = async (id: string, status: string) => {
        await toggleIntegrationStatus(id, status);
        router.refresh();
    };

    const getAppIcon = (provider: string) => {
        switch (provider) {
            case 'ibm_cloud': return <Cloud className="h-7 w-7" />;
            case 'lenovo': return <Laptop className="h-7 w-7" />;
            case 'whatsapp': return <MessageSquare className="h-7 w-7" />;
            default: return <Grid className="h-7 w-7" />;
        }
    };

    const getIconColor = (provider: string) => {
        switch (provider) {
            case 'ibm_cloud': return 'bg-primary/10 text-primary';
            case 'lenovo': return 'bg-lenovo-red/10 text-lenovo-red';
            case 'whatsapp': return 'bg-green-50 text-green-600';
            default: return 'bg-muted/50 text-muted-foreground';
        }
    };

    const getDescription = (provider: string) => {
        switch (provider) {
            case 'ibm_cloud': return 'Sincronize serviços de infraestrutura e IA da IBM Cloud diretamente no seu workflow de vendas.';
            case 'lenovo': return 'Gerencie garantias, pedidos e especificações de hardware Lenovo via Partner Hub.';
            case 'whatsapp': return 'Envie notificações automáticas e gerencie conversas com leads via WhatsApp API.';
            default: return 'Integração de sistema externo para sincronização de dados e automação.';
        }
    };

    const getFeatures = (provider: string) => {
        switch (provider) {
            case 'ibm_cloud': return ['Watson AI', 'Cloud Storage', 'Auto-Scaling'];
            case 'lenovo': return ['Warranty Check', 'Order Tracking', 'Spec Sync'];
            case 'whatsapp': return ['Lead Alerts', 'Auto-Replies', 'Chat Sync'];
            default: return ['Sincronização', 'Notificações', 'API Access'];
        }
    };

    return (
        <div className="space-y-6 pb-10 animate-in fade-in duration-700">
            

            <Tabs value={view} onValueChange={(v) => setView(v as any)} className="w-full">
                <TabsList className="mb-6 w-full justify-start overflow-x-auto no-scrollbar">
                    <TabsTrigger value="apps">
                        <Zap className="h-4 w-4" /> App Marketplace
                    </TabsTrigger>
                    <TabsTrigger value="dev">
                        <Server className="h-4 w-4" /> Dev Portal
                    </TabsTrigger>
                </TabsList>

                {/* Content Area */}
                <TabsContent value="apps" className="mt-0 outline-none">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {initialIntegrations.map(app => (
                        <div key={app.id} className="bg-card p-6 rounded-2xl border border-border shadow-md hover:shadow-xl hover:shadow-primary/10 hover:-translate-y-1 transition-all group relative overflow-hidden">
                            {app.status === 'connected' && (
                                <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-emerald-600 text-white px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-bl-2xl shadow-lg z-10 animate-in slide-in-from-right-full duration-500">
                                    Conectado
                                </div>
                            )}

                            <div className="flex items-start justify-between mb-8">
                                <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-500 ${getIconColor(app.provider)} border border-border`}>
                                    {getAppIcon(app.provider)}
                                </div>
                                <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground bg-muted px-3 py-1.5 rounded-xl border border-border backdrop-blur-sm">{app.provider.replace('_', ' ')}</span>
                            </div>

                            <h3 className="font-black text-foreground text-2xl mb-2 tracking-tight">{app.name}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed mb-6 line-clamp-2 h-10">{getDescription(app.provider)}</p>

                            {/* Feature Pills */}
                            <div className="flex flex-wrap gap-2 mb-8 h-16 content-start">
                                {getFeatures(app.provider).map(f => (
                                    <span key={f} className="text-[10px] font-bold text-muted-foreground border border-border bg-muted px-2.5 py-1 rounded-lg hover:bg-muted/80 transition-colors cursor-default">{f}</span>
                                ))}
                            </div>

                            <button
                                onClick={() => handleToggle(app.id, app.status)}
                                className={`w-full py-4 rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${app.status === 'connected'
                                    ? 'bg-muted text-muted-foreground hover:bg-red-500/10 hover:text-red-500 border border-border hover:border-red-500/20'
                                    : 'bg-primary text-white hover:bg-primary shadow-xl shadow-primary/20'
                                    }`}
                            >
                                {app.status === 'connected' ? (
                                    <> <Power className="h-4 w-4" /> Desconectar </>
                                ) : (
                                    <> <ExternalLink className="h-4 w-4" /> Configurar Integração </>
                                )}
                            </button>
                        </div>
                    ))}

                    {/* Request Integration Feature */}
                    <div className="border-2 border-dashed border-border rounded-2xl flex flex-col items-center justify-center p-6 text-center hover:border-primary/40 hover:bg-primary/5 transition-all cursor-pointer group min-h-[350px]">
                        <div className="h-20 w-20 rounded-full bg-card border border-border flex items-center justify-center mb-6 group-hover:bg-primary group-hover:text-white group-hover:shadow-2xl group-hover:shadow-primary/20 transition-all duration-500">
                            <Plus className="h-8 w-8 text-muted-foreground group-hover:text-white group-hover:rotate-180 transition-all duration-500" />
                        </div>
                        <h3 className="font-black text-muted-foreground group-hover:text-primary text-xl mb-2 transition-colors">Solicitar Integração</h3>
                        <p className="text-sm text-muted-foreground mt-2 max-w-[200px] leading-relaxed font-medium group-hover:text-muted-foreground">Não encontrou o que precisa?<br />Nossa equipe desenvolve para você.</p>
                    </div>
                </div>
                </TabsContent>
                <TabsContent value="dev" className="mt-0 outline-none">
                <div className="grid lg:grid-cols-2 gap-8 animate-in zoom-in-95 duration-500">
                    <IntegrationKeys />
                    <IntegrationWebhooks />
                </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
