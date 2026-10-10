/**
 * A sales order may already be persisted when the optional distributor workbook
 * cannot be generated or attached. Never claim that both operations succeeded.
 */
const LIMIT_ERROR = 'entre 1 e 8 produtos';
export const DEFAULT_DISTRIBUTOR_WARNING =
    'A venda foi registrada, mas o pedido Excel do distribuidor não foi salvo. Revise e gere o arquivo novamente.';

export function distributorOrderWarningFor(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (message.includes(LIMIT_ERROR)) {
        return 'A venda foi registrada, mas o formulário Ingram suporta no máximo oito produtos. O arquivo Excel não foi gerado. Revise o pedido antes de enviá-lo.';
    }
    return DEFAULT_DISTRIBUTOR_WARNING;
}

export function wonDealCompletionMessage(distributorWarning: string | null): string {
    return distributorWarning
        ? 'Venda registrada com pendência no arquivo do distribuidor.'
        : 'Venda consolidada e formulário do distribuidor salvo.';
}

export function distributorOrderDownloadErrorFor(error: unknown): string {
    const message = error instanceof Error ? error.message : '';
    if (message.includes('entre 1 e 8 produtos')) {
        return 'O formulário Ingram suporta no máximo oito produtos. Ajuste a lista antes de gerar o Excel.';
    }
    return 'Não foi possível gerar o formulário do distribuidor.';
}
