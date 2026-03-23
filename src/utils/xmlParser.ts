/**
 * XML Parser for Brazilian NFe (Nota Fiscal Eletrônica)
 * Extracts product information from NFe XML files
 */

export interface ParsedProduct {
    sku: string;
    name: string;
    quantity: number;
    cost: number;
    total?: number;
    ncm?: string;
    cfop?: string;
    unit?: string;
}

/**
 * Parse XML string to Document
 */
function parseXMLString(xmlString: string): Document {
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlString, 'text/xml');

    // Check for parsing errors
    const parserError = xmlDoc.querySelector('parsererror');
    if (parserError) {
        throw new Error('XML inválido ou malformado');
    }

    return xmlDoc;
}

/**
 * Safe number parser for XML values
 */
function parseXMLNumber(value: string | null): number {
    if (!value) return 0;
    const cleaned = value.trim().replace(',', '.');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
}

/**
 * Extract products from NFe XML Document
 */
function extractProductsFromNFe(xmlDoc: Document): ParsedProduct[] {
    const products: ParsedProduct[] = [];

    // NFe can have different namespaces, so we'll search without namespace
    // Get all <det> elements (product details)
    const detElements = xmlDoc.getElementsByTagName('det');

    if (detElements.length === 0) {
        throw new Error('Nenhum produto encontrado no XML. Verifique se o arquivo é uma NFe válida.');
    }

    // Iterate through each product detail
    for (let i = 0; i < detElements.length; i++) {
        const det = detElements[i];

        // Get <prod> element inside <det>
        const prodElement = det.getElementsByTagName('prod')[0];
        if (!prodElement) continue;

        // Extract product fields
        const cProd = prodElement.getElementsByTagName('cProd')[0]?.textContent || '';
        const xProd = prodElement.getElementsByTagName('xProd')[0]?.textContent || '';
        const qCom = prodElement.getElementsByTagName('qCom')[0]?.textContent || '0';
        const vUnCom = prodElement.getElementsByTagName('vUnCom')[0]?.textContent || '0';
        const vProd = prodElement.getElementsByTagName('vProd')[0]?.textContent || '0';
        const ncm = prodElement.getElementsByTagName('NCM')[0]?.textContent || '';
        const cfop = prodElement.getElementsByTagName('CFOP')[0]?.textContent || '';
        const uCom = prodElement.getElementsByTagName('uCom')[0]?.textContent || 'UN';

        // Parse numeric values
        const quantity = parseXMLNumber(qCom);
        const unitPrice = parseXMLNumber(vUnCom);
        const totalPrice = parseXMLNumber(vProd);

        // Only add if has required fields
        if (xProd && quantity > 0) {
            products.push({
                sku: cProd || `NFE-${i + 1}`,
                name: xProd,
                quantity: quantity,
                cost: unitPrice,
                total: totalPrice,
                ncm: ncm || undefined,
                cfop: cfop || undefined,
                unit: uCom || undefined
            });
        }
    }

    if (products.length === 0) {
        throw new Error('Nenhum produto válido encontrado. Verifique se os itens possuem nome e quantidade.');
    }

    return products;
}

/**
 * Main function to parse XML file
 * @param file - XML file to parse
 * @returns Array of parsed products
 */
export async function parseXML(file: File): Promise<ParsedProduct[]> {
    try {
        // Read file as text
        const xmlString = await file.text();

        // Parse XML string
        const xmlDoc = parseXMLString(xmlString);

        // Extract products
        const products = extractProductsFromNFe(xmlDoc);

        console.log(`✅ XML parsed successfully: ${products.length} products found`);
        return products;

    } catch (error: any) {
        console.error('❌ Error parsing XML:', error);
        throw new Error(`Erro ao processar XML: ${error.message}`);
    }
}

/**
 * Validate if file is a valid NFe XML
 */
export function isValidNFeXML(xmlDoc: Document): boolean {
    // Check for NFe root elements
    const nfeProc = xmlDoc.getElementsByTagName('nfeProc')[0];
    const nfe = xmlDoc.getElementsByTagName('NFe')[0];
    const infNFe = xmlDoc.getElementsByTagName('infNFe')[0];

    return !!(nfeProc || nfe || infNFe);
}

/**
 * Extract NFe metadata (optional)
 */
export interface NFeMetadata {
    number?: string;
    series?: string;
    issueDate?: string;
    totalValue?: number;
    supplier?: {
        cnpj?: string;
        name?: string;
    };
    customer?: {
        cnpj?: string;
        name?: string;
    };
}

export function extractNFeMetadata(xmlDoc: Document): NFeMetadata {
    const metadata: NFeMetadata = {};

    try {
        // Get invoice info
        const ide = xmlDoc.getElementsByTagName('ide')[0];
        if (ide) {
            metadata.number = ide.getElementsByTagName('nNF')[0]?.textContent || undefined;
            metadata.series = ide.getElementsByTagName('serie')[0]?.textContent || undefined;
            metadata.issueDate = ide.getElementsByTagName('dhEmi')[0]?.textContent || undefined;
        }

        // Get supplier info
        const emit = xmlDoc.getElementsByTagName('emit')[0];
        if (emit) {
            metadata.supplier = {
                cnpj: emit.getElementsByTagName('CNPJ')[0]?.textContent || undefined,
                name: emit.getElementsByTagName('xNome')[0]?.textContent || undefined
            };
        }

        // Get customer info
        const dest = xmlDoc.getElementsByTagName('dest')[0];
        if (dest) {
            metadata.customer = {
                cnpj: dest.getElementsByTagName('CNPJ')[0]?.textContent || undefined,
                name: dest.getElementsByTagName('xNome')[0]?.textContent || undefined
            };
        }

        // Get total value
        const total = xmlDoc.getElementsByTagName('total')[0];
        if (total) {
            const vNF = total.getElementsByTagName('vNF')[0]?.textContent;
            metadata.totalValue = parseXMLNumber(vNF || '0');
        }

    } catch (error) {
        console.warn('Could not extract all metadata:', error);
    }

    return metadata;
}
