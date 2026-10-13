import { useState } from 'react';
import { ArrowLeft, FileText } from 'lucide-react';
import { Deal } from '../../types/deal';

// Assuming Contract type definition or creating a placeholder
export interface Contract {
    id?: string;
    title: string;
    company: string;
    value: number;
    dealId: string;
    status: 'draft' | 'sent' | 'viewed' | 'signed' | 'declined';
    type: 'service' | 'nda' | 'sales';
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

CONTRATADA: INFODIVE, doravante denominada CONTRATADA.

1. DO OBJETO
1.1. O presente contrato tem como objeto o fornecimento dos produtos e serviços descritos na Proposta Comercial #${deal.id.slice(0, 8)}, anexa a este instrumento.
1.2. Valor Total do Contrato: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(deal.value)}

2. DO PRAZO
2.1. O presente contrato entra em vigor na data de sua assinatura e terá validade de 12 (doze) meses.

3. DO PAGAMENTO
3.1. O pagamento será realizado conforme condições estabelecidas na Proposta Comercial.

E, por estarem assim justos e contratados, firmam o presente instrumento.`
    );

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
                        <p className="text-xs font-black text-primary uppercase tracking-widest mt-1 opacity-80">{deal.company}</p>
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
                        <h1 className="text-3xl font-black text-foreground uppercase tracking-[0.3em] mb-4">Contrato Comercial</h1>
                        <input
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            className="text-center text-xs font-black uppercase tracking-widest text-muted-foreground w-full bg-muted/10 border border-border hover:border-primary/30 hover:bg-muted/20 rounded-xl p-3 transition-all focus:ring-1 focus:ring-primary/30 focus:text-foreground outline-none"
                            placeholder="Título do Contrato"
                        />
                    </div>

                    {/* Editable Body */}
                    <textarea
                        value={content}
                        onChange={e => setContent(e.target.value)}
                        className="w-full h-[600px] resize-none border border-transparent focus:ring-0 text-muted-foreground leading-loose text-justify font-serif text-xl bg-transparent p-6 hover:bg-muted/10 hover:border-border rounded-2xl transition-all outline-none"
                    />

                    <p className="mt-6 rounded-lg border border-border p-3 text-sm text-muted-foreground">
                        Assinatura eletrônica indisponível até existir verificação de identidade e evidência auditável.
                        O texto pode ser salvo como rascunho.
                    </p>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-8 bg-background border-t border-border flex justify-between items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></div>
                    <span className="text-xs font-black text-muted-foreground uppercase tracking-widest">Status: Em Edição</span>
                </div>
                <div className="flex gap-4">
                    <button
                        onClick={onClose}
                        className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest text-muted-foreground hover:text-foreground hover:bg-muted transition-all border border-border"
                    >
                        Descartar
                    </button>
                    <button
                        onClick={() => onSave({ title, content_json: { text: content } as any, status: 'draft' })}
                        className="px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest bg-muted text-foreground border border-border hover:bg-muted/80 transition-all shadow-xl"
                    >
                        Salvar Rascunho
                    </button>
                </div>
            </div>

        </div>
    );
};
