'use server';

import { revalidatePath } from 'next/cache';
import { SalesService } from '../../../services/SalesService';
import { requirePermission, requireSessionContext } from '../../../lib/auth-server';
import { DistributorOrderService } from '../../../services/DistributorOrderService';
import { DocumentService } from '../../../services/DocumentService';
import type { DocumentCategory } from '../../../types/document';
import { SalesOrder, SalesOrderItem } from '../../../hooks/useSalesOrders';
import { createAdminClient } from '../../../lib/supabase/admin';
import { validateInvoiceUpload, validateInvoiceContent } from '../../../lib/invoice-upload-validation';
import { parseInvoiceStoragePath } from '../../../lib/invoice-storage-access';
import { distributorOrderWarningFor, distributorOrderDownloadErrorFor } from '../../../lib/distributor-order-outcome';

export async function getSalesOrders(dealId?: string) {
    try {
        const { organizationId } = await requireSessionContext();
        const data = await SalesService.getSalesOrders(organizationId, dealId);
        return { success: true, data };
    } catch {
        console.error('[SalesActions] sales orders fetch failed');
        return { success: false, error: 'Não foi possível processar a operação de vendas.' };
    }
}

export async function createSalesOrder(order: Partial<SalesOrder>, items: Partial<SalesOrderItem>[]) {
    try {
        const { organizationId } = await requirePermission('deals:create');
        const data = await SalesService.createSalesOrder(organizationId, order, items);
        revalidatePath('/sales');
        return { success: true, data };
    } catch {
        console.error('[SalesActions] sales order creation failed');
        return { success: false, error: 'Não foi possível processar a operação de vendas.' };
    }
}

export async function updateSalesOrder(id: string, updates: Partial<SalesOrder>) {
    try {
        const { organizationId } = await requirePermission('deals:edit');
        const data = await SalesService.updateSalesOrder(organizationId, id, updates);
        revalidatePath('/sales');
        return { success: true, data };
    } catch {
        console.error('[SalesActions] sales order update failed');
        return { success: false, error: 'Não foi possível processar a operação de vendas.' };
    }
}

export async function deleteSalesOrder(id: string) {
    try {
        const { organizationId } = await requirePermission('deals:delete');
        await SalesService.deleteSalesOrder(organizationId, id);
        revalidatePath('/sales');
        return { success: true };
    } catch {
        console.error('[SalesActions] sales order deletion failed');
        return { success: false, error: 'Não foi possível processar a operação de vendas.' };
    }
}

export async function updateInstallmentStatusAction(installmentId: string, status: string) {
    try {
        const { userId, organizationId } = await requirePermission('deals:edit');
        if (!userId || !organizationId) throw new Error('Unauthorized');

        await SalesService.updateInstallmentStatus(organizationId, installmentId, status);
        revalidatePath('/sales');
        return { success: true };
    } catch {
        console.error('[SalesActions] installment status update failed');
        return { success: false, error: 'Não foi possível processar a operação de vendas.' };
    }
}

