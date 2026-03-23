'use client';

import { useRef, useState } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Pencil, Type, Upload, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type SignatureMode = 'draw' | 'type' | 'upload';

interface SignaturePadProps {
    onSave: (data: string, mode: SignatureMode) => void;
    onCancel: () => void;
}

export function SignaturePad({ onSave, onCancel }: SignaturePadProps) {
    const [mode, setMode] = useState<SignatureMode>('draw');
    const [typedName, setTypedName] = useState('');
    const [uploadedImage, setUploadedImage] = useState<string | null>(null);
    const signatureRef = useRef<SignatureCanvas>(null);

    const handleClear = () => {
        if (mode === 'draw') {
            signatureRef.current?.clear();
        } else if (mode === 'type') {
            setTypedName('');
        } else {
            setUploadedImage(null);
        }
    };

    const handleSave = () => {
        let data = '';

        if (mode === 'draw') {
            if (signatureRef.current?.isEmpty()) {
                alert('Por favor, desenhe sua assinatura');
                return;
            }
            data = signatureRef.current?.toDataURL() || '';
        } else if (mode === 'type') {
            if (!typedName.trim()) {
                alert('Por favor, digite seu nome');
                return;
            }
            // Render typed name as canvas
            const canvas = document.createElement('canvas');
            canvas.width = 500;
            canvas.height = 150;
            const ctx = canvas.getContext('2d')!;
            ctx.font = '48px "Brush Script MT", cursive';
            ctx.fillStyle = '#000';
            ctx.fillText(typedName, 20, 100);
            data = canvas.toDataURL();
        } else {
            if (!uploadedImage) {
                alert('Por favor, faça upload de uma imagem');
                return;
            }
            data = uploadedImage;
        }

        onSave(data, mode);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                setUploadedImage(event.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="space-y-4">
            {/* Mode Selector */}
            <div className="flex gap-2 p-1 bg-muted rounded-lg">
                <Button
                    variant={mode === 'draw' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMode('draw')}
                    className="flex-1"
                >
                    <Pencil className="h-4 w-4 mr-2" />
                    Desenhar
                </Button>
                <Button
                    variant={mode === 'type' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMode('type')}
                    className="flex-1"
                >
                    <Type className="h-4 w-4 mr-2" />
                    Digitar
                </Button>
                <Button
                    variant={mode === 'upload' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMode('upload')}
                    className="flex-1"
                >
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                </Button>
            </div>

            {/* Signature Area */}
            <div className="border-2 border-dashed border-border rounded-lg bg-card min-h-[200px] flex items-center justify-center">
                {mode === 'draw' && (
                    <SignatureCanvas
                        ref={signatureRef}
                        canvasProps={{
                            className: 'w-full h-[200px] cursor-crosshair',
                        }}
                        backgroundColor="white"
                    />
                )}

                {mode === 'type' && (
                    <div className="w-full p-8">
                        <Input
                            value={typedName}
                            onChange={(e) => setTypedName(e.target.value)}
                            placeholder="Digite seu nome completo"
                            className="text-center text-3xl"
                            style={{ fontFamily: '"Brush Script MT", cursive' }}
                        />
                    </div>
                )}

                {mode === 'upload' && (
                    <div className="text-center p-8 w-full">
                        {uploadedImage ? (
                            <img src={uploadedImage} alt="Uploaded signature" className="max-h-[160px] mx-auto" />
                        ) : (
                            <label className="cursor-pointer block">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileUpload}
                                    className="hidden"
                                />
                                <div className="text-muted-foreground">
                                    <Upload className="h-12 w-12 mx-auto mb-2" />
                                    <p>Clique para fazer upload da assinatura</p>
                                    <p className="text-sm mt-1">PNG, JPG ou SVG</p>
                                </div>
                            </label>
                        )}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-between">
                <Button variant="outline" onClick={handleClear}>
                    <RotateCcw className="h-4 w-4 mr-2" />
                    Limpar
                </Button>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={onCancel}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
                        Confirmar Assinatura
                    </Button>
                </div>
            </div>
        </div>
    );
}
