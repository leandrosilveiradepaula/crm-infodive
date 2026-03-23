import { X, Download, Printer } from 'lucide-react';

interface ContractViewerProps {
    isOpen: boolean;
    onClose: () => void;
    onSignClick: () => void;
    contract: any;
}

export const ContractViewer = ({ isOpen, onClose, onSignClick, contract }: ContractViewerProps) => {
    if (!isOpen || !contract) return null;

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <div className="relative bg-card rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden animate-in fade-in-0 zoom-in-95 duration-200">

                {/* Header */}
                <div className="bg-muted px-6 py-4 flex justify-between items-center shadow-md">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-card/10 rounded-lg flex items-center justify-center">
                            <span className="font-bold text-lg">PDF</span>
                        </div>
                        <div>
                            <h3 className="font-bold text-lg leading-tight">{contract.title}</h3>
                            <p className="text-white/60 text-xs">{contract.company} • {contract.createdAt}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button className="p-2 hover:bg-card/10 rounded-lg transition-colors" title="Imprimir"><Printer className="h-5 w-5" /></button>
                        <button className="p-2 hover:bg-card/10 rounded-lg transition-colors" title="Baixar"><Download className="h-5 w-5" /></button>
                        <div className="w-px h-6 bg-card/20 mx-1"></div>
                        <button onClick={onClose} className="p-2 hover:bg-card/10 rounded-lg transition-colors"><X className="h-5 w-5" /></button>
                    </div>
                </div>

                {/* Body - MOCK PDF */}
                <div className="flex-1 bg-muted/50 overflow-y-auto p-8 flex justify-center">
                    <div className="bg-card shadow-lg w-full max-w-3xl min-h-[1000px] p-12 text-foreground leading-relaxed font-serif relative">
                        {/* Mock Content */}
                        <div className="text-center mb-12">
                            <h1 className="text-3xl font-bold uppercase tracking-widest mb-2">Contrato de Prestação de Serviços</h1>
                            <p className="text-muted-foreground italic">No. {contract.id?.toUpperCase() || 'DRAFT'}</p>
                        </div>

                        <div className="space-y-6 text-justify">
                            <p>
                                <strong>CONTRATANTE:</strong> {contract.company}, pessoa jurídica de direito privado...
                            </p>
                            <p>
                                <strong>CONTRATADA:</strong> NEXUS TECNOLOGIA LTDA, inscrita no CNPJ sob o nº...
                            </p>

                            <h4 className="font-bold uppercase mt-8 border-b border-gray-300 pb-2">Cláusula Primeira - Do Objeto</h4>
                            <p>
                                O presente instrumento tem como objeto a prestação de serviços de Consultoria e Tecnologia, conforme proposta comercial anexa...
                            </p>

                            <h4 className="font-bold uppercase mt-8 border-b border-gray-300 pb-2">Cláusula Segunda - Dos Valores</h4>
                            <p>
                                Pelos serviços prestados, a CONTRATANTE pagará à CONTRATADA o valor total de <strong>{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(contract.value)}</strong>.
                            </p>

                            <h4 className="font-bold uppercase mt-8 border-b border-gray-300 pb-2">Cláusula Terceira - Da Vigência</h4>
                            <p>
                                Este contrato entra em vigor na data de sua assinatura e terá vigência de 12 (doze) meses.
                            </p>

                            {/* Watermark/Status if signed */}
                            {contract.status === 'signed' && (
                                <div className="absolute bottom-40 right-20 border-4 border-green-600 text-green-600 rounded-xl px-4 py-2 opacity-80 -rotate-12 transform">
                                    <p className="font-black text-4xl uppercase">Assinado</p>
                                    <p className="font-bold text-sm text-center">Digitalmente em {new Date().toLocaleDateString()}</p>
                                </div>
                            )}

                            {/* Signature Section */}
                            <div className="mt-32 flex justify-between px-10">
                                <div className="text-center">
                                    <div className="w-56 border-t border-black mb-2 relative">
                                        {/* Mock Previous Signature */}
                                        <span className="absolute -top-10 left-0 right-0 font-cursive text-2xl">João Silva</span>
                                    </div>
                                    <p className="text-sm font-bold">NEXUS TECNOLOGIA LTDA</p>
                                </div>
                                <div className="text-center">
                                    <div className="w-56 border-t border-black mb-2 relative">
                                        {contract.signerName && (
                                            <span className="absolute -top-10 left-0 right-0 font-cursive text-2xl italic text-primary">
                                                {contract.signerName}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm font-bold uppercase">{contract.company}</p>
                                </div>
                            </div>
                        </div>

                        {/* Page Number */}
                        <div className="absolute bottom-8 right-12 text-muted-foreground text-xs">Página 1 de 1</div>
                    </div>
                </div>

                {/* Footer Action */}
                {contract.status !== 'signed' && (
                    <div className="bg-card border-t border-border p-4 flex justify-between items-center px-8 z-10">
                        <div className="text-sm text-muted-foreground">
                            Ao assinar, você concorda com os <a href="#" className="text-primary underline font-bold">Termos de Uso</a> & <a href="#" className="text-primary underline font-bold">Política de Privacidade</a>.
                        </div>
                        <button
                            onClick={onSignClick}
                            className="bg-primary text-white font-bold py-3 px-8 rounded-2xl hover:bg-primary/90 transition-all shadow-xl shadow-primary/20 text-lg"
                        >
                            Assinar Documento
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
