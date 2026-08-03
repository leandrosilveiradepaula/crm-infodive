'use server';

import { revalidatePath } from 'next/cache';
import { SalesService } from '@/services/SalesService';
import { requireSessionContext } from '@/lib/auth-server';
import { DistributorOrderService } from '@/services/DistributorOrderService';
import { DocumentService } from '@/services/DocumentService';
import type { DocumentCategory } from '@/types/document';
import { SalesOrder, SalesOrderItem } from '@/hooks/useSalesOrders';
import { createAdminClient } from '@/lib/supabase/admin';

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
        const { organizationId } = await requireSessionContext();
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
        const { organizationId } = await requireSessionContext();
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
        const { organizationId } = await requireSessionContext();
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
        const { userId, organizationId } = await requireSessionContext();
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
        const { organizationId, userId } = await requireSessionContext();
        const file = formData.get('file') as File;
        const confirmSave = formData.get('confirmSave') === 'true';
        if (!file) throw new Error('Arquivo não encontrado');

        const supabase = createAdminClient();

        // 1. Upload to Storage (Using 'invoices' bucket from migration)
        const fileExt = file.name.split('.').pop()?.toLowerCase();
        const fileName = `${organizationId}/invoices/${orderId}_${Date.now()}.${fileExt}`;

        const arrayBuffer = await file.arrayBuffer();
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('documents')
            .upload(fileName, arrayBuffer, {
                contentType: file.type,
                upsert: true
            });

        if (uploadError) {
            console.error('[SalesActions] invoice upload failed');
            throw new Error('Não foi possível processar a operação de vendas.');
        }

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
                const keyMatch = file.name.match(/\d{44}/);
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

        // 3. Update Sales Order (ONLY if confirmSave is true)
        if (confirmSave) {
            const updates: any = {
                status: 'nf_emitida',
                invoice_url: fileName,
                billed_at: new Date().toISOString()
            };

            if (extractedData?.number) updates.tax_invoice_number = extractedData.number;

            await SalesService.updateSalesOrder(organizationId, orderId, updates);

            if (extractedData?.boletos && extractedData.boletos.length > 0) {
                await SalesService.createInstallments(organizationId, orderId, extractedData.boletos);
            }

            // 4. Register as Document
            const { data: order } = await supabase.from('sales_orders').select('deal_id').eq('id', orderId).single();
            if (order?.deal_id) {
                await DocumentService.uploadDocument(userId, organizationId, 'deal', order.deal_id, {
                    name: file.name,
                    type: file.type,
                    size: file.size,
                    arrayBuffer
                }, {
                    category: 'outro',
                    description: `Nota Fiscal do pedido ${orderId}`
                });
            }
            revalidatePath('/sales');
        }

        return { success: true, extractedData, fileUrl: fileName };
    } catch {
        console.error('[SalesActions] invoice processing failed');
        return { success: false, error: 'Não foi possível processar a operação de vendas.' };
    }
}

export async function convertDealToSalesOrdersAction(dealId: string, extraData?: any) {
    try {
        const { userId, organizationId } = await requireSessionContext();

        // 1. Convert Deal to Sales Orders (Internal Records)
        const result = await SalesService.convertDealToSalesOrders(userId, organizationId, dealId);

        // 2. Automatically Generate and Save Distributor Excel Order
        try {
            const { buffer, fileName } = await DistributorOrderService.generateIngramHWOrder(dealId, organizationId, extraData);

            await DocumentService.uploadDocument(
                userId,
                organizationId,
                'deal',
                dealId,
                {
                    name: fileName,
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                    size: buffer.length,
                    arrayBuffer: buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer,
                },
                {
                    category: 'outro',
                    description: 'Pedido gerado automaticamente no fechamento.'
                }
            );
        } catch {
            console.error('[SalesActions] distributor order generation failed');
            // Non-blocking for the transaction
        }

        revalidatePath('/sales');
        revalidatePath('/pipeline');
        return result;
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
    } catch {
        console.error('[SalesActions] distributor order download failed');
        return { success: false, error: 'Não foi possível processar a operação de vendas.' };
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
    const { userId, organizationId } = await requireSessionContext();

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
    const { userId, organizationId } = await requireSessionContext();
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
    
    // Security Check: Ensure the path belongs to the user's organization
    if (!filePath.startsWith(`${organizationId}/`)) {
        throw new Error('Acesso negado: o arquivo não pertence à sua organização.');
    }

    const supabase = createAdminClient();
    const { data, error } = await supabase.storage
        .from('documents')
        .createSignedUrl(filePath, 300);

    if (error || !data?.signedUrl) {
        throw new Error('Erro ao gerar link seguro para o arquivo.');
    }

    return data.signedUrl;
}