export async function processInvoiceAction(orderId: string, formData: FormData) {
    try {
        const { organizationId, userId } = await requirePermission('deals:edit');
        const file = formData.get('file');
        const confirmSave = formData.get('confirmSave') === 'true';
        const check = validateInvoiceUpload(orderId, file);
        if (!check.ok) throw new Error(check.error);
        const invoiceFile = file as File;
        const supabase = createAdminClient();

        // Validate order ownership with a privileged tenant-scoped query BEFORE storage writes.
        const { data: ownedOrder, error: ownershipError } = await supabase
            .from('sales_orders').select('id, deal_id').eq('id', orderId)
            .eq('organization_id', organizationId).maybeSingle();
        if (ownershipError || !ownedOrder) throw new Error('Pedido não encontrado ou acesso negado.');

        const fileExt = check.extension;
        const fileName = `${organizationId}/invoices/${orderId}_${crypto.randomUUID()}.${fileExt}`;
        const arrayBuffer = await invoiceFile.arrayBuffer();
        if (arrayBuffer.byteLength !== invoiceFile.size) throw new Error('Arquivo inválido.');
        const contentError = validateInvoiceContent(check.extension, arrayBuffer);
        if (contentError) throw new Error(contentError);
        // Parsing/preview must never write a Storage object.

        // 2. Extract Info
        let extractedData: any = null;
        if (fileExt === 'xml') {
            const text = Buffer.from(arrayBuffer).toString('utf-8');
            // Improved Regex for server-side too
            const nNFMatch = text.match(/<nNF>(\d+)<\/nNF>/);
            const dhEmiMatch = text.match(/<dhEmi>([^<|T]+)/);
            const vNFMatch = text.match(/<vNF>(\d+\.\d+)<\/vNF>/);
            const emitMatch = text.match(/<emit>[\s\S]*?<xNome>([^<]+)<\/xNome>/);

            extractedData = {
                number: nNFMatch ? nNFMatch[1] : '',
                date: dhEmiMatch ? new Date(dhEmiMatch[1]).toLocaleDateString('pt-BR') : '',
                total: vNFMatch ? parseFloat(vNFMatch[1]) : 0,
                issuer: emitMatch ? emitMatch[1] : ''
            };
        } else if (fileExt === 'pdf') {
            try {
                // 1. Parse Access Key from filename (most reliable for Number/CNPJ)
                const keyMatch = invoiceFile.name.match(/\d{44}/);
                let extractedNumber = 'Não encontrado';
                let extractedCNPJ = '';

                if (keyMatch) {
                    const key = keyMatch[0];
                    const rawCNPJ = key.substring(6, 20); // Pos 7-20 is CNPJ
                    extractedCNPJ = rawCNPJ.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, "$1.$2.$3/$4-$5");
                    extractedNumber = parseInt(key.substring(25, 34), 10).toString(); // Pos 26-34 is nNF
                }

                // 2. Parse text to find Date, Total Value and Name
                let extractedTotal = 0;
                let extractedDate = new Date().toLocaleDateString('pt-BR');
                let extractedIssuer = extractedCNPJ ? `CNPJ Emitente: ${extractedCNPJ}` : 'Desconhecido';
                const extractedBoletos: { dueDate: string, amount: number }[] = [];

                try {
                    const pdfParse = require('pdf-parse');
                    const data = await pdfParse(Buffer.from(arrayBuffer));
                    const text = data.text;

                    // 1. Find Date (NFe Emission Date)
                    const emissionMatch = text.match(/DATA DE EMISS.O[\s\S]*?(\d{2}\/\d{2}\/\d{4})/i) ||
                        text.match(/EMISSAO:\s*(\d{2}\/\d{2}\/\d{4})/i) ||
                        text.match(/(?:^|\s)(\d{2}\/\d{2}\/\d{4})(?:\s|$)/);
                    if (emissionMatch) {
                        extractedDate = emissionMatch[1];
                    }

                    // 2. Look for Total Value
                    const totalMatch = text.match(/VALOR TOTAL DA NOTA[\s\S]{0,150}?([\d\.,]{5,})/i) ||
                        text.match(/VALOR TOTAL DOS PRODUTOS[\s\S]{0,150}?([\d\.,]{5,})/i) ||
                        text.match(/R\$\s*([\d\.,]{5,})/i);

                    if (totalMatch) {
                        const cleanValue = totalMatch[1].replace(/[^\d,]/g, '').replace(',', '.');
                        extractedTotal = parseFloat(cleanValue) || 0;
                    }

                    // 3. Issuer Name (usually extracted from CNPJ mapping or text heuristics)
                    if (text.match(/INGRAM MICRO/i)) {
                        extractedIssuer = 'INGRAM MICRO BRASIL LTDA';
                    } else {
                        const lines = text.split('\n').map((l: string) => l.trim()).filter((l: string) => l.length > 5);
                        if (lines.length > 0 && lines[0].length > 10) {
                            if (!lines[0].toLowerCase().includes("danfe")) {
                                extractedIssuer = lines[0].substring(0, 40);
                            } else if (lines.length > 1) {
                                extractedIssuer = lines[1].substring(0, 40);
                            }
                        }
                    }

                    // 4. Extract Boletos (specific to Ingram Micro embedded boletos)
                    const blocks = text.split(/PAGAVEL EM QUALQUER BANCO ATE VENCIMENTO/i);
                    for (let i = 1; i < blocks.length; i++) {
                        const block = blocks[i];
                        const dateMatch = block.match(/^(\d{2}\/\d{2}\/\d{4})/);
                        const valMatch = block.match(/109R\$\s*([\d\.,]+)/);
                        if (dateMatch && valMatch) {
                            extractedBoletos.push({
                                dueDate: dateMatch[1],
                                amount: parseFloat(valMatch[1].replace(/[^\d,]/g, '').replace(',', '.'))
                            });
                        }
                    }

                } catch {
                    console.error('[SalesActions] pdf text extraction fallback used');
                }

                extractedData = {
                    number: extractedNumber,
                    date: extractedDate,
                    total: extractedTotal,
                    issuer: extractedIssuer,
                    boletos: extractedBoletos
                };
            } catch {
                console.error('[SalesActions] pdf extraction failed');
                // Fallback if completely fails
                extractedData = {
                    number: `PDF-${Math.floor(Math.random() * 10000)}`,
                    date: new Date().toLocaleDateString('pt-BR'),
                    total: 0,
                    issuer: 'Erro na leitura do arquivo',
                    boletos: []
                };
            }
        }

        // 3. Analysis is read-only. Only confirmed uploads may persist objects.
        if (!confirmSave) {
            return { success: true, saved: false, extractedData, fileUrl: null };
        }

        const { error: uploadError } = await supabase.storage.from('documents')
            .upload(fileName, arrayBuffer, { contentType: check.contentType, upsert: false });
        if (uploadError) throw new Error('Não foi possível salvar o arquivo da nota fiscal.');

        let invoiceLinkedToOrder = false;
        try {
            const updates: Record<string, unknown> = {
                status: 'nf_emitida',
                invoice_url: fileName,
                billed_at: new Date().toISOString(),
            };
            if (extractedData?.number) updates.tax_invoice_number = extractedData.number;

            await SalesService.updateSalesOrder(organizationId, orderId, updates);
            invoiceLinkedToOrder = true;

            if (extractedData?.boletos && extractedData.boletos.length > 0) {
                await SalesService.createInstallments(organizationId, orderId, extractedData.boletos);
            }
            if (ownedOrder.deal_id) {
                await DocumentService.uploadDocument(userId, organizationId, 'deal', ownedOrder.deal_id, {
                    name: invoiceFile.name,
                    type: invoiceFile.type,
                    size: invoiceFile.size,
                    arrayBuffer,
                }, {
                    category: 'outro',
                    description: `Nota Fiscal do pedido ${orderId}`,
                });
            }
        } catch {
            if (!invoiceLinkedToOrder) {
                // The failed DB mutation did not reference the Storage object.
                // Remove the orphan best effort, but never report a false save.
                try {
                    const { error: cleanupError } = await supabase.storage.from('documents').remove([fileName]);
                    if (cleanupError) console.error('[SalesActions] failed to clean up unlinked invoice');
                } catch {
                    console.error('[SalesActions] invoice cleanup request failed');
                }
                return { success: false, saved: false, error: 'Não foi possível registrar a nota fiscal no pedido.' };
            }
            // This is NOT atomic: the invoice is referenced by the sales order,
            // but an installment or document copy may have failed.
            revalidatePath('/sales');
            return {
                success: false,
                saved: true,
                partialSuccess: true,
                fileUrl: fileName,
                error: 'Nota fiscal registrada, mas houve falha em operações complementares. Verifique antes de reenviar.',
            };
        }

        revalidatePath('/sales');
        return { success: true, saved: true, extractedData, fileUrl: fileName };
    } catch {
        console.error('[SalesActions] invoice processing failed');
        return { success: false, error: 'Não foi possível processar a operação de vendas.' };
    }
}

