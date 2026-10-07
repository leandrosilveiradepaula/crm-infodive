import type ExcelJS from 'exceljs';

export interface ColumnMapping {
    sku?: string;
    name?: string;
    cost?: string;
    description?: string;
    category?: string;
    subcategory?: string;
    quantity?: string;
}

export interface ParsedRow {
    sku: string;
    name: string;
    cost: number;
    description?: string;
    category?: string;
    subcategory?: string;
    quantity: number;
}

/**
 * Normalize an ExcelJS cell value into the primitive shape expected by the
 * existing mapping/import flow.
 */
const excelCellValue = (value: ExcelJS.CellValue): unknown => {
    if (value == null) return '';
    if (value instanceof Date) return value;
    if (typeof value !== 'object') return value;

    if ('result' in value && value.result != null) return value.result;
    if ('text' in value && typeof value.text === 'string') return value.text;
    if ('richText' in value && Array.isArray(value.richText)) {
        return value.richText.map(part => part.text).join('');
    }
    if ('error' in value) return String(value.error);

    return String(value);
};

export const worksheetToRows = (worksheet: ExcelJS.Worksheet): unknown[][] => {
    const rows: unknown[][] = [];
    worksheet.eachRow({ includeEmpty: false }, (row) => {
        const values = Array.isArray(row.values) ? row.values.slice(1) : [];
        rows.push(values.map(value => excelCellValue(value as ExcelJS.CellValue)));
    });
    return rows;
};

/**
 * Parse Excel file and return rows as 2D array.
 * Uses ExcelJS, which is already part of the product dependency set.
 */
export const parseExcel = async (file: File): Promise<unknown[][]> => {
    const module = await import('exceljs');
    const Excel = module.default ?? module;
    const workbook = new Excel.Workbook();
    const buffer = await file.arrayBuffer();
    await workbook.xlsx.load(buffer);
    const worksheet = workbook.worksheets[0];

    if (!worksheet) return [];
    return worksheetToRows(worksheet);
};

/**
 * Parse CSV file and return rows as 2D array
 */
export const parseCSV = (file: File): Promise<any[][]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const text = e.target?.result as string;
                const rows = text.split('\n').map(line =>
                    line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''))
                );
                resolve(rows);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = reject;
        reader.readAsText(file);
    });
};

/**
 * Automatically detect columns based on header names
 */
export const detectColumns = (headers: string[]): ColumnMapping => {
    const mapping: ColumnMapping = {};

    headers.forEach((header) => {
        const lower = header.toLowerCase().trim();

        // SKU detection
        if (!mapping.sku && (
            lower.includes('sku') ||
            lower.includes('part') ||
            lower.includes('código') ||
            lower.includes('codigo') ||
            lower === 'pn'
        )) {
            mapping.sku = header;
        }

        // Name detection
        else if (!mapping.name && (
            lower.includes('name') ||
            lower.includes('nome') ||
            lower.includes('produto') ||
            lower.includes('product') ||
            lower.includes('descrição') ||
            lower.includes('descricao')
        )) {
            mapping.name = header;
        }

        // Cost detection
        else if (!mapping.cost && (
            lower.includes('cost') ||
            lower.includes('custo') ||
            lower.includes('preço') ||
            lower.includes('preco') ||
            lower.includes('price') ||
            lower.includes('valor')
        )) {
            mapping.cost = header;
        }

        // Description detection
        else if (!mapping.description && (
            lower.includes('desc') ||
            lower.includes('observ') ||
            lower.includes('obs')
        )) {
            mapping.description = header;
        }

        // Category detection
        else if (!mapping.category && (
            lower.includes('categ') ||
            lower.includes('tipo') ||
            lower.includes('family') ||
            lower.includes('família')
        )) {
            mapping.category = header;
        }

        // Quantity detection
        else if (!mapping.quantity && (
            lower.includes('qtd') ||
            lower.includes('quant') ||
            lower.includes('qty') ||
            lower.includes('amount')
        )) {
            mapping.quantity = header;
        }
    });

    return mapping;
};

/**
 * Find the most likely header row by scoring rows based on known keywords
 */
