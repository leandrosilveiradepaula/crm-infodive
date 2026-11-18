import { createRoot } from 'react-dom/client';
import { BriefcaseBusiness, CheckCircle2, CircleAlert, Search } from 'lucide-react';
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

function Fixture() {
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
            </div>
        </DashboardShell>
    );
}

createRoot(document.getElementById('root')!).render(<Fixture />);
