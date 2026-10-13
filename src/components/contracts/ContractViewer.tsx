import { X, FileText } from 'lucide-react';
import type { Contract } from '@/types/contract';
import { persistedContractText } from '@/lib/contract-content';

interface ContractViewerProps {
    isOpen: boolean;
    onClose: () => void;
    contract: Contract;
}

export const ContractViewer = ({ isOpen, onClose, contract }: ContractViewerProps) => {
    if (!isOpen) return null;
    const text = persistedContractText(contract.content_json);
    const signedInLegacyRecord = contract.status === 'signed';

    return (
        <div className="fixed inset-0 z-40 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
            <section role="dialog" aria-modal="true" aria-labelledby="contract-view-title"
                className="relative bg-card rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <header className="bg-muted/50 border-b border-border px-5 py-4 flex justify-between items-center gap-4">
                    <div className="min-w-0">
                        <h2 id="contract-view-title" className="font-bold text-lg text-foreground break-words">{contract.title}</h2>
                        <p className="text-sm text-muted-foreground">Dados cadastrados • {contract.company}</p>
                    </div>
                    <button type="button" onClick={onClose} aria-label="Fechar contrato"
                        className="rounded-lg p-2 hover:bg-background text-foreground">
                        <X className="h-5 w-5" />
                    </button>
                </header>
                <div className="overflow-y-auto p-5 md:p-8 space-y-5">
                    {signedInLegacyRecord && (
                        <p role="status" className="text-sm rounded-lg border border-border bg-muted/40 p-3">
                            Este contrato está marcado como assinado no cadastro, mas a identidade, a integridade
                            do documento e a data da assinatura não foram verificadas pelo CRM.
                        </p>
                    )}
                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>ID: {contract.id}</p>
                        <p>Tipo cadastrado: {contract.type}</p>
                        <p>Estado cadastrado: {contract.status}</p>
                    </div>
                    <div className="border border-border rounded-xl p-5 bg-background">
                        <h3 className="font-semibold flex items-center gap-2 mb-3">
                            <FileText className="h-4 w-4" /> Texto armazenado
                        </h3>
                        {text === null ? (
                            <p role="status" className="text-muted-foreground text-sm">
                                Este contrato não possui texto de documento armazenado.
                                Nenhuma cláusula ou assinatura foi gerada automaticamente.
                            </p>
                        ) : (
                            <div className="whitespace-pre-wrap break-words text-sm leading-relaxed text-foreground">{text}</div>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                        Esta visualização mostra apenas os dados salvos. Não é um PDF certificado,
                        documento assinado ou comprovante de validade jurídica.
                    </p>
                </div>
            </section>
        </div>
    );
};
