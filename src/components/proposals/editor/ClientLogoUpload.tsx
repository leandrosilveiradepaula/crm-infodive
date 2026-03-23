'use client';

import React, { useState, useCallback, useRef } from 'react';
import { Upload, X, ImageIcon, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface ClientLogoUploadProps {
    currentLogo?: string;
    onLogoChange: (logoDataUrl: string | undefined) => void;
}

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp'];

export function ClientLogoUpload({ currentLogo, onLogoChange }: ClientLogoUploadProps) {
    const [isDragging, setIsDragging] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFile = useCallback(async (file: File) => {
        if (!ACCEPTED_TYPES.includes(file.type)) {
            toast.error('Formato não suportado. Use PNG, JPG ou WebP.');
            return;
        }
        if (file.size > MAX_FILE_SIZE) {
            toast.error('Arquivo muito grande. Máximo: 2MB.');
            return;
        }

        setIsLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    // Resize logic
                    const MAX_WIDTH = 400;
                    const MAX_HEIGHT = 400;
                    let width = img.width;
                    let height = img.height;

                    if (width > height) {
                        if (width > MAX_WIDTH) {
                            height *= MAX_WIDTH / width;
                            width = MAX_WIDTH;
                        }
                    } else {
                        if (height > MAX_HEIGHT) {
                            width *= MAX_HEIGHT / height;
                            height = MAX_HEIGHT;
                        }
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    if (!ctx) {
                        toast.error('Erro ao processar imagem.');
                        setIsLoading(false);
                        return;
                    }

                    ctx.drawImage(img, 0, 0, width, height);
                    const dataUrl = canvas.toDataURL(file.type === 'image/jpeg' ? 'image/jpeg' : 'image/png', 0.85);

                    onLogoChange(dataUrl);
                    setIsLoading(false);
                    toast.success('Logo carregado com sucesso!');
                };
                img.onerror = () => {
                    setIsLoading(false);
                    toast.error('Erro ao ler a imagem.');
                };
                img.src = e.target?.result as string;
            };
            reader.onerror = () => {
                setIsLoading(false);
                toast.error('Erro ao ler o arquivo.');
            };
            reader.readAsDataURL(file);
        } catch {
            setIsLoading(false);
            toast.error('Erro ao processar a imagem.');
        }
    }, [onLogoChange]);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleFile(file);
    }, [handleFile]);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    }, []);

    const handleDragLeave = useCallback(() => {
        setIsDragging(false);
    }, []);

    const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) handleFile(file);
        // Reset input value so the same file can be re-selected
        e.target.value = '';
    }, [handleFile]);

    const removeLogo = useCallback(() => {
        onLogoChange(undefined);
        toast.info('Logo removido.');
    }, [onLogoChange]);

    return (
        <div className="space-y-2">
            <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1.5 block">
                Logo do Cliente
            </label>

            {currentLogo ? (
                /* Preview with remove button */
                <div className="relative group rounded-lg border border-border bg-white dark:bg-muted/20 p-3 flex items-center gap-3">
                    <img
                        src={currentLogo}
                        alt="Logo do cliente"
                        className="h-10 w-auto max-w-[100px] object-contain rounded"
                    />
                    <div className="flex-1">
                        <p className="text-[10px] text-emerald-600 font-bold">Logo carregado ✓</p>
                        <p className="text-[9px] text-muted-foreground">Aparecerá na capa</p>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={removeLogo}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-7 w-7 p-0 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10"
                    >
                        <X className="w-3.5 h-3.5" />
                    </Button>
                </div>
            ) : (
                /* Drop zone */
                <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center gap-2 cursor-pointer transition-all ${isDragging
                        ? 'border-blue-400 bg-blue-50/50 dark:bg-blue-500/10'
                        : 'border-border hover:border-blue-300 hover:bg-muted/30'
                        }`}
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                        <div className="w-8 h-8 rounded-full bg-muted/50 flex items-center justify-center">
                            <ImageIcon className="w-4 h-4 text-muted-foreground" />
                        </div>
                    )}
                    <div className="text-center">
                        <p className="text-[10px] font-bold text-foreground">
                            {isDragging ? 'Solte aqui' : 'Arraste ou clique'}
                        </p>
                        <p className="text-[9px] text-muted-foreground">PNG, JPG ou WebP (máx. 2MB)</p>
                    </div>
                </div>
            )}

            <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                accept=".png,.jpg,.jpeg,.webp"
                onChange={handleInputChange}
            />
        </div>
    );
}
