'use client';

import React, { useState, useEffect } from 'react';
import {
    CheckCircle2,
    ArrowRight,
    DollarSign,
    Truck,
    Calendar,
    AlertTriangle,
    Loader2,
    Building2,
    FileText,
    Paperclip,
    User,
    MapPin,
    Package,
    Trash2,
    Plus
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { formatCurrency } from '@/utils/format';
import type { Deal } from '@/types/deal';
import { convertDealToSalesOrdersAction, downloadDistributorOrderAction } from '@/app/(dashboard)/sales/actions';
import { updateDealStage, uploadDealDocument, getDealDetails } from '@/app/(dashboard)/pipeline/actions';
import { getOrgSettings as fetchOrgSettings } from '@/app/(dashboard)/settings/actions';
import { useAuth } from '@/hooks/useAuth';
import { type OrgSettings } from '@/services/SettingsService';

interface WonDealWizardProps {
    deal: Deal;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: (deal: Deal) => void;
}

export function WonDealWizard({ deal, isOpen, onClose, onSuccess }: WonDealWizardProps) {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
    const [evidenceCategory, setEvidenceCategory] = useState<'email_confirmacao' | 'ordem_compra' | 'proposta_assinada'>('email_confirmacao');
    const [uploadedDoc, setUploadedDoc] = useState<any | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);
    const [hasConsolidated, setHasConsolidated] = useState(false);

    // Comprehensive Order State
    const [formData, setFormData] = useState({
        // Dealer
        dealerName: '',
        dealerCnpj: '',

        // User
        userName: '',
        userCnpj: '',
        userIe: '',
        userAddress: '',
        userNeighborhood: '',
        userZip: '',
        userCity: '',
        userState: '',
        userContact: '',
        userPhone: '',
        userEmail: '',

        // Order
        bidNumber: '',
        billingType: 'end_user' as 'reseller' | 'end_user',
        paymentTerms: '30 DDF',

        // Products
        products: [] as Array<{ sku: string; quantity: number; unitPrice: number }>
    });

    // Initialize data
    useEffect(() => {
        if (isOpen && deal) {
            const loadFullDetails = async () => {
                setIsLoading(true);
                try {
                    // Fetch most recent deal state with full account info
                    const fullDeal = await getDealDetails(deal.id);
                    if (!fullDeal) return;

                    const primaryContact = fullDeal.account?.contacts?.find((c: any) => c.is_primary) || fullDeal.account?.contacts?.[0];
                    const address = fullDeal.account ? `${fullDeal.account.street || ''}, ${fullDeal.account.number || ''} ${fullDeal.account.complement || ''}`.trim() : '';

                    setFormData(prev => ({
                        ...prev,
                        userName: fullDeal.account?.name || fullDeal.company || '',
                        userCnpj: fullDeal.account?.cnpj || '',
                        userIe: fullDeal.account?.ie || '',
                        userAddress: address,
                        userNeighborhood: fullDeal.account?.neighborhood || '',
                        userZip: fullDeal.account?.zip || '',
                        userCity: fullDeal.account?.city || '',
                        userState: fullDeal.account?.state || '',
                        userContact: primaryContact?.name || fullDeal.contact_name || '',
                        userPhone: primaryContact?.mobile_phone || primaryContact?.landline_phone || fullDeal.contact_phone || '',
                        userEmail: primaryContact?.email || fullDeal.contact_email || '',
                        products: (fullDeal.deal_products || []).map((p: any) => ({
                            sku: p.sku || p.name,
                            quantity: p.quantity || 1,
                            unitPrice: p.unit_price || 0
                        }))
                    }));
                } catch (error) {
                    console.error('Error loading full deal details:', error);
                } finally {
                    setIsLoading(false);
                }
            };

            loadFullDetails();

            // Fetch Org Settings via Server Action (avoids service role key error on client)
            fetchOrgSettings().then(settings => {
                setFormData(prev => ({
                    ...prev,
                    dealerName: settings.name || '',
                    dealerCnpj: settings.cnpj || ''
                }));
            });
        }
    }, [isOpen, deal.id]);

    // Calculate grouped info
    const distributors = Array.from(new Set((deal.deal_products || []).map(p => p.distributor_id))).filter(Boolean);
    const totalValue = (deal.deal_products || []).reduce((sum, p) => sum + (p.unit_price * p.quantity), 0);
    const hasIndirect = (deal.deal_products || []).some(p => p.billing_type === 'indirect');

    const handleUpload = async () => {
        if (!evidenceFile) return;

        setIsUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', evidenceFile);
            formData.append('category', evidenceCategory);
            formData.append('description', `Evidência de fechamento: ${deal.title}`);

            const result = await uploadDealDocument(deal.id, formData);
            setUploadedDoc(result);
            toast.success('Evidência enviada com sucesso!');
        } catch (error: any) {
            toast.error('Erro ao enviar evidência: ' + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleConfirm = async () => {
        if (!uploadedDoc) {
            toast.error('É obrigatório anexar uma evidência de fechamento.');
            setStep(2);
            return;
        }

        setIsLoading(true);
        try {
            // 1. Create Sales Orders in DB + Save Excel Document
            const result = await convertDealToSalesOrdersAction(deal.id, formData) as any;

            if (!result.success) {
                throw new Error(result.error || 'Erro ao gerar pedidos');
            }

            // 2. Update Deal Stage to Won (final consolidation)
            await updateDealStage(deal.id, 'won', 100);

            toast.success('Parabéns! Venda consolidada e pedidos gerados.');
            setHasConsolidated(true);
            setStep(4); // Move to success step
        } catch (error: any) {
            toast.error(error.message || 'Erro ao processar fechamento');
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDownloadOrder = async () => {
        setIsDownloading(true);
        try {
            const result = await downloadDistributorOrderAction(deal.id, formData);
            if (result.success && result.base64) {
                // Trigger browser download
                const link = document.createElement('a');
                link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${result.base64}`;
                link.download = result.fileName || 'pedido.xlsx';
                link.click();
                toast.success('Pedido baixado com sucesso!');
            } else {
                throw new Error(result.error || 'Erro ao gerar arquivo');
            }
        } catch (error: any) {
            toast.error('Erro no download: ' + error.message);
        } finally {
            setIsDownloading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-2xl p-0 gap-0 bg-background border-border overflow-hidden">
                <div className="bg-emerald-600 p-8 text-white relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <DollarSign className="w-32 h-32" />
                    </div>
                    <div className="relative z-10">
                        <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center mb-4">
                            <CheckCircle2 className="w-6 h-6" />
                        </div>
                        <DialogTitle className="text-2xl font-bold">Consolidar Venda</DialogTitle>
                        <DialogDescription className="text-white/80 mt-1">
                            {deal.title} • {deal.company}
                        </DialogDescription>
                    </div>
                </div>

                <div className="p-8">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-muted/50 rounded-xl border border-border">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Valor Total</p>
                                    <p className="text-xl font-black text-foreground">{formatCurrency(totalValue)}</p>
                                </div>
                                <div className="p-4 bg-muted/50 rounded-xl border border-border">
                                    <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider mb-1">Distribuidores</p>
                                    <p className="text-xl font-black text-foreground">{distributors.length || 'Venda Direta'}</p>
                                </div>
                            </div>

                            <section className="space-y-3">
                                <h4 className="text-xs font-bold text-foreground flex items-center gap-2">
                                    <Truck className="w-4 h-4 text-emerald-500" />
                                    Fluxo de Pedidos
                                </h4>
                                <div className="text-sm text-muted-foreground leading-relaxed">
                                    {distributors.length > 0 ? (
                                        <p>
                                            O sistema irá gerar <strong>{distributors.length} pedido(s) de venda</strong> automaticamente,
                                            separados por cada distribuidor identificado nos produtos.
                                        </p>
                                    ) : (
                                        <p>Esta é uma venda <strong>direta</strong>. Um pedido de faturamento direto será gerado.</p>
                                    )}
                                </div>
                            </section>

                            <section className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-900/50 rounded-xl">
                                <div className="flex gap-3">
                                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                                    <div className="text-xs text-amber-800 dark:text-amber-200">
                                        <p className="font-bold mb-1">Verificação Final</p>
                                        <p>Certifique-se de que todos os produtos e margens estão corretos. Uma vez consolidada, a oportunidade não poderá ser reaberta sem permissão administrativa.</p>
                                    </div>
                                </div>
                            </section>
                        </div>
                    ) : step === 2 ? (
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="p-1.5 bg-blue-100 rounded-lg">
                                    <FileText className="w-4 h-4 text-primary" />
                                </div>
                                <h4 className="text-sm font-bold text-foreground">Comprovação de Fechamento</h4>
                            </div>

                            <p className="text-xs text-muted-foreground">
                                Para prosseguir, é obrigatório anexar um documento que comprove o aceite do cliente.
                            </p>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Tipo de Evidência</p>
                                    <Select
                                        value={evidenceCategory}
                                        onValueChange={(v: any) => setEvidenceCategory(v)}
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="email_confirmacao">E-mail de "De Acordo"</SelectItem>
                                            <SelectItem value="ordem_compra">Ordem de Compra (PO)</SelectItem>
                                            <SelectItem value="proposta_assinada">Proposta Assinada</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>

                                {!uploadedDoc ? (
                                    <div className="space-y-4">
                                        <div className="relative border-2 border-dashed border-border rounded-xl p-8 text-center bg-muted/20 hover:border-blue-500/50 transition-colors">
                                            <div className="w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                                <Paperclip className="w-6 h-6 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-foreground">Clique para selecionar o arquivo</p>
                                                <p className="text-[10px] text-muted-foreground mt-1">PDF, PNG, JPG ou DOCX até 25MB</p>
                                            </div>
                                            <input
                                                type="file"
                                                className="absolute inset-0 opacity-0 cursor-pointer"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0] || null;
                                                    setEvidenceFile(file);
                                                    if (file && file.type.startsWith('image/')) {
                                                        const url = URL.createObjectURL(file);
                                                        setPreviewUrl(url);
                                                    } else {
                                                        setPreviewUrl(null);
                                                    }
                                                }}
                                            />
                                        </div>

                                        {evidenceFile && (
                                            <div className="space-y-3 animate-in fade-in slide-in-from-top-2">
                                                {evidenceFile.type.startsWith('image/') && (
                                                    <div className="relative aspect-video rounded-xl overflow-hidden border border-border">
                                                        <img
                                                            src={previewUrl || ''}
                                                            alt="Preview"
                                                            className="w-full h-full object-cover"
                                                        />
                                                    </div>
                                                )}

                                                <div className="p-3 bg-muted rounded-xl flex items-center justify-between border border-border">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <FileText className="w-4 h-4 text-primary shrink-0" />
                                                        <span className="text-xs font-semibold truncate text-foreground">{evidenceFile.name}</span>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        className="bg-primary hover:bg-primary/90 text-white h-8 text-xs font-bold"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleUpload();
                                                        }}
                                                        disabled={isUploading}
                                                    >
                                                        {isUploading ? (
                                                            <Loader2 className="w-4 h-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <ArrowRight className="w-4 h-4 mr-1" />
                                                                Confirmar Upload
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-900/50 rounded-xl p-4 flex items-center gap-4">
                                        <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800 rounded-full flex items-center justify-center shrink-0">
                                            <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-xs font-bold text-emerald-800 dark:text-emerald-200 truncate">{uploadedDoc.name}</p>
                                            <p className="text-[10px] text-emerald-600 dark:text-emerald-400 uppercase font-black">{evidenceCategory.replace('_', ' ')}</p>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="text-muted-foreground"
                                            onClick={() => {
                                                setUploadedDoc(null);
                                                setEvidenceFile(null);
                                            }}
                                        >
                                            Trocar
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : step === 3 ? (
                        <div className="space-y-4 py-2">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                                        <FileText className="w-4 h-4 text-primary" />
                                    </div>
                                    <h3 className="text-sm font-bold text-foreground uppercase tracking-widest">Revisão Completa do Pedido</h3>
                                </div>
                                <span className="text-[10px] bg-primary/10 text-primary px-2 py-1 rounded-full font-bold">ESTILO PRESERVADO</span>
                            </div>

                            <ScrollArea className="h-[400px] pr-4">
                                <div className="space-y-8 pb-4">
                                    {/* SEÇÃO 1: REVENDA */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-primary">
                                            <Building2 className="w-4 h-4" />
                                            <h4 className="text-[11px] font-black uppercase tracking-widest">Dados da Revenda (Sua Empresa)</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Razão Social</Label>
                                                <Input
                                                    value={formData.dealerName}
                                                    onChange={e => setFormData({ ...formData, dealerName: e.target.value })}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">CNPJ</Label>
                                                <Input
                                                    value={formData.dealerCnpj}
                                                    onChange={e => setFormData({ ...formData, dealerCnpj: e.target.value })}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* SEÇÃO 2: USUÁRIO FINAL */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-emerald-600">
                                            <User className="w-4 h-4" />
                                            <h4 className="text-[11px] font-black uppercase tracking-widest">Dados do Usuário Final (Cliente)</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5 col-span-2">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Razão Social / Nome</Label>
                                                <Input
                                                    value={formData.userName}
                                                    onChange={e => setFormData({ ...formData, userName: e.target.value })}
                                                    className="h-9 text-xs font-bold"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">CNPJ / CPF</Label>
                                                <Input
                                                    value={formData.userCnpj}
                                                    onChange={e => setFormData({ ...formData, userCnpj: e.target.value })}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Inscrição Estadual</Label>
                                                <Input
                                                    value={formData.userIe}
                                                    onChange={e => setFormData({ ...formData, userIe: e.target.value })}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1.5 col-span-2">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Endereço Completo</Label>
                                                <Input
                                                    value={formData.userAddress}
                                                    onChange={e => setFormData({ ...formData, userAddress: e.target.value })}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Bairro</Label>
                                                <Input
                                                    value={formData.userNeighborhood}
                                                    onChange={e => setFormData({ ...formData, userNeighborhood: e.target.value })}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">CEP</Label>
                                                <Input
                                                    value={formData.userZip}
                                                    onChange={e => setFormData({ ...formData, userZip: e.target.value })}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Cidade</Label>
                                                <Input
                                                    value={formData.userCity}
                                                    onChange={e => setFormData({ ...formData, userCity: e.target.value })}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Estado (UF)</Label>
                                                <Input
                                                    value={formData.userState}
                                                    onChange={e => setFormData({ ...formData, userState: e.target.value })}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                        </div>

                                        <div className="p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-100 dark:border-emerald-900/30 grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Contato</Label>
                                                <Input
                                                    value={formData.userContact}
                                                    onChange={e => setFormData({ ...formData, userContact: e.target.value })}
                                                    className="h-8 text-xs bg-background"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Telefone</Label>
                                                <Input
                                                    value={formData.userPhone}
                                                    onChange={e => setFormData({ ...formData, userPhone: e.target.value })}
                                                    className="h-8 text-xs bg-background"
                                                />
                                            </div>
                                            <div className="space-y-1.5 col-span-2">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">E-mail para Licenças/Faturamento</Label>
                                                <Input
                                                    value={formData.userEmail}
                                                    onChange={e => setFormData({ ...formData, userEmail: e.target.value })}
                                                    className="h-8 text-xs bg-background font-mono"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* SEÇÃO 3: DETALHES DO PEDIDO */}
                                    <div className="space-y-4">
                                        <div className="flex items-center gap-2 text-amber-600">
                                            <Package className="w-4 h-4" />
                                            <h4 className="text-[11px] font-black uppercase tracking-widest">Informações do Pedido Ingram</h4>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-1.5 col-span-2">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Faturamento por conta de:</Label>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Button
                                                        variant={formData.billingType === 'reseller' ? 'default' : 'outline'}
                                                        size="sm"
                                                        className={formData.billingType === 'reseller' ? 'bg-primary font-bold' : ''}
                                                        onClick={() => setFormData({ ...formData, billingType: 'reseller' })}
                                                    >
                                                        Revenda
                                                    </Button>
                                                    <Button
                                                        variant={formData.billingType === 'end_user' ? 'default' : 'outline'}
                                                        size="sm"
                                                        className={formData.billingType === 'end_user' ? 'bg-primary font-bold' : ''}
                                                        onClick={() => setFormData({ ...formData, billingType: 'end_user' })}
                                                    >
                                                        Usuário Final
                                                    </Button>
                                                </div>
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">BID / Proposta Ingram</Label>
                                                <Input
                                                    placeholder="Ex: 3182875/1"
                                                    value={formData.bidNumber}
                                                    onChange={e => setFormData({ ...formData, bidNumber: e.target.value })}
                                                    className="h-9 text-xs font-mono bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50"
                                                />
                                            </div>
                                            <div className="space-y-1.5">
                                                <Label className="text-[10px] text-muted-foreground uppercase font-bold">Condição de Pagamento</Label>
                                                <Input
                                                    placeholder="Ex: 30 DDF"
                                                    value={formData.paymentTerms}
                                                    onChange={e => setFormData({ ...formData, paymentTerms: e.target.value })}
                                                    className="h-9 text-xs"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* SEÇÃO 4: GRADE DE PRODUTOS */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-2 text-blue-600">
                                                <Truck className="w-4 h-4" />
                                                <h4 className="text-[11px] font-black uppercase tracking-widest">Grade de Produtos</h4>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            {formData.products.map((product, idx) => (
                                                <div key={idx} className="grid grid-cols-12 gap-2 items-end p-2 border rounded-lg bg-muted/30">
                                                    <div className="col-span-6 space-y-1">
                                                        <Label className="text-[9px] uppercase font-bold">Part Number / Nome</Label>
                                                        <Input
                                                            value={product.sku}
                                                            onChange={e => {
                                                                const newProducts = [...formData.products];
                                                                newProducts[idx].sku = e.target.value;
                                                                setFormData({ ...formData, products: newProducts });
                                                            }}
                                                            className="h-7 text-[10px]"
                                                        />
                                                    </div>
                                                    <div className="col-span-2 space-y-1">
                                                        <Label className="text-[9px] uppercase font-bold">Qtd</Label>
                                                        <Input
                                                            type="number"
                                                            value={product.quantity}
                                                            onChange={e => {
                                                                const newProducts = [...formData.products];
                                                                newProducts[idx].quantity = parseInt(e.target.value) || 0;
                                                                setFormData({ ...formData, products: newProducts });
                                                            }}
                                                            className="h-7 text-[10px]"
                                                        />
                                                    </div>
                                                    <div className="col-span-3 space-y-1">
                                                        <Label className="text-[9px] uppercase font-bold">Preço Unit.</Label>
                                                        <Input
                                                            type="number"
                                                            value={product.unitPrice}
                                                            onChange={e => {
                                                                const newProducts = [...formData.products];
                                                                newProducts[idx].unitPrice = parseFloat(e.target.value) || 0;
                                                                setFormData({ ...formData, products: newProducts });
                                                            }}
                                                            className="h-7 text-[10px]"
                                                        />
                                                    </div>
                                                    <div className="col-span-1 flex justify-center pb-1">
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            className="h-6 w-6 text-destructive hover:bg-destructive/10"
                                                            onClick={() => {
                                                                const newProducts = formData.products.filter((_, i) => i !== idx);
                                                                setFormData({ ...formData, products: newProducts });
                                                            }}
                                                        >
                                                            <Trash2 className="w-3 h-3" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="w-full h-8 border-dashed text-[10px] font-bold"
                                                onClick={() => {
                                                    setFormData({
                                                        ...formData,
                                                        products: [...formData.products, { sku: '', quantity: 1, unitPrice: 0 }]
                                                    });
                                                }}
                                            >
                                                <Plus className="w-3 h-3 mr-1" />
                                                ADICIONAR PRODUTO AO PEDIDO
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </ScrollArea>

                            <div className="bg-primary p-3 rounded-lg text-white">
                                <p className="text-[10px] leading-relaxed opacity-90">
                                    <span className="font-bold uppercase">Aviso:</span> Ao clicar em "Confirmar & Efetivar", o sistema usará exatamente os dados acima para preencher o formulário oficial da Ingram. Verifique se os impostos estão embutidos conforme a regra do distribuidor.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 py-4 text-center animate-in zoom-in-95 duration-300">
                            <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                                <CheckCircle2 className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground">Venda Sincronizada!</h3>
                                <p className="text-sm text-muted-foreground mt-2 px-6">
                                    A oportunidade foi consolidada com sucesso. Os pedidos para os distribuidores já estão disponíveis no módulo de Vendas.
                                </p>
                            </div>

                            <Separator className="my-6" />

                            <div className="space-y-3">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Automação de Pedidos</p>
                                <Button
                                    className="w-full bg-primary font-bold text-white h-12 shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                    onClick={handleDownloadOrder}
                                    disabled={isDownloading}
                                >
                                    {isDownloading ? (
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    ) : (
                                        <FileText className="w-4 h-4 mr-2" />
                                    )}
                                    Baixar Formulário Ingram (Excel)
                                </Button>
                                <p className="text-[10px] text-muted-foreground italic">
                                    *Arquivo pré-preenchido com dados da Revenda, Cliente e Produtos.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 bg-muted/30 border-t border-border mt-0">
                    {step === 4 ? (
                        <Button
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold h-11"
                            onClick={() => {
                                onSuccess({
                                    ...deal,
                                    stage: 'won',
                                    probability: 100,
                                    won_at: new Date().toISOString()
                                });
                                onClose();
                            }}
                        >
                            Concluir e Ir para Pipeline
                        </Button>
                    ) : (
                        <>
                            <Button variant="ghost" onClick={onClose} disabled={isLoading || isUploading}>
                                Cancelar
                            </Button>
                            <div className="flex gap-2">
                                {step > 1 && (
                                    <Button variant="outline" onClick={() => setStep(step - 1)} disabled={isLoading || isUploading}>
                                        Voltar
                                    </Button>
                                )}
                                {step < 3 ? (
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                                        onClick={() => setStep(step + 1)}
                                        disabled={step === 2 && !uploadedDoc}
                                    >
                                        {step === 1 ? 'Próximo: Evidência' : 'Próximo: Dados do Pedido'}
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </Button>
                                ) : (
                                    <Button
                                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold min-w-[140px]"
                                        onClick={handleConfirm}
                                        disabled={isLoading || !uploadedDoc}
                                    >
                                        {isLoading ? (
                                            <>
                                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                Processando...
                                            </>
                                        ) : (
                                            'Confirmar & Efetivar'
                                        )}
                                    </Button>
                                )}
                            </div>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
