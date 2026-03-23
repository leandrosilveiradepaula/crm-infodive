'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { SignaturePad, type SignatureMode } from './SignaturePad';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    proposalToken: string;
    proposalTitle: string;
    companyName?: string;
}

export function SignatureModal({ isOpen, onClose, proposalToken, proposalTitle, companyName }: SignatureModalProps) {
    const [step, setStep] = useState<'signature' | 'details' | 'success'>('signature');
    const [signatureData, setSignatureData] = useState<string>('');
    const [signatureMode, setSignatureMode] = useState<SignatureMode>('draw');
    const [loading, setLoading] = useState(false);

    // Form fields
    const [signerName, setSignerName] = useState('');
    const [signerEmail, setSignerEmail] = useState('');
    const [signerCompany, setSignerCompany] = useState(companyName || '');
    const [signerTitle, setSignerTitle] = useState('');
    const [agreedToTerms, setAgreedToTerms] = useState(false);

    const handleSignatureSave = (data: string, mode: SignatureMode) => {
        setSignatureData(data);
        setSignatureMode(mode);
        setStep('details');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!agreedToTerms) {
            toast.error('Você deve concordar com os termos para assinar');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/proposals/sign', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    token: proposalToken,
                    signatureData,
                    signatureType: signatureMode,
                    signerName,
                    signerEmail,
                    signerCompany,
                    signerTitle,
                }),
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao assinar proposta');
            }

            setStep('success');
            toast.success('Proposta assinada com sucesso!');

            // Auto-close after 3 seconds
            setTimeout(() => {
                onClose();
                window.location.reload(); // Reload to show updated status
            }, 3000);
        } catch (error: any) {
            toast.error(error.message);
            setLoading(false);
        }
    };

    const handleClose = () => {
        setStep('signature');
        setSignatureData('');
        setSignerName('');
        setSignerEmail('');
        setSignerCompany('');
        setSignerTitle('');
        setAgreedToTerms(false);
        setLoading(false);
        onClose();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>
                        {step === 'signature' && 'Assinar Proposta'}
                        {step === 'details' && 'Confirmar Informações'}
                        {step === 'success' && 'Proposta Assinada!'}
                    </DialogTitle>
                    <DialogDescription>
                        {step === 'signature' && 'Desenhe, digite ou faça upload da sua assinatura'}
                        {step === 'details' && 'Preencha seus dados para concluir a assinatura'}
                        {step === 'success' && 'Sua assinatura foi registrada com sucesso'}
                    </DialogDescription>
                </DialogHeader>

                {step === 'signature' && (
                    <SignaturePad
                        onSave={handleSignatureSave}
                        onCancel={handleClose}
                    />
                )}

                {step === 'details' && (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Preview da assinatura */}
                        <div className="border rounded-lg p-4 bg-muted">
                            <Label className="text-sm text-muted-foreground mb-2 block">Preview da Assinatura</Label>
                            <div className="bg-card border rounded p-4 flex justify-center">
                                <img src={signatureData} alt="Signature" className="max-h-24" />
                            </div>
                            <Button
                                type="button"
                                variant="link"
                                onClick={() => setStep('signature')}
                                className="mt-2 p-0 h-auto text-sm"
                            >
                                Refazer assinatura
                            </Button>
                        </div>

                        {/* Form fields */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="col-span-2 md:col-span-1">
                                <Label htmlFor="name">Nome Completo *</Label>
                                <Input
                                    id="name"
                                    value={signerName}
                                    onChange={(e) => setSignerName(e.target.value)}
                                    required
                                    placeholder="João Silva"
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <Label htmlFor="email">Email *</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={signerEmail}
                                    onChange={(e) => setSignerEmail(e.target.value)}
                                    required
                                    placeholder="joao@empresa.com"
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <Label htmlFor="company">Empresa</Label>
                                <Input
                                    id="company"
                                    value={signerCompany}
                                    onChange={(e) => setSignerCompany(e.target.value)}
                                    placeholder="Nome da Empresa"
                                />
                            </div>
                            <div className="col-span-2 md:col-span-1">
                                <Label htmlFor="title">Cargo</Label>
                                <Input
                                    id="title"
                                    value={signerTitle}
                                    onChange={(e) => setSignerTitle(e.target.value)}
                                    placeholder="Diretor, Gerente, etc."
                                />
                            </div>
                        </div>

                        {/* Terms */}
                        <div className="flex items-start space-x-2 border rounded-lg p-4 bg-muted/50">
                            <Checkbox
                                id="terms"
                                checked={agreedToTerms}
                                onCheckedChange={(checked) => setAgreedToTerms(checked as boolean)}
                            />
                            <div className="space-y-1 leading-none">
                                <Label
                                    htmlFor="terms"
                                    className="text-sm font-normal cursor-pointer"
                                >
                                    Ao assinar, concordo com todos os termos e condições apresentados nesta proposta
                                    <strong className="block mt-1 text-xs text-muted-foreground">
                                        Proposta: {proposalTitle}
                                    </strong>
                                </Label>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => setStep('signature')} disabled={loading}>
                                Voltar
                            </Button>
                            <Button type="submit" disabled={loading || !agreedToTerms} className="bg-green-600 hover:bg-green-700">
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Assinando...
                                    </>
                                ) : (
                                    'Assinar Proposta'
                                )}
                            </Button>
                        </div>
                    </form>
                )}

                {step === 'success' && (
                    <div className="text-center py-8">
                        <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold mb-2">Assinatura Confirmada!</h3>
                        <p className="text-muted-foreground mb-4">
                            Sua assinatura foi registrada com sucesso.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Um certificado digital foi gerado e pode ser validado a qualquer momento.
                        </p>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