export async function convertDealToSalesOrdersAction(dealId: string, extraData?: any) {
    try {
        const { userId, organizationId } = await requirePermission('deals:edit');

        // Database sales orders and the distributor workbook are separate
        // operations. Do not treat Excel generation as part of an atomic write.
        const result = await SalesService.convertDealToSalesOrders(userId, organizationId, dealId);
        let distributorOrderSaved = false;
        let distributorDocumentId: string | null = null;
        let distributorOrderWarning: string | null = null;

        try {
            const { buffer, fileName } = await DistributorOrderService.generateIngramHWOrder(
                dealId, organizationId, extraData,
            );
            const saved = await DocumentService.uploadDocument(
                userId, organizationId, 'deal', dealId,
                {
                    name: fileName,
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    size: buffer.length,
                    arrayBuffer: buffer.buffer.slice(
                        buffer.byteOffset, buffer.byteOffset + buffer.byteLength,
                    ) as ArrayBuffer,
                },
                { category: 'outro', description: 'Pedido gerado automaticamente no fechamento.' },
            );
            if (!saved || typeof saved.id !== 'string' || !saved.id.trim()) {
                throw new Error('Distributor workbook evidence not persisted');
            }
            distributorOrderSaved = true;
            distributorDocumentId = saved.id;
        } catch (error: unknown) {
            console.error('[SalesActions] distributor order generation or document persistence failed');
            distributorOrderWarning = distributorOrderWarningFor(error);
        }

        revalidatePath('/sales');
        revalidatePath('/pipeline');
        return { ...result, distributorOrderSaved, distributorDocumentId, distributorOrderWarning };
    } catch {
        console.error('[SalesActions] deal conversion failed');
        return { success: false, error: 'Não foi possível processar a operação de vendas.' };
    }
}

