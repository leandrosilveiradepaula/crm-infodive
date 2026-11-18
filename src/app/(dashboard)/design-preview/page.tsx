'use client';

import { CheckCircle2, CircleAlert, Plus, Search } from 'lucide-react';
import { PageHeader } from '@/components/layout/PageHeader';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

export default function DesignPreviewPage() {
    return (
        <div className="space-y-6 pb-6">
            <PageHeader
                title="Catálogo do design system"
                description="Referência interna das primitivas compartilhadas do CRM Infodive."
            >
                <Button><Plus /> Nova ação</Button>
            </PageHeader>

            <section className="grid gap-4 lg:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Ações e estados</CardTitle>
                        <CardDescription>Hierarquia clara para ações primárias, secundárias e destrutivas.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-wrap items-center gap-3">
                        <Button>Salvar alterações</Button>
                        <Button variant="outline">Cancelar</Button>
                        <Button variant="ghost">Ver detalhes</Button>
                        <Button variant="destructive">Excluir</Button>
                        <Badge className="bg-success text-success-foreground"><CheckCircle2 /> Concluído</Badge>
                        <Badge className="bg-warning text-warning-foreground"><CircleAlert /> Atenção</Badge>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Campos de formulário</CardTitle>
                        <CardDescription>Controles com altura, foco e contraste consistentes.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid gap-4">
                        <div className="grid gap-1.5">
                            <Label htmlFor="catalog-search">Busca</Label>
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                                <Input id="catalog-search" className="pl-9" placeholder="Buscar cliente" />
                            </div>
                        </div>
                        <div className="grid gap-1.5">
                            <Label htmlFor="catalog-note">Observação</Label>
                            <Textarea id="catalog-note" placeholder="Registre uma observação…" />
                        </div>
                    </CardContent>
                </Card>
            </section>

            <Card>
                <CardHeader>
                    <CardTitle>Tabela</CardTitle>
                    <CardDescription>Densidade legível, cabeçalho discreto e estados semânticos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Responsável</TableHead></TableRow></TableHeader>
                        <TableBody>
                            <TableRow><TableCell className="font-medium">Empresa exemplo</TableCell><TableCell><Badge variant="secondary">Em andamento</Badge></TableCell><TableCell className="text-right">Equipe comercial</TableCell></TableRow>
                            <TableRow><TableCell className="font-medium">Conta demonstração</TableCell><TableCell><Badge className="bg-info text-info-foreground">Qualificado</Badge></TableCell><TableCell className="text-right">Infodive</TableCell></TableRow>
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
