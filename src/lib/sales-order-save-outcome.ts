export function requireSalesOrderSaved(result: { success: boolean; error?: string } | null): void {
    if (!result || result.success !== true) {
        throw new Error(result?.error || 'Não foi possível salvar as alterações do pedido.');
    }
}