export async function downloadDistributorOrderAction(dealId: string, extraData?: any) {
    try {
        const { organizationId } = await requireSessionContext();
        const { buffer, fileName } = await DistributorOrderService.generateIngramHWOrder(dealId, organizationId, extraData);

        // Convert Buffer to base64 for transfer
        const base64 = buffer.toString('base64');
        return { success: true, base64, fileName };
    } catch (error: unknown) {
        console.error('[SalesActions] distributor order download failed');
        return { success: false, error: distributorOrderDownloadErrorFor(error) };
    }
}

export async function getAllInstallmentsAction() {
    try {
        const { organizationId } = await requireSessionContext();
        const data = await SalesService.getAllInstallments(organizationId);
        return { success: true, data };
    } catch {
        console.error('[SalesActions] installments fetch failed');
        return { success: false, error: 'Não foi possível processar a operação de vendas.' };
    }
}

// ============================================================
// Sales Order Documents (via deal entity — multitenant safe)
// organizationId is ALWAYS derived from the server session.
// ============================================================

/**
 * Fetch all documents linked to the deal that owns this sales order.
 * dealId comes from the client, but access is validated via organizationId.
 */
export async function getSalesOrderDocuments(dealId: string) {
    const { userId, organizationId } = await requireSessionContext();
    return await DocumentService.getDocuments(userId, organizationId, 'deal', dealId);
}

/**
 * Upload a document for a sales order (stored under the deal entity).
 */
export async function uploadSalesOrderDocument(dealId: string, formData: FormData) {
    const { userId, organizationId } = await requirePermission('deals:edit');

    const file = formData.get('file') as File | null;
    if (!file) throw new Error('Nenhum arquivo enviado.');

    const category = (formData.get('category') as DocumentCategory) || 'outro';
    const description = (formData.get('description') as string) || '';
    const arrayBuffer = await file.arrayBuffer();

    const result = await DocumentService.uploadDocument(
        userId,
        organizationId,
        'deal',
        dealId,
        { name: file.name, type: file.type, size: file.size, arrayBuffer },
        { category, description }
    );

    revalidatePath('/sales');
    return result;
}

/**
 * Generate a short-lived signed URL for a sales-related document.
 */
export async function getSalesDocumentSignedUrl(documentId: string) {
    const { userId, organizationId } = await requireSessionContext();
    return await DocumentService.getSignedUrl(userId, organizationId, documentId);
}

/**
 * Delete a document linked to a sales order.
 */
export async function deleteSalesDocument(documentId: string) {
    const { userId, organizationId } = await requirePermission('deals:edit');
    await DocumentService.deleteDocument(userId, organizationId, documentId);
    revalidatePath('/sales');
    return true;
}

/**
 * Generate a signed URL for a raw storage path (like invoice_url).
 * Safely validates that the path belongs to the current organization.
 */
export async function getSignedUrlForRawPath(filePath: string) {
    const { organizationId } = await requireSessionContext();
    const invoice = parseInvoiceStoragePath(organizationId, filePath);
    if (!invoice) {
        throw new Error('Caminho de nota fiscal inválido ou acesso negado.');
    }
    const supabase = createAdminClient();
    const { data: order, error: orderError } = await supabase.from('sales_orders')
        .select('id, invoice_url').eq('id', invoice.orderId)
        .eq('organization_id', organizationId).eq('invoice_url', filePath)
        .maybeSingle();
    if (orderError || !order || order.id?.toLowerCase() !== invoice.orderId.toLowerCase() ||
        order.invoice_url !== filePath) {
        throw new Error('Nota fiscal não encontrada ou acesso negado.');
    }
    const { data, error } = await supabase.storage.from('documents')
        .createSignedUrl(filePath, 300);
    if (error || !data?.signedUrl) {
        throw new Error('Erro ao gerar link seguro para o arquivo.');
    }
    return data.signedUrl;
}