export const findHeaderRow = (rows: any[][]): { headerRow: string[], index: number } => {
    let bestScore = 0;
    let bestIndex = 0;

    // Check first 20 rows
    const searchLimit = Math.min(rows.length, 20);

    for (let i = 0; i < searchLimit; i++) {
        const row = rows[i];
        if (!Array.isArray(row) || row.length === 0) continue;

        let score = 0;
        const rowStr = row.map(c => String(c).toLowerCase()).join(' ');

        // Keywords to look for
        if (rowStr.includes('sku') || rowStr.includes('part') || rowStr.includes('number') || rowStr.includes('pn')) score += 2;
        if (rowStr.includes('name') || rowStr.includes('nome') || rowStr.includes('descri') || rowStr.includes('product')) score += 2;
        if (rowStr.includes('price') || rowStr.includes('preço') || rowStr.includes('valor') || rowStr.includes('cost')) score += 2;
        if (rowStr.includes('qty') || rowStr.includes('qtd') || rowStr.includes('quant')) score += 2;

        if (score > bestScore) {
            bestScore = score;
            bestIndex = i;
        }
    }

    // Capture the best row
    if (bestScore > 0) {
        return {
            headerRow: rows[bestIndex].map(c => String(c)),
            index: bestIndex
        };
    }

    // Default to first row if no good match found
    return {
        headerRow: rows[0].map(c => String(c)),
        index: 0
    };
};


/**
 * Apply column mapping to rows and return parsed products
 */
export const applyMapping = (
    rows: any[][],
    mapping: ColumnMapping,
    headers: string[]
): ParsedRow[] => {
    // Create header index map
    const headerIndexMap: Record<string, number> = {};
    headers.forEach((h, i) => { headerIndexMap[h] = i; });

    // Parse each row (skip header row)
    return rows
        .map(row => {
            const sku = mapping.sku ? String(row[headerIndexMap[mapping.sku]] || '').trim() : '';
            const name = mapping.name ? String(row[headerIndexMap[mapping.name]] || '').trim() : '';
            const costStr = mapping.cost ? String(row[headerIndexMap[mapping.cost]] || '0') : '0';
            const qtyStr = mapping.quantity ? String(row[headerIndexMap[mapping.quantity]] || '1') : '1';

            // Parse cost - remove currency symbols and convert to number
            // Helper to parse localized numbers
            const parseNumber = (val: string): number => {
                let v = val.trim();
                if (!v) return 0;

                // Remove currency symbols and other non-numeric chars except . , -
                v = v.replace(/[^\d.,\-]/g, '');

                // Check for Brazilian format (1.234,56)
                // If it has both . and , and . comes before , -> Brazilian/European
                if (v.indexOf('.') !== -1 && v.indexOf(',') !== -1) {
                    if (v.indexOf('.') < v.lastIndexOf(',')) {
                        v = v.replace(/\./g, '').replace(',', '.');
                    } else {
                        // US format (1,234.56)
                        v = v.replace(/,/g, '');
                    }
                } else if (v.indexOf(',') !== -1) {
                    // Only comma -> decimal separator (common in BR)
                    v = v.replace(',', '.');
                }

                return parseFloat(v) || 0;
            };

            const cost = parseNumber(costStr);
            const quantity = Math.max(1, Math.round(parseNumber(qtyStr))); // Ensure at least 1, integer

            return {
                sku,
                name,
                cost,
                description: mapping.description ? String(row[headerIndexMap[mapping.description]] || '').trim() : undefined,
                category: mapping.category ? String(row[headerIndexMap[mapping.category]] || '').trim() : undefined,
                quantity
            };
        })
        .filter(row => {
            if (!row.name && !row.sku) return false;
            if (row.cost === 0 && !row.sku) return false;

            return true;
        });
};

/**
 * Validate that required columns are mapped
 */
export const validateMapping = (mapping: ColumnMapping): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];

    if (!mapping.sku) errors.push('SKU column is required');
    if (!mapping.name) errors.push('Product name column is required');
    if (!mapping.cost) errors.push('Cost/Price column is required');

    return {
        valid: errors.length === 0,
        errors
    };
};
