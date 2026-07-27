import { useRef, useEffect, useState } from 'react';
import { Eraser, Check } from 'lucide-react';

interface SignaturePadProps {
    onSave: (signature: string) => void;
    onCancel: () => void;
}

export const SignaturePad = ({ onSave, onCancel }: SignaturePadProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [hasSignature, setHasSignature] = useState(false);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Set dimensions (responsive)
        const resizeCanvas = () => {
            const parent = canvas.parentElement;
            if (parent) {
                canvas.width = parent.clientWidth;
                canvas.height = 200; // Fixed height

                // Reset style
                const isDark = document.documentElement.classList.contains('dark');
                ctx.strokeStyle = isDark ? '#ffffff' : '#000000';
                ctx.lineWidth = 2;
                ctx.lineCap = 'round';
                ctx.lineJoin = 'round';
            }
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => window.removeEventListener('resize', resizeCanvas);
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        ctx.beginPath();
        ctx.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;

        const rect = canvas.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;

        ctx.lineTo(clientX - rect.left, clientY - rect.top);
        ctx.stroke();
        setHasSignature(true);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
    };

    const clear = () => {
        const canvas = canvasRef.current;
        const ctx = canvas?.getContext('2d');
        if (!canvas || !ctx) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        setHasSignature(false);
    };

    const handleSave = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            onSave(canvas.toDataURL('image/png'));
        }
    };

    return (
        <div className="bg-card p-8 rounded-md border border-border shadow-2xl animate-in zoom-in-95 duration-500">
            <h4 className="text-[10px] font-black text-muted-foreground mb-6 uppercase tracking-[0.3em] flex items-center gap-3">
                <div className="w-1 h-3 bg-primary rounded-full"></div>
                Captura de Assinatura Digital
            </h4>

            <div className="relative border-2 border-dashed border-border rounded-3xl bg-muted/5 overflow-hidden mb-8 touch-none group hover:border-primary/30 transition-all duration-500">
                <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full cursor-crosshair bg-transparent"
                />
                {!hasSignature && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none space-y-3">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center opacity-40">
                            <Eraser className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <span className="text-muted-foreground text-[10px] font-black uppercase tracking-widest">Utilize o mouse ou touch para assinar</span>
                    </div>
                )}
            </div>

            <div className="flex justify-between items-center">
                <button
                    onClick={clear}
                    className="flex items-center gap-2 px-5 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all border border-transparent hover:border-destructive/10"
                >
                    <Eraser className="h-4 w-4" />
                    Resetar
                </button>
                <div className="flex gap-4">
                    <button
                        onClick={onCancel}
                        className="px-6 py-3 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-all"
                    >
                        Abortar
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={!hasSignature}
                        className="flex items-center gap-2 px-8 py-3 bg-primary text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-primary/30 hover:-translate-y-1 active:translate-y-0"
                    >
                        <Check className="h-4 w-4" />
                        Validar Identidade
                    </button>
                </div>
            </div>
        </div>
    );
};
