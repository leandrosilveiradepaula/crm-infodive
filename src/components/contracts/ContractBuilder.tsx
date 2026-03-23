import { useState } from 'react';
import { ArrowLeft, Check, FileText } from 'lucide-react';
import { SignaturePad } from './SignaturePad';
import { Deal } from '../../types/deal';

// Assuming Contract type definition or creating a placeholder
export interface Contract {
    id?: string;
    title: string;
    company: string;
    value: number;
    dealId: string;
    status: 'draft' | 'sent' | 'signed' | 'expired';
    type: 'service' | 'product';
    content_json: any;
    signature_image?: string;
    signerName?: string;
    signerRole?: string;
    createdAt?: string;
}

interface ContractBuilderProps {
    deal: Deal;
    contract?: Partial<Contract>;
    onSave: (contract: Partial<Contract>, signature?: string) => void;
    onClose: () => void;
}

export const ContractBuilder = ({ deal, contract, onSave, onClose }: ContractBuilderProps) => {
    const [title, setTitle] = useState(contract?.title || `Contrato de Prestação de Serviços - ${deal.company}`);
    const [content, setContent] = useState<string>(
        contract?.content_json ? JSON.parse(JSON.stringify(contract.content_json)).text :
            `CONTRATO DE PRESTAÇÃO DE SERVIÇOS E FORNECIMENTO DE PRODUTOS

IDENTIFICAÇÃO DAS PARTES

CONTRATANTE: ${deal.company}, representada por ${deal.contact_name || '[NOME DO RESPONSÁVEL]'}, doravante denominada CONTRATANTE.

CONTRATADA: IBM BRASIL / LENOVO TECNOLOGIA, doravante denominada CONTRATADA.

1. DO OBJETO
1.1. O presente contrato tem como objeto o fornecimento dos produtos e serviços descritos na Proposta Comercial #${deal.id.slice(0, 8)}, anexa a este instrumento.
1.2. Valor Total do Contrato: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}

2. DO PRAZO
2.1. O presente contrato entra em vigor na data de sua assinatura e terá validade de 12 (doze) meses.

3. DO PAGAMENTO
3.1. O pagamento será realizado conforme condições estabelecidas na Proposta Comercial.

E, por estarem assim justos e contratados, firmam o presente instrumento.`
    );

    const [step, setStep] = useState<'edit' | 'sign'>('edit');
    const [signature, setSignature] = useState<string | null>(contract?.signature_image || null);

    const handleSign = (sig: string) => {
        setSignature(sig);
        onSave({
            title,
            company: deal.company,
            value: deal.value,
            dealId: deal.id,
            status: 'signed',
            type: 'service',
            content_json: { text: content } as any,
            signerName: deal.contact_name,
            signerRole: 'Responsável Legal'
        }, sig);
    };

    return (
        <div className="flex flex-col h-full bg-background rounded-[40px] overflow-hidden border border-border shadow-2xl animate-in zoom-in-95 duration-300">
            {/* Header */}
            <div className="bg-background border-b border-border p-8 flex items-center justify-between relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-transparent pointer-events-none"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                        <FileText className="h-7 w-7 text-primary" />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-foreground uppercase tracking-tighter">Editor de Contratos</h2>
                        <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1 opacity-80">{deal.company}</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="h-12 w-12 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-border relative z-10"
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-12 bg-muted/20 custom-scrollbar">
                <div className="max-w-4xl mx-auto bg-card shadow-[0_50px_100px_rgba(0,0,0,0.5)] border border-border min-h-[1000px] p-20 relative rounded-[4px] animate-in slide-in-from-bottom-8 duration-700">
                    {/* Visual Header of the Doc */}
                    <div className="mb-20 text-center border-b border-border pb-12">
                        <div className="flex justify-center mb-6">
                            <div className="w-12 h-1 bg-primary rounded-full"></div>
                        </div>
                        <h1 className="text-3xl font-black text-foreground uppercase tracking-[0.3em] mb-4">Contrato Social</h1>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground w-full bg-muted/10 border border-border hover:border-primary/30 hover:bg-muted/20 rounded-xl p-3 transition-all focus:ring-1 focus:ring-primary/30 focus:text-foreground outline-none"
                            placeholder="Título do Contrato"
                        />
                    </div>

                    {/* Editable Body */}
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="w-full h-[600px] resize-none border border-transparent focus:ring-0 text-muted-foreground leading-loose text-justify font-serif text-xl bg-transparent p-6 hover:bg-muted/10 hover:border-border rounded-2xl transition-all outline-none"
                    />

                    {/* Signature Section */}
                    <div className="mt-24 pt-12 border-t border-border flex justify-between items-end gap-12">
                        <div className="text-center flex-1">
                            <div className="h-24 flex items-center justify-center mb-4">
                                <span className="text-muted-foreground font-serif italic text-3xl opacity-20">IBM Global Services</span>
                            </div>
                            <div className="w-full border-b border-border mb-4 shadow-[0_1px_0_rgba(255,255,255,0.05)]"></div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Contratada</p>
                            <p className="text-[9px] text-primary font-bold mt-1 uppercase">IBM / Lenovo Technology</p>
                        </div>

                        <div className="text-center flex-1">
                            {signature ? (
                                <div className="flex flex-col items-center animate-in fade-in zoom-in duration-500">
                                    <div className="h-24 flex items-center justify-center">
                                        <img src={signature} alt="Assinatura" className="h-20 invert grayscale brightness-200 contrast-200 dark:invert-0" />
                                    </div>
                                    <div className="w-full border-b border-border mb-4 shadow-[0_1px_0_rgba(255,255,255,0.05)]"></div>
                                    <p className="text-[10px] font-black text-foreground uppercase tracking-widest">{deal.company}</p>
                                    <div className="mt-2 flex items-center gap-2 justify-center px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                                        <Check className="h-3 w-3 text-emerald-500" />
                                        <p className="text-[8px] text-emerald-500 font-black uppercase tracking-widest">
                                            Assinatura Digital Validada
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <button
                                    onClick={() => setStep('sign')}
                                    className="w-full h-32 border-2 border-dashed border-border bg-muted/10 rounded-2xl flex flex-col items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/5 hover:border-primary/30 transition-all group group-hover:shadow-[0_0_30px_rgba(var(--primary-rgb),0.1)]"
                                >
                                    <div className="w-12 h-12 rounded-full bg-muted/20 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                                        <FileText className="h-6 w-6" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest">Capturar Assinatura</span>
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-background border-t border-border flex justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Status: Em Edição</span>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-border"
                    >
                        Descartar
                    </button>
                    <button
                        onClick={() => onSave({ title, content_json: { text: content } as any, status: 'draft' })}
                        className="px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-muted text-foreground border border-border hover:bg-muted/80 transition-all shadow-xl"
                    >
                        Salvar Rascunho
                    </button>
                    {!signature && (
                        <button
                            onClick={() => setStep('sign')}
                            className="px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-primary text-white hover:bg-primary/90 transition-all shadow-xl shadow-primary/30 hover:-translate-y-1"
                        >
                            Prosseguir para Assinatura
                        </button>
                    )}
                </div>
            </div>

            {/* Signature Overlay */}
            {step === 'sign' && (
                <div className="fixed inset-0 bg-background/90 backdrop-blur-xl flex items-center justify-center z-[80] p-6 animate-in fade-in duration-300">
                    <div className="w-full max-w-xl animate-in zoom-in-95 duration-500">
                        <SignaturePad
                            onSave={handleSign}
                            onCancel={() => setStep('edit')}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};
