/** Normalize only genuine, user-authored contract draft fields. */
export function normalizeContractDraftInput(input: {
    title: unknown;
    company: unknown;
    text: unknown;
}): { title: string; company: string; content_json: { text: string } } {
    const { title, company, text } = input;
    if (typeof title !== 'string' || !title.trim() || title.length > 500) {
        throw new Error('Informe um título válido de até 500 caracteres.');
    }
    if (typeof company !== 'string' || !company.trim() || company.length > 500) {
        throw new Error('Informe a empresa contratante (até 500 caracteres).');
    }
    if (typeof text !== 'string' || !text.trim() || text.length > 100000) {
        throw new Error('Informe o texto do contrato (até 100.000 caracteres).');
    }
    return { title: title.trim(), company: company.trim(), content_json: { text } };
}
