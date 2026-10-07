'use client';

import React from 'react';
import { notFound } from 'next/navigation';
import {
    LayoutDashboard,
    BarChart3,
    Users,
    Settings,
    Bell,
    Search,
    Plus,
    MoreHorizontal,
    ArrowUpRight,
    ArrowDownRight,
    Wallet,
    Activity,
    CreditCard,
    ChevronRight,
    Sparkles,
    CheckCircle2,
    ShieldCheck,
    FileText,
    Briefcase
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RiskRadar } from '@/components/pipeline/ai/RiskRadar';

// ----------------------------------------------------------------------
// Current Theme Showcase - "Style Guide"
// ----------------------------------------------------------------------

export default function DesignPreviewPage() {
    if (process.env.NODE_ENV === 'production' && process.env.ENABLE_INTERNAL_DEBUG_ROUTES !== 'true') notFound();
    return (
        <div className="min-h-screen bg-muted/40 font-sans text-foreground">

            {/* Header Mockup (Matching standard app header) */}
            <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-xl">
                <div className="container mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-8">
                        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground">
                            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground shadow-sm">
                                <Briefcase className="w-4 h-4" />
                            </div>
                            CRM Infodive
                        </div>
                        <nav className="hidden md:flex items-center gap-1 text-sm font-medium text-muted-foreground">
                            <Button variant="ghost" className="text-foreground">Dashboard</Button>
                            <Button variant="ghost">Pipeline</Button>
                            <Button variant="ghost">Clientes</Button>
                            <Button variant="ghost">Relatórios</Button>
                        </nav>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="icon" className="rounded-full">
                            <Search className="w-4 h-4" />
                        </Button>
                        <Button variant="outline" size="icon" className="rounded-full relative">
                            <Bell className="w-4 h-4" />
                            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-destructive border-2 border-background"></span>
                        </Button>
                        <div className="w-9 h-9 rounded-full bg-secondary flex items-center justify-center border border-border">
                            <Users className="w-4 h-4 text-muted-foreground" />
                        </div>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-6 py-8 space-y-10">

                {/* Intro Section */}
                <section className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-foreground">Design System Atual</h1>
                        <p className="text-muted-foreground mt-1">
                            Visualização dos componentes com o tema ativo (Light/Dark).
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button>
                            <Plus className="w-4 h-4 mr-2" /> Novo Item
                        </Button>
                        <Button variant="outline">Exportar</Button>
                    </div>
                </section>

                {/* KPI Cards Section */}
                <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                            <Wallet className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">R$ 45.231,89</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className="text-emerald-500 font-medium">+20.1%</span> em relação ao mês anterior
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Deals Ativos</CardTitle>
                            <Activity className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+2350</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className="text-emerald-500 font-medium">+180.1%</span> novos leads
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="shadow-sm hover:shadow-md transition-shadow">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Vendas Concluídas</CardTitle>
                            <CreditCard className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">+12,234</div>
                            <p className="text-xs text-muted-foreground mt-1">
                                <span className="text-rose-500 font-medium">-4.5%</span> taxa de conversão
                            </p>
                        </CardContent>
                    </Card>
                </section>

                {/* Main Content Area with Tabs */}
                <section>
                    <Tabs defaultValue="components" className="w-full">
                        <div className="flex items-center justify-between mb-4">
                            <TabsList>
                                <TabsTrigger value="components">Componentes</TabsTrigger>
                                <TabsTrigger value="risk-radar">Risk Radar</TabsTrigger>
                                <TabsTrigger value="forms">Formulários</TabsTrigger>
                            </TabsList>
                        </div>

                        <TabsContent value="components" className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Botões e Cores</CardTitle>
                                    <CardDescription>Variações do componente Button padrão.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-4">
                                    <Button variant="default">Default</Button>
                                    <Button variant="secondary">Secondary</Button>
                                    <Button variant="destructive">Destructive</Button>
                                    <Button variant="outline">Outline</Button>
                                    <Button variant="ghost">Ghost</Button>
                                    <Button variant="link">Link</Button>
                                    <Button size="sm">Small</Button>
                                    <Button size="lg">Large</Button>
                                    <Button disabled>Disabled</Button>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>Badges & Status</CardTitle>
                                </CardHeader>
                                <CardContent className="flex flex-wrap gap-4">
                                    <Badge>Default</Badge>
                                    <Badge variant="secondary">Secondary</Badge>
                                    <Badge variant="outline">Outline</Badge>
                                    <Badge variant="destructive">Destructive</Badge>
                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 border-transparent">Custom Success</Badge>
                                    <Badge className="bg-amber-500 hover:bg-amber-600 border-transparent">Custom Warning</Badge>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="risk-radar" className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Risk Radar (Live Component)</h3>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Este é o componente real, renderizado com dados mockados.
                                </p>
                                <RiskRadar
                                    deal={{
                                        id: 'preview',
                                        organization_id: 'demo-org',
                                        title: 'Exemplo de Deal',
                                        value: 150000,
                                        stage: 'negotiation',
                                        health_score: 85,
                                        health_trend: 'improving',
                                        risk_factors: [
                                            'Cliente sem orçamento definido',
                                            'Concorrente forte na disputa'
                                        ],
                                        // Mocking other required fields
                                        owner: 'Demo User',
                                        company: 'Demo Company',
                                        days_in_stage: 5,
                                        tags: [],
                                        created_at: new Date().toISOString(),
                                        // updated_at: new Date().toISOString(),
                                        // currency: 'BRL',
                                        probability: 80,
                                    }}
                                />
                            </div>
                            <div className="space-y-4">
                                <h3 className="text-lg font-medium">Versão Crítica</h3>
                                <RiskRadar
                                    deal={{
                                        id: 'preview-critical',
                                        organization_id: 'demo-org',
                                        title: 'Deal em Risco',
                                        value: 500000,
                                        stage: 'proposal',
                                        health_score: 25,
                                        health_trend: 'declining',
                                        risk_factors: [
                                            'Decisor chave saiu da empresa',
                                            'Sem resposta há 15 dias',
                                            'Budget congelado'
                                        ],
                                        owner: 'Demo User',
                                        company: 'Demo Company',
                                        days_in_stage: 15,
                                        tags: [],
                                        created_at: new Date().toISOString(),
                                        // updated_at: new Date().toISOString(),
                                        // currency: 'BRL',
                                        probability: 20,
                                    }}
                                />
                            </div>
                        </TabsContent>

                        <TabsContent value="forms">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Inputs de Texto</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4 max-w-md">
                                    <div className="grid w-full items-center gap-1.5">
                                        <label htmlFor="email" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Email</label>
                                        <Input type="email" id="email" placeholder="Email" />
                                    </div>
                                    <div className="grid w-full items-center gap-1.5">
                                        <label htmlFor="name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">Nome Completo</label>
                                        <Input type="text" id="name" placeholder="Nome do cliente" />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </section>
            </main>
        </div>
    );
}
