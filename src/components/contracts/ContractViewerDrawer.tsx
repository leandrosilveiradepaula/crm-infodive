'use client';

import { Sheet, SheetContent, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { X, Download, Printer } from 'lucide-react';

interface ContractViewerDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    onSignClick: () => void;
    contract: any;
}

export const ContractViewerDrawer = ({ isOpen, onClose, onSignClick, contract }: ContractViewerDrawerProps) => {
    if (!contract) return null;

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="w-full sm:max-w-[850px] flex flex-col p-0 gap-0"
            >
                {/* Header */}
                <div className="border-b border-border px-6 py-4 shrink-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent flex items-center justify-between">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="h-10 w-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <span className="font-bold text-sm text-primary">PDF</span>
                        </div>
                        <div className="min-w-0">
                            <SheetTitle className="font-bold text-base leading-tight text-foreground truncate">
                                {contract.title}
                            </SheetTitle>
                            <SheetDescription className="text-muted-foreground text-xs mt-0.5 truncate">
                                {contract.company} • {contract.createdAt}
                            </SheetDescription>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" title="Imprimir">
                            <Printer className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" title="Baixar">
                            <Download className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-6 bg-border mx-1"></div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:bg-muted" onClick={onClose}>
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Body - MOCK PDF */}
                <div className="flex-1 bg-muted/30 overflow-y-auto p-6 flex justify-center custom-scrollbar">
                    <div className="bg-card shadow-lg w-full max-w-2xl min-h-[900px] p-10 text-foreground leading-relaxed font-serif relative border border-border rounded-xl">
                        {/* Mock Content */}
                        <div className="text-center mb-10">
                            <h1 className="text-2xl font-bold uppercase tracking-widest mb-2 text-foreground">Contrato de Prestação de Serviços</h1>
                            <p className="text-muted-foreground italic text-xs">No. {contract.id?.toUpperCase() || 'DRAFT'}</p>
                        </div>

                        <div className="space-y-6 text-justify text-sm">
                            <p>
                                <strong>CONTRATANTE:</strong> {contract.company}, pessoa jurídica de direito privado...
                            </p>
                            <p>
                                <strong>CONTRATADA:</strong> NEXUS TECNOLOGIA LTDA, inscrita no CNPJ sob o nº...
                            </p>

                            <h4 className="font-bold uppercase mt-8 border-b border-border pb-2">Cláusula Primeira - Do Objeto</h4>
                            <p>
                                O presente instrumento tem como objeto a prestação de serviços de Consultoria e Tecnologia, conforme proposta comercial anexa...
                            </p>

                            <h4 className="font-bold uppercase mt-8 border-b border-border pb-2">Cláusula Segunda - Dos Valores</h4>
                            <p>
                                Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor total de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.value)}</strong>.
                            </p>

                            <h4 className="font-bold uppercase mt-8 border-b border-border pb-2">Cláusula Terceira - Da Vigência</h4>
                            <p>
                                Este contrato entra em vigor na data de sua assinatura e terá vigência de 12 (doze) meses.
                            </p>

                            {/* Watermark/Status if signed */}
                            {contract.status === 'signed' && (
                                <div className="absolute bottom-40 right-10 border-4 border-green-600 text-green-600 rounded-xl px-4 py-2 opacity-80 -rotate-12 transform">
                                    <p className="font-black text-2xl uppercase">Assinado</p>
                                    <p className="font-bold text-[10px] text-center">Digitalmente em {new Date().toLocaleDateString()}</p>
                                </div>
                            )}

                            {/* Signature Section */}
                            <div className="mt-24 flex justify-between px-4">
                                <div className="text-center">
                                    <div className="w-44 border-t border-foreground mb-2 relative">
                                        {/* Mock Previous Signature */}
                                        <span className="absolute -top-10 left-0 right-0 font-cursive text-xl">João Silva</span>
                                    </div>
                                    <p className="text-[10px] font-bold">NEXUS TECNOLOGIA LTDA</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-44 border-t border-foreground mb-2 relative">
                                        {contract.signerName && (
                                            <span className="absolute -top-10 left-0 right-0 font-cursive text-xl italic text-primary">
                                                {contract.signerName}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-[10px] font-bold uppercase">{contract.company}</p>
                                </div>
                            </div>
                        </div>

                        {/* Page Number */}
                        <div className="absolute bottom-6 right-10 text-muted-foreground text-xs">Página 1 de 1</div>
                    </div>
                </div>

                {/* Sticky Footer */}
                {contract.status !== 'signed' && (
                    <div className="border-t border-border px-6 py-4 bg-muted/10 shrink-0 flex items-center justify-between gap-4">
                        <div className="text-xs text-muted-foreground">
                            Ao assinar, você concorda com os <a href="#" className="text-primary underline font-bold">Termos de Uso</a> & <a href="#" className="text-primary underline font-bold">Política de Privacidade</a>.
                        </div>
                        <Button
                            onClick={onSignClick}
                            className="bg-primary hover:bg-primary/90 text-white font-bold h-10 px-6 rounded-xl shadow-md shadow-primary/20 shrink-0"
                        >
                            Assinar Documento
                        </Button>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};
