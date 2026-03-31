import { type ProductTechDetail } from '@/types/deal';

export const formatProductDescription = (description: string | null | undefined): {
    isStructured: boolean;
    items?: Array<ProductTechDetail>;
    text?: string;
} => {
    if (!description) return { isStructured: false, text: '' };

    // Tentar parsear como JSON
    try {
        const parsed = JSON.parse(description);

        // Se for array de objetos com SKU ou description, é um bundle estruturado
        if (Array.isArray(parsed) && parsed.length > 0 && (parsed[0].sku || parsed[0].description)) {
            return {
                isStructured: true,
                items: (parsed as ProductTechDetail[]).filter((item) => item.is_visible_on_proposal === true || String(item.is_visible_on_proposal) === 'true')
            };
        }
    } catch {
        // Não é JSON, retornar como texto
    }

    return {
        isStructured: false,
        text: description
    };
};

export interface SmartSpecItem {
    qty: number;
    description: string;
    sku?: string;
    is_visible_on_proposal?: boolean;
    is_highlighted_on_grid?: boolean;
    grid_label?: string | null;
}

// Lógica avançada de "Limpeza" e "Cálculo" de especificações
export const getSmartProductDescription = (
    rawItems: Array<ProductTechDetail>,
    serverQty: number = 1
): SmartSpecItem[] => {
    // 1. Normalização de quantidades e filtragem inicial
    const specsLines: SmartSpecItem[] = rawItems
        .filter(item => item.is_visible_on_proposal === true || String(item.is_visible_on_proposal) === 'true') // Filtro CRÍTICO
        .map(item => ({
            qty: Math.ceil((Number(item.quantity) || 1) / serverQty),
            description: item.description,
            sku: item.sku,
            is_visible_on_proposal: item.is_visible_on_proposal,
            is_highlighted_on_grid: item.is_highlighted_on_grid,
            grid_label: item.grid_label
        }));

    const curatedSpecs = [...specsLines];



    // 6. Ordenação Refinada
    curatedSpecs.sort((a, b) => {
        const aLower = a.description.toLowerCase();
        const bLower = b.description.toLowerCase();

        const getPriority = (desc: string) => {
            // 1. Enclosure / Base (First)
            if (desc.includes('Control Enclosure') || desc.includes('Chassis') || desc.includes('Server') || desc.includes('Node')) return 1;

            // 2. Capacity Disks (Large capacity, FCM, etc. but not boot)
            if ((desc.includes('TB') || desc.includes('FCM') || desc.includes('NVMe') || desc.includes('SSD')) && !desc.includes('Boot')) return 2;

            // 3. Boot Drives
            if (desc.includes('Boot') || desc.includes('M.2')) return 3;

            // 4. Adapters / Connectivity
            if (desc.includes('Adapter') || desc.includes('FC ') || desc.includes('Fibre Channel') || desc.includes('Ethernet')) return 4;

            // 5. Core Processing (CPU/RAM)
            if (desc.includes('Processor') || desc.includes('CPU') || desc.includes('Memory') || desc.includes('RAM')) return 5;

            // 7. Infrastructure (Last)
            if (['cabo', 'cable', 'power', 'psu', 'fonte', 'cord', 'pdu'].some(term => desc.toLowerCase().includes(term))) return 7;

            // 6. Default (Others)
            return 6;
        };

        const prioA = getPriority(a.description);
        const prioB = getPriority(b.description);

        if (prioA !== prioB) return prioA - prioB;

        // Secondary sort: Alphabetical if same priority
        return aLower.localeCompare(bLower);
    });

    return curatedSpecs;
};

// Renderiza items como lista de especificações técnicas (usa a lógica smart)
export const renderSpecList = (items: Array<ProductTechDetail>) => {
    // Usa a lógica smart com serverQty=1 (padrão para lista simples)
    const smartSpecs = getSmartProductDescription(items, 1);

    return smartSpecs.map(item => {
        if (item.qty === 1) {
            return `• ${item.description}`;
        }
        return `• ${item.description} (${item.qty} un.)`;
    }).join('\n');
};
