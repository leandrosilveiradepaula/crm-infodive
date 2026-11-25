import { proposalDocumentPrimitives } from '@/design-system/proposal-document-colors';
import React from 'react';
import { Cpu, HardDrive, Database, MemoryStick, Network, Zap, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getSmartProductDescription } from '@/utils/formatProductDescription';
import { type ProductTechDetail } from '@/types/deal';

interface ProposalHardwareProductProps {
    product: any;
    simplifiedName?: string;
}

export function ProposalHardwareProduct({ product, simplifiedName }: ProposalHardwareProductProps) {
    let rawSpecs: Array<ProductTechDetail> = [];
    const { isStructured, items } = getSmartDetails(product);

    if (isStructured && items) {
        rawSpecs = items
            .filter((d: any) => d.is_visible_on_proposal === true || String(d.is_visible_on_proposal) === 'true')
            .map((d: any, idx: number) => ({
                id: d.id || `legacy-${idx}`,
                sku: d.sku || '',
                description: d.description,
                quantity: Number(d.quantity) || 1,
                unit_price: Number(d.unit_price) || 0,
                is_visible_on_proposal: true, // Já filtramos acima
                is_highlighted_on_grid: d.is_highlighted_on_grid === true,
                grid_label: d.grid_label || ''
            }));
    } else {
        const lines = (product.description || '').split('\n').filter((l: string) => l.trim().length > 0);
        rawSpecs = lines.map((l: string, idx: number) => ({
            id: `legacy-${idx}`,
            description: l,
            quantity: 1,
            unit_price: 0,
            is_visible_on_proposal: true,
            is_highlighted_on_grid: false
        }));
    }

    let serverQty = 1;
    if (isStructured && items) {
        const serverBase = items.find((i: any) =>
            (i.description.toLowerCase().includes('server') || i.description.toLowerCase().includes('thinksystem') || i.description.toLowerCase().includes('chassi')) &&
            !i.description.toLowerCase().includes('option')
        );
        if (serverBase) serverQty = Number(serverBase.quantity) || 1;
    }

    const finalSpecs = getSmartProductDescription(rawSpecs, serverQty);

    const isStorage = product.name.toLowerCase().match(/storage|flash|ds8|v5000|v7000|v9000|fs7300|fs9200/) ||
        product.category?.toLowerCase().includes('storage');
    const isOptional = (product as any).is_optional;

    const formatTechText = (text: string) => {
        return text;
    };

    const getSpecIcon = (text: string) => {
        const lower = text.toLowerCase();
        if (lower.includes('processador') || lower.includes('cpu') || lower.includes('xeon') || lower.includes('epyc')) return <Cpu size={14} />;
        if (lower.includes('memória') || lower.includes('memory') || lower.includes('ram') || lower.includes('dimm')) return <MemoryStick size={14} />;
        if (lower.includes('disco') || lower.includes('disk') || lower.includes('ssd') || lower.includes('hdd') || lower.includes('flash') || lower.includes('nvme') || lower.includes('fcm')) return <Database size={14} />;
        if (lower.includes('rede') || lower.includes('ethernet') || lower.includes('fc') || lower.includes('fibre') || lower.includes('sfp') || lower.includes('adapter')) return <Network size={14} />;
        if (lower.includes('fonte') || lower.includes('psu') || lower.includes('power')) return <Zap size={14} />;
        return <Settings size={14} />;
    };

    const getTechGridItems = () => {
        const items: Array<{ label: string; value: string; color: 'gray' | 'blue' | 'green' | 'amber' | 'indigo' | 'teal' }> = [];

        // 1. Primeiramente, buscamos os items destacados através do novo Editor Visual (JSON Estruturado)
        const highlightedStructuredItems = rawSpecs.filter(spec => spec.is_highlighted_on_grid === true);

        if (highlightedStructuredItems.length > 0) {
            highlightedStructuredItems.forEach(spec => {
                // Infer a color or default to indigo based on the manual labels
                const label = spec.grid_label || 'Destaque Técnico';
                let color: 'gray' | 'blue' | 'green' | 'amber' | 'indigo' | 'teal' = 'indigo';
                const lowerLabel = label.toLowerCase();
                if (lowerLabel.includes('bruta')) color = 'gray';
                else if (lowerLabel.includes('útil') || lowerLabel.includes('util')) color = 'blue';
                else if (lowerLabel.includes('efetiva')) color = 'green';
                else if (lowerLabel.includes('cache')) color = 'amber';

                const value = spec.description;

                // If a similar label exists, append to avoid overwriting unless exact
                items.push({ label, value, color });
            });
            // Se encontrou via Editor Visual, nós já encerramos (evita duplicate com o regex antigo)
            // Se quiser mesclar com custom_fields antigos, podemos deixar continuar, mas é arriscado ficar duplicado.
        }

        // 3. Fallback: Auto-calculate RAW from disks if it's a storage and we have nothing else
        if (isStorage && items.length === 0) {
            let totalTB = 0;
            finalSpecs.forEach((spec: any) => {
                const dLower = spec.description.toLowerCase();
                const isDisk = dLower.includes('ssd') || dLower.includes('hdd') || dLower.includes('flash') || dLower.includes('fcm') || dLower.includes('nvme');
                if (isDisk && !dLower.includes('boot')) {
                    const match = spec.description.match(/Total:\s*([\d.,]+)\s*TB/);
                    if (match) {
                        totalTB += parseFloat(match[1].replace(',', '.'));
                    }
                }
            });

            if (totalTB > 0) {
                items.push({
                    label: 'Capacidade Bruta',
                    value: `${totalTB.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} TB`,
                    color: 'gray'
                });
            }
        }

        return items;
    };

    const gridItems = getTechGridItems();

    return (
        <div style={{ breakInside: 'avoid', marginBottom: '15px' }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '6px',
                padding: '8px 15px',
                backgroundColor: proposalDocumentPrimitives.slate50,
                borderRadius: '10px',
                borderLeft: `4px solid ${isStorage ? proposalDocumentPrimitives.sky700 : proposalDocumentPrimitives.red600}`,
                borderTop: `1px solid ${proposalDocumentPrimitives.slate200}`,
                borderRight: `1px solid ${proposalDocumentPrimitives.slate200}`,
                borderBottom: `1px solid ${proposalDocumentPrimitives.slate200}`
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: isStorage ? proposalDocumentPrimitives.sky100 : proposalDocumentPrimitives.red100,
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isStorage ? proposalDocumentPrimitives.sky700 : proposalDocumentPrimitives.red600
                    }}>
                        {isStorage ? <HardDrive size={18} /> : <Cpu size={18} />}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '15px', fontWeight: '800', color: proposalDocumentPrimitives.slate900, margin: 0, letterSpacing: '-0.3px', lineHeight: '1.2' }}>
                            {simplifiedName || product.name}
                        </h2>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '2px', alignItems: 'center' }}>
                            {isStorage && (
                                <span style={{ fontSize: '10px', fontWeight: '800', color: proposalDocumentPrimitives.slate500, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Storage
                                </span>
                            )}
                            {isOptional && (
                                <Badge style={{
                                    backgroundColor: proposalDocumentPrimitives.violet50,
                                    color: proposalDocumentPrimitives.violet600,
                                    border: `1px solid ${proposalDocumentPrimitives.violet200}`,
                                    fontSize: '9px',
                                    padding: '0 8px',
                                    height: '18px',
                                    fontWeight: '900',
                                    textTransform: 'uppercase'
                                }}>
                                    OPÇÃO ALTERNATIVA
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{
                        fontSize: '10px',
                        fontWeight: '800',
                        color: proposalDocumentPrimitives.slate400,
                        textTransform: 'uppercase',
                        marginBottom: '2px'
                    }}>
                        &nbsp;
                    </div>
                    <div style={{
                        backgroundColor: proposalDocumentPrimitives.paperWhite,
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: `1px solid ${proposalDocumentPrimitives.slate200}`,
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: proposalDocumentPrimitives.defaultAccent, letterSpacing: '0.5px' }}>QTY:</span>
                        <span style={{ fontSize: '15px', fontWeight: '900', color: proposalDocumentPrimitives.slate900 }}>{serverQty}</span>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: proposalDocumentPrimitives.slate500 }}>{serverQty > 1 ? 'UNIDADES' : 'UNIDADE'}</span>
                    </div>
                </div>
            </div>

            {/* Technical Details / Capacity Grid */}
            {gridItems.length > 0 && (
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: gridItems.length === 1 ? '1fr' :
                        gridItems.length === 2 ? '1fr 1fr' :
                            gridItems.length === 3 ? 'repeat(3, 1fr)' :
                                (gridItems.length === 5 || gridItems.length === 6) ? 'repeat(3, 1fr)' :
                                    'repeat(4, 1fr)',
                    gap: '6px',
                    marginBottom: '8px',
                    marginLeft: '5px'
                }}>
                    {gridItems.map((item, idx) => {
                        const colors: Record<string, any> = {
                            gray: { bg: proposalDocumentPrimitives.slate100, text: proposalDocumentPrimitives.slate500, val: proposalDocumentPrimitives.slate800 },
                            blue: { bg: proposalDocumentPrimitives.blue50, text: proposalDocumentPrimitives.blue500, val: proposalDocumentPrimitives.blue900 },
                            green: { bg: proposalDocumentPrimitives.green50, text: proposalDocumentPrimitives.green500, val: proposalDocumentPrimitives.green900 },
                            amber: { bg: proposalDocumentPrimitives.amber50, text: proposalDocumentPrimitives.amber500, val: proposalDocumentPrimitives.amber900 },
                            indigo: { bg: proposalDocumentPrimitives.indigo50, text: proposalDocumentPrimitives.indigo500, val: proposalDocumentPrimitives.indigo900 },
                            teal: { bg: proposalDocumentPrimitives.teal50, text: proposalDocumentPrimitives.teal500, val: proposalDocumentPrimitives.teal900 },
                        };
                        const itemColors = colors[item.color] || colors.gray;

                        return (
                            <div key={idx} style={{
                                backgroundColor: itemColors.bg,
                                padding: '8px 10px',
                                borderRadius: '6px',
                                display: 'flex',
                                flexDirection: 'column',
                                justifyContent: 'center',
                                border: '1px solid rgba(0,0,0,0.03)'
                            }}>
                                <div style={{
                                    fontSize: '9.5px',
                                    fontWeight: '800',
                                    color: itemColors.text,
                                    textTransform: 'uppercase',
                                    marginBottom: '4px',
                                    letterSpacing: '0.5px'
                                }}>
                                    {item.label}
                                </div>
                                <div style={{
                                    fontSize: '13.5px',
                                    fontWeight: '700',
                                    color: itemColors.val,
                                    lineHeight: '1.2'
                                }}>
                                    {item.value}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            <div style={{
                marginLeft: '5px',
                backgroundColor: proposalDocumentPrimitives.paperWhite,
                borderRadius: '12px',
                border: `1px solid ${proposalDocumentPrimitives.slate100}`,
                overflow: 'hidden'
            }}>
                {finalSpecs.filter(spec => {
                    const lower = spec.description.toLowerCase();
                    return !lower.includes('capacidade bruta') &&
                        !lower.includes('capacidade útil') &&
                        !lower.includes('capacidade efetiva') &&
                        !lower.includes('memória cache') &&
                        !lower.includes('base cache') &&
                        !lower.includes('aix spo') &&
                        !lower.includes('ibm learning subscription');
                }).map((spec, i) => (
                    <div key={i} style={{
                        display: 'flex',
                        alignItems: 'center',
                        padding: '2px 8px',
                        borderBottom: i === finalSpecs.length - 1 ? 'none' : `1px solid ${proposalDocumentPrimitives.slate100}`,
                        backgroundColor: i % 2 === 0 ? proposalDocumentPrimitives.paperWhite : proposalDocumentPrimitives.paperWarmWhite,
                        height: '100%'
                    }}>
                        <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '3px',
                            backgroundColor: proposalDocumentPrimitives.slate50,
                            color: proposalDocumentPrimitives.slate500,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            marginRight: '6px',
                            flexShrink: 0
                        }}>
                            {/* Adjusted icon size to be even smaller */}
                            {React.cloneElement(getSpecIcon(spec.description) as React.ReactElement<any>, { size: 11 })}
                        </div>

                        <div style={{
                            minWidth: '28px',
                            fontSize: '11px',
                            fontWeight: '950',
                            color: proposalDocumentPrimitives.defaultAccent,
                            marginRight: '8px',
                            flexShrink: 0,
                            letterSpacing: '-0.3px'
                        }}>
                            {spec.qty}x
                        </div>

                        <div style={{
                            fontSize: '10.5px',
                            color: proposalDocumentPrimitives.slate600,
                            lineHeight: '1.05',
                            fontWeight: '500',
                            flex: 1,
                            wordBreak: 'break-word'
                        }}>
                            {formatTechText(spec.description)}
                        </div>
                    </div>
                )).reduce((rows: any[], key, index) => {
                    if (index % 2 === 0) rows.push([key]);
                    else rows[rows.length - 1].push(key);
                    return rows;
                }, []).map((row, rowIndex) => (
                    <div key={rowIndex} style={{ display: 'flex', borderBottom: `1px solid ${proposalDocumentPrimitives.slate100}` }}>
                        <div style={{ flex: 1, borderRight: `1px solid ${proposalDocumentPrimitives.slate100}` }}>{row[0]}</div>
                        <div style={{ flex: 1 }}>{row[1] || <div style={{ height: '32px' }} />}</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function getSmartDetails(product: any) {
    // 1. PRIORIDADE TOTAL: description (onde o editor visual salva o JSON)
    if (product.description) {
        try {
            const parsed = typeof product.description === 'string'
                ? JSON.parse(product.description)
                : product.description;

            if (Array.isArray(parsed) && parsed.length > 0) {
                return { isStructured: true, items: parsed };
            }
        } catch { }
    }

    // 2. FALLBACK: tech_details (campo legado ou importação direta)
    if (product.tech_details) {
        try {
            const parsed = typeof product.tech_details === 'string'
                ? JSON.parse(product.tech_details)
                : product.tech_details;

            if (Array.isArray(parsed) && parsed.length > 0) {
                return { isStructured: true, items: parsed };
            }
        } catch { }
    }

    return { isStructured: false, items: null };
}
