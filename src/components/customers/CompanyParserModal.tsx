'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Sparkles, Loader2, ArrowRight, CheckCircle2, AlertCircle, Image as ImageIcon, X, Building2 } from 'lucide-react';
import Image from 'next/image';
import { toast } from 'sonner';

interface CompanyParserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onDataParsed: (data: any) => void;
}

export function CompanyParserModal({ isOpen, onClose, onDataParsed }: CompanyParserModalProps) {
    const [textInput, setTextInput] = useState('');
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
        if (!textInput.trim() && !imagePreview) return;

        setLoading(true);
        try {
            const payload = {
                text: textInput,
                image: imagePreview
            };

            const response = await fetch('/api/gemini/parse-company', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) throw new Error('Failed to parse');

            const resData = await response.json();
            if (resData.error) throw new Error(resData.error);

            setParsedData(resData.data);
            toast.success('Dados da empresa extraídos com sucesso!');
        } catch (error: any) {
            console.error(error);
            toast.error(error.message || 'Erro ao processar dados da empresa.');
        } finally {
            setLoading(false);
        }
    };

    const handleApply = () => {
        if (parsedData) {
            onDataParsed(parsedData);
            onClose();
            // Reset state
            setTextInput('');
            setImagePreview(null);
            setParsedData(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-xl bg-card border-border text-foreground p-0 overflow-hidden">
                <DialogHeader className="p-6 border-b border-border bg-gradient-to-r from-primary/10 to-info/10">
                    <DialogTitle className="flex items-center gap-2 text-xl font-bold">
                        <div className="p-2 bg-primary/10 rounded-lg border border-primary/20">
                            <Building2 className="h-5 w-5 text-primary" />
                        </div>
                        Extrair Dados da Empresa
                    </DialogTitle>
                </DialogHeader>

                <div className="p-6 space-y-6">
                    {!parsedData ? (
                        <div className="space-y-4">
                            <label className="text-sm font-medium text-muted-foreground">
                                Cole uma imagem do cartão CNPJ, cartão de visitas ou documento (Ctrl+V) ou digite os dados:
                            </label>

                            <div className="relative group">
                                <Textarea
                                    value={textInput}
                                    onChange={(e) => setTextInput(e.target.value)}
                                    onPaste={handlePaste}
                                    placeholder="Cole aqui o texto ou imagem (Ctrl+V)..."
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
                                            id="company-upload"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={handleFileSelect}
                                        />
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 text-xs text-muted-foreground hover:text-primary"
                                            onClick={() => document.getElementById('company-upload')?.click()}
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
                                    disabled={(!textInput.trim() && !imagePreview) || loading}
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
                                    <div className="col-span-2 space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Razão Social / Nome</p>
                                        <p className="font-medium">{parsedData.name || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">CNPJ</p>
                                        <p className="font-medium">{parsedData.cnpj || '-'}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Inscrição Estadual</p>
                                        <p className="font-medium">{parsedData.ie || '-'}</p>
                                    </div>
                                    <div className="col-span-2 space-y-1">
                                        <p className="text-xs text-muted-foreground uppercase font-bold">Endereço</p>
                                        <p className="font-medium">
                                            {[parsedData.street, parsedData.number, parsedData.neighborhood, parsedData.city, parsedData.state]
                                                .filter(Boolean).join(', ') || '-'}
                                        </p>
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
