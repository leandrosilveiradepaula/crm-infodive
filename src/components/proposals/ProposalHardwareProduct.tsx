import React from 'react';
import { Cpu, HardDrive, Database, MemoryStick, Network, Zap, Settings } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { getSmartProductDescription } from '@/utils/formatProductDescription';
import { type ProductTechDetail } from '@/types/deal';

interface ProposalHardwareProductProps {
    product: any;
}

export function ProposalHardwareProduct({ product }: ProposalHardwareProductProps) {
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

    let finalSpecs = getSmartProductDescription(rawSpecs, serverQty);

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
                let label = spec.grid_label || 'Destaque Técnico';
                let color: 'gray' | 'blue' | 'green' | 'amber' | 'indigo' | 'teal' = 'indigo';
                const lowerLabel = label.toLowerCase();
                if (lowerLabel.includes('bruta')) color = 'gray';
                else if (lowerLabel.includes('útil') || lowerLabel.includes('util')) color = 'blue';
                else if (lowerLabel.includes('efetiva')) color = 'green';
                else if (lowerLabel.includes('cache')) color = 'amber';

                let value = spec.description;

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
                backgroundColor: '#f8fafc',
                borderRadius: '10px',
                borderLeft: `4px solid ${isStorage ? '#0369a1' : '#dc2626'}`,
                borderTop: '1px solid #e2e8f0',
                borderRight: '1px solid #e2e8f0',
                borderBottom: '1px solid #e2e8f0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{
                        width: '32px',
                        height: '32px',
                        backgroundColor: isStorage ? '#e0f2fe' : '#fee2e2',
                        borderRadius: '8px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: isStorage ? '#0369a1' : '#dc2626'
                    }}>
                        {isStorage ? <HardDrive size={18} /> : <Cpu size={18} />}
                    </div>
                    <div>
                        <h2 style={{ fontSize: '15px', fontWeight: '800', color: '#0f172a', margin: 0, letterSpacing: '-0.3px', lineHeight: '1.2' }}>
                            {product.name}
                        </h2>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '2px', alignItems: 'center' }}>
                            {isStorage && (
                                <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                    Storage
                                </span>
                            )}
                            {isOptional && (
                                <Badge style={{
                                    backgroundColor: '#f5f3ff',
                                    color: '#7c3aed',
                                    border: '1px solid #ddd6fe',
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
                        color: '#94a3b8',
                        textTransform: 'uppercase',
                        marginBottom: '2px'
                    }}>
                        &nbsp;
                    </div>
                    <div style={{
                        backgroundColor: '#ffffff',
                        padding: '6px 14px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        display: 'flex',
                        alignItems: 'baseline',
                        gap: '6px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.04)',
                    }}>
                        <span style={{ fontSize: '10px', fontWeight: '900', color: '#E31837', letterSpacing: '0.5px' }}>QTY:</span>
                        <span style={{ fontSize: '15px', fontWeight: '900', color: '#0f172a' }}>{serverQty}</span>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#64748b' }}>{serverQty > 1 ? 'UNIDADES' : 'UNIDADE'}</span>
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
                            gray: { bg: '#f1f5f9', text: '#64748b', val: '#1e293b' },
                            blue: { bg: '#eff6ff', text: '#3b82f6', val: '#1e3a8a' },
                            green: { bg: '#f0fdf4', text: '#22c55e', val: '#14532d' },
                            amber: { bg: '#fffbeb', text: '#f59e0b', val: '#78350f' },
                            indigo: { bg: '#eef2ff', text: '#6366f1', val: '#312e81' },
                            teal: { bg: '#f0fdfa', text: '#14b8a6', val: '#134e4a' },
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
                backgroundColor: '#ffffff',
                borderRadius: '12px',
                border: '1px solid #f1f5f9',
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
                        borderBottom: i === finalSpecs.length - 1 ? 'none' : '1px solid #f1f5f9',
                        backgroundColor: i % 2 === 0 ? '#ffffff' : '#fcfcfc',
                        height: '100%'
                    }}>
                        <div style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '3px',
                            backgroundColor: '#f8fafc',
                            color: '#64748b',
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
                            color: '#E31837',
                            marginRight: '8px',
                            flexShrink: 0,
                            letterSpacing: '-0.3px'
                        }}>
                            {spec.qty}x
                        </div>

                        <div style={{
                            fontSize: '10.5px',
                            color: '#475569',
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
                    <div key={rowIndex} style={{ display: 'flex', borderBottom: '1px solid #f1f5f9' }}>
                        <div style={{ flex: 1, borderRight: '1px solid #f1f5f9' }}>{row[0]}</div>
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
