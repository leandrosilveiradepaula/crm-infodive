import ExcelJS from 'exceljs';
import * as path from 'path';
import * as fs from 'fs';
import { SettingsService } from './SettingsService';
import { DealService } from './DealService';

export interface DistributorOrderExtraData {
    // Basic Info
    bidNumber?: string;
    billingType?: 'reseller' | 'end_user';
    paymentTerms?: string;

    // Dealer Overrides
    dealerName?: string;
    dealerCnpj?: string;

    // User Overrides
    userName?: string;
    userCnpj?: string;
    userIe?: string;
    userAddress?: string;
    userNeighborhood?: string;
    userZip?: string;
    userCity?: string;
    userState?: string;
    userContact?: string;
    userPhone?: string;
    userEmail?: string;

    // Product Overrides
    products?: Array<{
        sku: string;
        quantity: number;
        unitPrice: number;
    }>;
}

export class DistributorOrderService {
    /**
     * Generates an Ingram HW Order Excel file for a specific deal using ExcelJS to preserve formatting.
     */
    static async generateIngramHWOrder(
        dealId: string,
        organizationId: string,
        extraData?: DistributorOrderExtraData
    ): Promise<{ buffer: Buffer, fileName: string }> {
        // 1. Fetch Deal Data
        const deal = await DealService.getDealDetails('system', dealId, organizationId);
        if (!deal) throw new Error('Não foi possível processar o pedido do distribuidor.');

        // 2. Fetch Organization Settings
        const org = await SettingsService.getOrgSettings(organizationId);

        // 3. Load Template
        const templatePath = path.join(process.cwd(), 'docs', 'templates', 'FORMULÁRIO DE PEDIDOS HW Ingram.xlsx');

        if (!fs.existsSync(templatePath)) {
            throw new Error('Não foi possível processar o pedido do distribuidor.');
        }

        const workbook = new ExcelJS.Workbook();
        const fileBuffer = fs.readFileSync(templatePath);
        await workbook.xlsx.load(fileBuffer as unknown as any);

        const worksheet = workbook.getWorksheet("Pedido HW");
        if (!worksheet) throw new Error('Não foi possível processar o pedido do distribuidor.');

        // 4. Fill Dealer Data (Revenda)
        worksheet.getCell('B9').value = extraData?.dealerName || org.name || '';
        worksheet.getCell('B10').value = extraData?.dealerCnpj || org.cnpj || '';
        worksheet.getCell('B11').value = deal.id.substring(0, 8);

        // 5. Fill End-User Data (Usuário Final)
        worksheet.getCell('B14').value = extraData?.userName || deal.account?.name || '';
        worksheet.getCell('B15').value = extraData?.userCnpj || deal.account?.cnpj || '';
        worksheet.getCell('B16').value = extraData?.userIe || deal.account?.ie || '';

        let defaultAddress = '';
        if (deal.account) {
            defaultAddress = `${deal.account.street || ''}, ${deal.account.number || ''} ${deal.account.complement || ''}`.trim();
        }
        worksheet.getCell('B17').value = extraData?.userAddress || defaultAddress;
        worksheet.getCell('B18').value = extraData?.userNeighborhood || deal.account?.neighborhood || '';
        worksheet.getCell('E18').value = `CEP: ${extraData?.userZip || deal.account?.zip || ''}`;
        worksheet.getCell('B19').value = extraData?.userCity || deal.account?.city || '';
        worksheet.getCell('E19').value = `Estado: ${extraData?.userState || deal.account?.state || ''}`;

        // Contato info
        const primaryContact = deal.account?.contacts?.find((c) => c.is_primary) || deal.account?.contacts?.[0];
        worksheet.getCell('B20').value = extraData?.userContact || primaryContact?.name || '';
        worksheet.getCell('B21').value = extraData?.userPhone || primaryContact?.mobile_phone || primaryContact?.landline_phone || '';
        worksheet.getCell('B22').value = extraData?.userEmail || primaryContact?.email || '';

        // 6. Extra Data (BID, Billing Type, Payment Terms)
        if (extraData) {
            // BID Number (Yellow highlighted area)
            if (extraData.bidNumber) {
                worksheet.getCell('B35').value = extraData.bidNumber;
            }

            // Payment Terms
            if (extraData.paymentTerms) {
                worksheet.getCell('E30').value = extraData.paymentTerms;
            }

            // Billing Selection (Mark with 'x')
            if (extraData.billingType === 'reseller') {
                worksheet.getCell('D32').value = 'X';
                worksheet.getCell('F32').value = '';
            } else if (extraData.billingType === 'end_user') {
                worksheet.getCell('D32').value = '';
                worksheet.getCell('F32').value = 'X';
            }
        }

        // 7. Fill Products (Grid starts at row 39)
        const productsToFill = extraData?.products || (deal.deal_products || []).map((p) => ({
            sku: p.sku || p.name,
            quantity: p.quantity || 1,
            unitPrice: p.unit_price || 0
        }));

        // --- SURGICAL GRID CLEANING (Deep Fix) ---
        // To prevent "Shared Formula master must exist" error, we must sanitize the entire grid area
        // (B39:E46) before injecting any data, stripping all internal formula metadata from the template.
        for (let r = 39; r <= 46; r++) {
            ['B', 'C', 'D', 'E'].forEach(col => {
                const cell = worksheet.getCell(`${col}${r}`);
                const internalCell = cell as any;

                // Set to null while force-clearing all internal formula properties
                cell.value = null;

                if (internalCell._formula) internalCell._formula = undefined;
                if (internalCell._sharedFormula) internalCell._sharedFormula = undefined;

                if (internalCell._value && internalCell._value.model) {
                    internalCell._value.model.formula = undefined;
                    internalCell._value.model.sharedFormula = undefined;
                    internalCell._value.model.result = undefined;
                }
            });
        }

        // --- DATA INJECTION ---
        productsToFill.forEach((product, index: number) => {
            const row = 39 + index;
            if (row > 46) return;

            worksheet.getCell(`B${row}`).value = product.sku;
            worksheet.getCell(`C${row}`).value = product.quantity;
            worksheet.getCell(`D${row}`).value = product.unitPrice;

            const totalCell = worksheet.getCell(`E${row}`);
            totalCell.value = (product.unitPrice || 0) * (product.quantity || 1);

            // Apply currency formatting to price cells
            worksheet.getCell(`D${row}`).numFmt = '"R$ "#,##0.00';
            totalCell.numFmt = '"R$ "#,##0.00';
        });

        // 8. Export to Buffer
        const buffer = await workbook.xlsx.writeBuffer() as unknown as Buffer;

        // 9. Generate Descriptive Filename
        const accountName = deal.account?.name?.replace(/[^a-zA-Z0-9]/g, '_') || 'Cliente';
        const fileName = `Pedido_Ingram_${accountName}_${deal.id.substring(0, 8)}.xlsx`;

        return { buffer, fileName };
    }
}
