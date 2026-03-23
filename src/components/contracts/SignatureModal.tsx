import React, { useState, useRef } from 'react';
import { X, Check, Eraser, Type, Pen } from 'lucide-react';

interface SignatureModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSign: (signature: string) => void;
    contractTitle: string;
}

export const SignatureModal = ({ isOpen, onClose, onSign, contractTitle }: SignatureModalProps) => {
    const [mode, setMode] = useState<'draw' | 'type'>('type');
    const [typedName, setTypedName] = useState('');
    const [signature, setSignature] = useState<string | null>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);

    if (!isOpen) return null;

    // Canvas Logic (Simplified for Mock)
    const startDrawing = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        setIsDrawing(true);
        ctx.beginPath();
        ctx.moveTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
    };

    const draw = (e: React.MouseEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.lineTo(e.nativeEvent.offsetX, e.nativeEvent.offsetY);
        ctx.stroke();
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        if (canvasRef.current) {
            setSignature(canvasRef.current.toDataURL());
        }
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setSignature(null);
    };

    const handleConfirm = () => {
        if (mode === 'type' && !typedName.trim()) {
            alert('Por favor, digite seu nome.');
            return;
        }
        if (mode === 'draw' && !signature) {
            alert('Por favor, desenhe sua assinatura.');
            return;
        }

        const finalSignature = mode === 'type' ? typedName : signature || '';
        onSign(finalSignature);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-muted/50 border-b border-border p-4 flex justify-between items-center">
                    <div>
                        <h3 className="font-bold text-foreground">Assinar Contrato</h3>
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{contractTitle}</p>
                    </div>
                    <button onClick={onClose} className="text-muted-foreground hover:text-muted-foreground"><X className="h-5 w-5" /></button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    {/* Tabs */}
                    <div className="flex bg-muted/50 p-1 rounded-lg">
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${mode === 'type' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setMode('type')}
                        >
                            <Type className="h-4 w-4" /> Digitar
                        </button>
                        <button
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-medium transition-all ${mode === 'draw' ? 'bg-card text-primary shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
                            onClick={() => setMode('draw')}
                        >
                            <Pen className="h-4 w-4" /> Desenhar
                        </button>
                    </div>

                    {/* Input Area */}
                    <div className="h-40 border-2 border-dashed border-border rounded-xl bg-accent/30 flex items-center justify-center hover:border-primary/50 transition-colors relative">
                        {mode === 'type' ? (
                            <input
                                type="text"
                                placeholder="Digite seu nome completo"
                                className="w-full bg-transparent text-center text-2xl font-bold text-foreground focus:outline-none placeholder:text-muted-foreground placeholder:font-sans"
                                value={typedName}
                                onChange={e => { setTypedName(e.target.value); setSignature(e.target.value); }}
                            />
                        ) : (
                            <>
                                <canvas
                                    ref={canvasRef}
                                    width={400}
                                    height={160}
                                    className="cursor-crosshair w-full h-full"
                                    onMouseDown={startDrawing}
                                    onMouseMove={draw}
                                    onMouseUp={stopDrawing}
                                    onMouseLeave={stopDrawing}
                                />
                                {signature && (
                                    <button
                                        onClick={clearCanvas}
                                        className="absolute top-2 right-2 p-1.5 bg-muted/50 rounded-lg text-muted-foreground hover:bg-red-50 hover:text-red-500 transition-colors"
                                        title="Limpar"
                                    >
                                        <Eraser className="h-4 w-4" />
                                    </button>
                                )}
                                {!signature && !isDrawing && (
                                    <span className="absolute pointer-events-none text-muted-foreground text-sm font-medium">Desenhe sua assinatura aqui</span>
                                )}
                            </>
                        )}
                    </div>

                    <div className="bg-warning/10 border border-warning/20 p-3 rounded-lg text-xs text-warning text-justify">
                        Ao clicar em "Confirmar Assinatura", concordo legalmente com os termos deste documento e aceito o uso desta assinatura digital.
                    </div>
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-border bg-muted/50 flex justify-end gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-muted/80 rounded-lg">Cancelar</button>
                    <button
                        onClick={handleConfirm}
                        className="px-6 py-2 bg-primary text-white text-sm font-bold rounded-lg hover:bg-primary/90 shadow-md flex items-center gap-2 transition-all active:scale-95"
                    >
                        <Check className="h-4 w-4" /> Confirmar Assinatura
                    </button>
                </div>
            </div>
        </div>
    );
};
