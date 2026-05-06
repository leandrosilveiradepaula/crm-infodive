'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, ArrowRight, CheckCircle2, AlertCircle, Image as ImageIcon, X, Upload } from 'lucide-react';
import Image from 'next/image';
import { parseContactSignature } from '@/lib/gemini';
import { toast } from 'sonner';

interface SignatureParserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDataParsed: (data: any) => void;
}

export function SignatureParserModal({ isOpen, onClose, onDataParsed }: SignatureParserModalProps) {
    const [signature, setSignature] = useState('');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [parsedData, setParsedData] = useState<any>(null);

    const handlePaste = (e: React.ClipboardEvent) => {
        const items = e.clipboardData.items;
        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                const blob = items[i].getAsFile();
                if (blob) {
                    const reader = new FileReader();
                    reader.onload = (event) => {
                        setImagePreview(event.target?.result as string);
                    };
                    reader.readAsDataURL(blob);
                    e.preventDefault();
                }
            }
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setImagePreview(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleRemoveImage = () => {
        setImagePreview(null);
    };

    const handleParse = async () => {
        if (!signature.trim() && !imagePreview) return;

        setLoading(true);
        try {
            // Send both signature text and image if available
            // If imagePreview exists, it's a data URL (base64)
            const payload = {
                signature: signature,
                image: imagePreview
            };

            // We need to pass this payload to the server action or API route.
            // Since parseContactSignature is likely an API wrapper, let's check it.
            // Assuming parseContactSignature handles the API call, we need to update it or call fetch directly here if it doesn't support image.
            // For now, let's assume we modify the API call here directly or update the lib function later.
            // Let's call the API route directly here to ensure image support without modifying the lib file deeply if not needed, 
            // OR ideally, we update the lib function. 
            // Checking previous context, `parseContactSignature` is in `@/lib/gemini`.

            // Let's call the API directly for this specific feature to be self-contained in the modal logic 
            // or we can update the lib. Let's update the lib call effectively by sending the payload.

            const response = await fetch('/api/gemini/parse-signature', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to parse');

            const resData = await response.json();
            if (resData.error) throw new Error(resData.error);

            setParsedData(resData.data);
            toast.success('Assinatura processada com sucesso!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao processar assinatura.');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (parsedData) {
            onDataParsed(parsedData);
            onClose();
            // Reset state for next use
            setSignature('');
            setParsedData(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl bg-card border-border text-foreground p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-stage-proposal/10">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                            <Sparkles className="h-5 w-5 text-primary" />
                        </div>
                        Extrair Contato de Assinatura
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {!parsedData ? (
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-muted-foreground">
                                Cole a assinatura (texto ou imagem/print) abaixo:
                            </label>

                            <div className="relative group">
                                <Textarea
                                    value={signature}
                                    onChange={(e) => setSignature(e.target.value)}
                                    onPaste={handlePaste}
                                    placeholder="Cole aqui o texto da assinatura ou um print (Ctrl+V)..."
                                    className="min-h-[200px] bg-muted/30 border-border text-foreground resize-none focus:ring-primary pr-4"
                                />

                                {imagePreview && (
                                    <div className="absolute inset-0 bg-background/95 z-10 flex flex-col items-center justify-center p-4 border rounded-md">
                                        <div className="relative w-full h-full max-h-[180px] flex items-center justify-center">
                                            <Image
                                                src={imagePreview}
                                                alt="Preview"
                                                width={400}
                                                height={200}
                                                className="object-contain max-h-full rounded-md shadow-sm"
                                            />
                                            <Button
                                                variant="destructive"
                                                size="icon"
                                                className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                                                onClick={handleRemoveImage}
                                            >
                                                <X className="h-3 w-3" />
                                            </Button>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-2 font-medium">
                                            Imagem anexada para análise
                                        </p>
                                    </div>
                                )}

                                {!imagePreview && (
                                    <div className="absolute bottom-2 right-2">
                                        <input
                                            type="file"
                                            id="signature-upload"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs text-muted-foreground hover:text-primary"
                                            onClick={() => document.getElementById('signature-upload')?.click()}
                                        >
                                            <ImageIcon className="h-4 w-4 mr-1" />
                                            Carregar Imagem
                                        </Button>
                                    </div>
                                )}
                            </div>
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleParse}
                                    disabled={(!signature.trim() && !imagePreview) || loading}
                                    className="bg-primary hover:bg-primary/90 text-white font-bold shadow-lg shadow-primary/20"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Processando...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="mr-2 h-4 w-4" />
                                            Extrair Dados
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4">
                            <div className="bg-muted/30 rounded-xl p-4 border border-border space-y-3">
                                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    Dados Identificados
                                </h3>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Nome</p>
                                        <p className="font-medium">{parsedData.name || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Empresa</p>
                                        <p className="font-medium">{parsedData.company || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Email</p>
                                        <p className="font-medium">{parsedData.email || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Cargo</p>
                                        <p className="font-medium">{parsedData.role || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Celular</p>
                                        <p className="font-medium">{parsedData.mobile_phone || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">LinkedIn</p>
                                        <p className="font-medium truncate">{parsedData.linkedin || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">WhatsApp</p>
                                        <p className="font-medium">{parsedData.whatsapp || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Telefone Fixo</p>
                                        <p className="font-medium">{parsedData.landline_phone || '-'}</p>
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Endereço</p>
                                        <p className="font-medium">{parsedData.address || '-'}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 bg-info/10 p-3 rounded-lg border border-info/20">
                                <AlertCircle className="h-4 w-4 text-info flex-shrink-0" />
                                <p className="text-xs text-info">
                                    Verifique os dados antes de confirmar. A IA pode cometer erros.
                                </p>
                            </div>

                            <div className="flex gap-3 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setParsedData(null)}
                                    className="flex-1"
                                >
                                    Voltar
                                </Button>
                                <Button
                                    onClick={handleApply}
                                    className="flex-1 bg-success hover:bg-success/90 text-white font-bold shadow-lg shadow-success/20"
                                >
                                    Usar Estes Dados
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
