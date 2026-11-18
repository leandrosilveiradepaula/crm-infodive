import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import { DragDropContext, Droppable } from '@hello-pangea/dnd';
import { BriefcaseBusiness, CheckCircle2, CircleAlert, Search, Users } from 'lucide-react';
import '@/app/globals.css';
import DashboardShell from '@/components/layout/DashboardShell';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import { StatsGrid } from '@/components/layout/StatsGrid';
import { FilterBar } from '@/components/layout/FilterBar';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle';
import { DealCard } from '@/components/pipeline/DealCard';

function Fixture() {
    const [view, setView] = useState<ViewMode>('cards');
    const sampleDeal = {
        id: 'visual-deal', title: 'Renovação de contrato', company: 'Empresa Exemplo', value: 45000,
        probability: 70, stage: 'proposal', owner: 'Ana Martins', tags: ['Prioridade'], days_in_stage: 3,
        expected_close_date: '2026-12-20', next_step: 'Agendar apresentação', health_score: 90,
    } as any;

    return (
        <DashboardShell>
            <div className="space-y-6 pb-6" data-testid="visual-fixture">
                <PageHeader title="Validação visual" description="Dados fictícios; nenhuma rota, sessão ou serviço do CRM é usado.">
                    <Button><BriefcaseBusiness /> Nova oportunidade</Button>
                </PageHeader>
                <section className="grid gap-4 lg:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Componentes e estados</CardTitle>
                            <CardDescription>Hierarquia, contraste e superfícies da fundação.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex flex-wrap gap-3">
                            <Button>Salvar</Button><Button variant="outline">Cancelar</Button><Button variant="ghost">Detalhes</Button><Button variant="destructive">Excluir</Button>
                            <Badge className="bg-success text-success-foreground"><CheckCircle2 /> Concluído</Badge>
                            <Badge className="bg-warning text-warning-foreground"><CircleAlert /> Atenção</Badge>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader><CardTitle>Formulário</CardTitle><CardDescription>Campos e foco visível.</CardDescription></CardHeader>
                        <CardContent className="grid gap-4">
                            <div className="grid gap-1.5"><Label htmlFor="fixture-search">Busca</Label><div className="relative"><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input id="fixture-search" className="pl-9" placeholder="Buscar cliente" /></div></div>
                            <div className="grid gap-1.5"><Label htmlFor="fixture-note">Observação</Label><Textarea id="fixture-note" placeholder="Registre uma observação…" /></div>
                        </CardContent>
                    </Card>
                </section>
                <Card>
                    <CardHeader><CardTitle>Tabela de oportunidades</CardTitle><CardDescription>Dados fictícios para verificar densidade e overflow.</CardDescription></CardHeader>
                    <CardContent>
                        <Table><TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Responsável</TableHead></TableRow></TableHeader><TableBody>
                            <TableRow><TableCell className="font-medium">Empresa Exemplo</TableCell><TableCell><Badge variant="secondary">Em andamento</Badge></TableCell><TableCell className="text-right">Ana Martins</TableCell></TableRow>
                            <TableRow><TableCell className="font-medium">Conta Demonstração</TableCell><TableCell><Badge className="bg-info text-info-foreground">Qualificado</Badge></TableCell><TableCell className="text-right">Equipe comercial</TableCell></TableRow>
                        </TableBody></Table>
                    </CardContent>
                </Card>
                <section className="space-y-4" aria-label="Prévia de workspaces B2">
                    <PageHeader title="Workspaces comerciais" description="Prévia isolada de resumo, filtros e pipeline com dados fictícios." />
                    <StatsGrid items={[
                        { label: 'Pipeline ativo', value: 'R$ 45 mil', description: '1 oportunidade', icon: BriefcaseBusiness, color: 'text-primary', gradient: '', border: '' },
                        { label: 'Leads qualificados', value: 12, description: 'Este mês', icon: Users, color: 'text-success', gradient: '', border: '' },
                    ]} />
                    <FilterBar>
                        <div className="relative flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Buscar workspaces" className="h-10 pl-9" placeholder="Buscar oportunidades, leads ou empresas" /></div>
                        <ViewToggle view={view} onViewChange={setView} />
                    </FilterBar>
                    <DragDropContext onDragEnd={() => undefined}>
                        <section className="w-80 rounded-[var(--radius-panel)] border border-primary/20 bg-primary/5 p-2" aria-label="Coluna Proposta">
                            <header className="mb-2 flex items-center justify-between rounded-[var(--radius-control)] border border-border bg-card p-3"><div><div className="flex items-center gap-2"><span className="size-2 rounded-full bg-primary" /><h3 className="text-sm font-semibold">Proposta</h3></div><p className="mt-1 text-xs text-muted-foreground">1 oportunidade</p></div><span className="text-sm font-semibold">R$ 45 mil</span></header>
                            <Droppable droppableId="proposal">{(provided) => <div ref={provided.innerRef} {...provided.droppableProps}><DealCard deal={sampleDeal} index={0} onClick={() => undefined} />{provided.placeholder}</div>}</Droppable>
                        </section>
                    </DragDropContext>
                </section>
            </div>
        </DashboardShell>
    );
}

createRoot(document.getElementById('root')!).render(<Fixture />);
