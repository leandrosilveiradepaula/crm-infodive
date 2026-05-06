import React from 'react';
import type { DealProduct } from '@/types/deal';
import { isSoftware, isService, isSupport, getClassificationLabel } from '@/utils/productClassification';

interface ProposalInvestmentTableProps {
    mainProducts: DealProduct[];
    formatCurrency: (value: number) => string;
    totalMainValue: number;
    title?: string;
    isSubtotal?: boolean;
    simplifiedProductNames?: Record<string, string>;
    themePrimary?: string;
    themeAccent?: string;
    optionLabel?: string;
    pricingSuffix?: string;
    pricingModel?: 'one_time' | 'monthly' | 'annual';
}

export function ProposalInvestmentTable({ mainProducts, formatCurrency, title, isSubtotal, simplifiedProductNames = {}, themePrimary, themeAccent, optionLabel, pricingSuffix, pricingModel }: Omit<ProposalInvestmentTableProps, 'totalMainValue'>) {
    const primaryColor = themePrimary || '#1e3a5f';
    const accentColor = themeAccent || '#E31837';
    return (
        <div style={{ padding: '0 80px', marginTop: '10px' }}>
            {title && (
                <div style={{
                    fontSize: '14px',
                    fontWeight: '800',
                    color: primaryColor,
                    marginBottom: '10px',
                    textTransform: 'uppercase',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '15px'
                }}>
                    <div style={{ width: '4px', height: '14px', backgroundColor: accentColor, borderRadius: '2px' }} />
                    {title}
                </div>
            )}
            <div style={{
                borderTop: `3px solid ${primaryColor}`,
                borderBottom: `3px solid ${primaryColor}`,
                backgroundColor: '#ffffff'
            }}>
                <div style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 110px 45px 95px 110px',
                    padding: '12px 15px',
                    backgroundColor: '#f3f4f6',
                    borderBottom: '1px solid #e5e7eb'
                }}>
                    <div style={{ color: accentColor, fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase' }}>Descrição</div>
                    <div style={{ color: accentColor, fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase' }}>SKU / Part Number</div>
                    <div style={{ color: accentColor, fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase', textAlign: 'center' }}>Qtd</div>
                    <div style={{ color: accentColor, fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase', textAlign: 'right' }}>Unitário{pricingSuffix ? ` ${pricingSuffix}` : ''}</div>
                    <div style={{ color: accentColor, fontWeight: 'bold', fontSize: '9px', textTransform: 'uppercase', textAlign: 'right' }}>Investimento{pricingSuffix ? ` ${pricingSuffix}` : ''}</div>
                </div>

                {(() => {
                    const groupedProducts = mainProducts.reduce((acc, product) => {
                        let categoryLabel = product.category || getClassificationLabel(product);
                        if (product.subcategory && !categoryLabel.includes(product.subcategory)) {
                            categoryLabel += ` - ${product.subcategory}`;
                        }
                        if (!acc[categoryLabel]) acc[categoryLabel] = [];
                        acc[categoryLabel].push(product);
                        return acc;
                    }, {} as Record<string, typeof mainProducts>);

                    return Object.entries(groupedProducts).map(([category, productsInCategory], groupIdx) => (
                        <React.Fragment key={`group-${groupIdx}`}>
                            {/* Category Header Row */}
                            <div style={{
                                padding: '8px 15px',
                                backgroundColor: '#f8fafc',
                                borderBottom: '1px solid #e2e8f0'
                            }}>
                                <span style={{ fontSize: '10px', fontWeight: 'bold', color: primaryColor, textTransform: 'uppercase' }}>
                                    {category}
                                </span>
                            </div>
                            
                            {/* Products in Category */}
                            {productsInCategory.map((product, idx) => {
                                const isUSD = product.present_in_usd;
                                const unitPrice = isUSD ? ((product.unit_price || 0) / (product.exchange_rate || 1)) : (product.unit_price || 0);
                                const productTotal = unitPrice * (product.quantity || 1);

                                const formatValue = (val: number) => isUSD 
                                    ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
                                    : formatCurrency(val);

                                return (
                                    <div key={`prod-${idx}`} style={{
                                        display: 'grid',
                                        gridTemplateColumns: '1fr 110px 45px 95px 110px',
                                        padding: '10px 15px',
                                        borderBottom: '1px solid #e5e7eb',
                                        alignItems: 'center',
                                        backgroundColor: idx % 2 === 0 ? '#ffffff' : '#fafbfc'
                                    }}>
                                        <div style={{ color: '#374151', fontSize: '11px', fontWeight: '600', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                                            <span>{simplifiedProductNames[product.name] || product.display_name || product.name}</span>
                                            {product.duration && product.duration_unit && (
                                                <span style={{ fontSize: '9px', color: '#059669', fontStyle: 'italic', fontWeight: 'bold' }}>
                                                    {pricingModel === 'monthly' || pricingModel === 'annual'
                                                        ? `(Contrato de ${product.duration} ${product.duration_unit})`
                                                        : `(Válido por ${product.duration} ${product.duration_unit})`}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ color: '#64748b', fontSize: '10px', fontWeight: '500', fontFamily: 'var(--font-mono, monospace)', letterSpacing: '-0.2px' }}>
                                            {(product.show_sku_on_proposal !== false) ? (product.sku || '-') : '-'}
                                        </div>
                                        <div style={{ color: '#374151', fontSize: '11px', textAlign: 'center', fontWeight: '600' }}>
                                            {product.quantity || 1}
                                        </div>
                                        <div style={{ color: '#64748b', fontWeight: '600', fontSize: '11px', textAlign: 'right' }}>
                                            {formatValue(unitPrice)}
                                        </div>
                                        <div style={{ color: '#111827', fontWeight: '700', fontSize: '12px', textAlign: 'right' }}>
                                            {formatValue(productTotal)}
                                        </div>
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ));
                })()}

                {mainProducts.length === 0 && (
                    <div style={{ padding: '24px', textAlign: 'center', color: '#6b7280' }}>
                        Consulte as opções alternativas abaixo.
                    </div>
                )}
            </div>

            {(() => {
                const totalMainBRL = mainProducts.reduce((acc, p) => {
                    if (p.present_in_usd) return acc;
                    return acc + (p.unit_price || 0) * (p.quantity || 1);
                }, 0);

                const totalMainUSD = mainProducts.reduce((acc, p) => {
                    if (!p.present_in_usd) return acc;
                    const usdPrice = (p.unit_price || 0) / (p.exchange_rate || 1);
                    return acc + (usdPrice * (p.quantity || 1));
                }, 0);

                return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px', padding: '0 15px', alignItems: 'flex-end' }}>
                        {totalMainBRL > 0 && (
                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                <div style={{
                                    fontSize: isSubtotal ? '12px' : '14px', fontWeight: '800', color: '#4b5563',
                                    textTransform: 'uppercase', textAlign: 'right', paddingRight: '20px', letterSpacing: '0.5px'
                                }}>
                                    {isSubtotal ? 'Subtotal (Itens Acima)' : optionLabel ? `Investimento ${optionLabel}` : pricingSuffix ? `Total${pricingSuffix ? ` ${pricingSuffix}` : ''}` : 'Investimento Consolidado'} {totalMainUSD > 0 ? '(BRL)' : ''}
                                </div>
                                <div style={{ fontSize: isSubtotal ? '18px' : '22px', fontWeight: '800', color: accentColor, textAlign: 'right' }}>
                                    {formatCurrency(totalMainBRL)}
                                </div>
                            </div>
                        )}
                        {totalMainUSD > 0 && (
                            <div style={{ display: 'flex', alignItems: 'baseline' }}>
                                <div style={{
                                    fontSize: isSubtotal ? '12px' : '14px', fontWeight: '800', color: '#4b5563',
                                    textTransform: 'uppercase', textAlign: 'right', paddingRight: '20px', letterSpacing: '0.5px'
                                }}>
                                    {isSubtotal ? 'Subtotal (Itens Acima)' : optionLabel ? `Investimento ${optionLabel}` : 'Investimento Consolidado'} (USD)
                                </div>
                                <div style={{ fontSize: isSubtotal ? '18px' : '22px', fontWeight: '800', color: accentColor, textAlign: 'right' }}>
                                    {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(totalMainUSD)}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })()}
        </div>
    );
}

interface ProposalInvestmentOptionalsProps {
    optionalProducts: DealProduct[];
    rootProducts?: DealProduct[];
    formatCurrency: (value: number) => string;
    simplifiedProductNames?: Record<string, string>;
    themePrimary?: string;
    themeAccent?: string;
}

export function ProposalInvestmentOptionals({ optionalProducts, rootProducts, formatCurrency, simplifiedProductNames = {}, themePrimary, themeAccent }: ProposalInvestmentOptionalsProps) {
    const primaryColor = themePrimary || '#1e3a5f';
    const accentColor = themeAccent || '#E31837';
    const visibleOptionalProducts = optionalProducts.filter(p => p.is_visible_on_proposal !== false);
    if (visibleOptionalProducts.length === 0) return null;

    const displayRoots = rootProducts
        ? rootProducts.filter(p => p.is_visible_on_proposal !== false)
        : visibleOptionalProducts.filter(p => !p.parent_id || !visibleOptionalProducts.some(op => op.id === p.parent_id));

    if (displayRoots.length === 0) return null;

    return (
        <div style={{ padding: '0 80px', marginTop: '15px' }}>
            <h3 style={{
                fontSize: '14px',
                fontWeight: '700',
                color: '#b45309',
                marginBottom: '10px',
                textTransform: 'uppercase',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#f59e0b', borderRadius: '50%' }}></span>
                Opções Adicionais / Alternativas
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {displayRoots.map((parent, pIdx) => {
                    const renderChildren = (parentId: string, depth: number = 0) => {
                        const children = optionalProducts.filter(c => c.parent_id === parentId);
                        if (children.length === 0) return null;

                        return children.map((child, cIdx) => (
                            <React.Fragment key={child.id || cIdx}>
                                <div style={{
                                    display: 'grid',
                                    gridTemplateColumns: '1fr 140px',
                                    padding: `8px 20px 8px ${48 + (depth * 20)}px`,
                                    borderTop: '1px solid #fef3c7',
                                    backgroundColor: '#fffbf0',
                                    alignItems: 'center',
                                    position: 'relative'
                                }}>
                                    <div style={{
                                        position: 'absolute',
                                        left: `${32 + (depth * 20)}px`,
                                        top: '0',
                                        bottom: cIdx === children.length - 1 && !optionalProducts.some(gc => gc.parent_id === child.id) ? '50%' : '100%',
                                        width: '1px',
                                        backgroundColor: '#f59e0b'
                                    }} />
                                    <div style={{
                                        position: 'absolute',
                                        left: `${32 + (depth * 20)}px`,
                                        top: '50%',
                                        width: '12px',
                                        height: '1px',
                                        backgroundColor: '#f59e0b'
                                    }} />

                                    <div>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <div style={{ fontWeight: '700', color: primaryColor, fontSize: '12px' }}>{simplifiedProductNames[child.name] || child.name}</div>
                                            {isSoftware(child) && (
                                                <span style={{
                                                    fontSize: '9px',
                                                    fontWeight: '800',
                                                    backgroundColor: '#dcfce7',
                                                    color: '#166534',
                                                    padding: '2px 8px',
                                                    borderRadius: '12px',
                                                    textTransform: 'uppercase',
                                                    border: '1px solid #bbf7d0'
                                                }}>
                                                    Software
                                                </span>
                                            )}
                                            {child.custom_label && (
                                                <span style={{
                                                    fontSize: '9px',
                                                    fontWeight: '700',
                                                    backgroundColor: '#fef3c7',
                                                    color: '#92400e',
                                                    padding: '1px 6px',
                                                    borderRadius: '10px',
                                                    textTransform: 'uppercase',
                                                    border: '1px solid #fde68a'
                                                }}>
                                                    {child.custom_label}
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '10px', color: '#64748b', marginTop: '1px', fontWeight: '500' }}>
                                            {child.category || getClassificationLabel(child)} - Qtd: {child.quantity} - Unit.: {child.present_in_usd ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((child.unit_price || 0) / (child.exchange_rate || 1)) : formatCurrency(child.unit_price || 0)}
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right', fontWeight: '600', color: '#374151', fontSize: '13px' }}>
                                        {child.present_in_usd ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(((child.unit_price || 0) / (child.exchange_rate || 1)) * (child.quantity || 1)) : formatCurrency((child.unit_price || 0) * (child.quantity || 1))}
                                    </div>
                                </div>
                                {renderChildren(child.id, depth + 1)}
                            </React.Fragment>
                        ));
                    };

                    const directChildren = optionalProducts.filter(c => c.parent_id === parent.id);
                    // Calculate total value recursively
                    const calculateTotalRecursive = (pId: string): number => {
                        const children = optionalProducts.filter(c => c.parent_id === pId);
                        return children.reduce((acc, c) => acc + ((c.unit_price || 0) * (c.quantity || 1)) + calculateTotalRecursive(c.id), 0);
                    };

                    return (
                        <div key={pIdx} style={{
                            border: '1px solid #fde68a',
                            borderRadius: '12px',
                            backgroundColor: '#fff',
                            overflow: 'hidden',
                            boxShadow: '0 2px 4px rgba(180, 83, 9, 0.05)'
                        }}>
                            <div style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 140px',
                                padding: '12px 20px',
                                backgroundColor: '#fff',
                                alignItems: 'center'
                            }}>
                                <div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                        <div style={{ fontWeight: '700', color: primaryColor, fontSize: '13px' }}>{simplifiedProductNames[parent.name] || parent.name}</div>
                                        {parent.custom_label && (
                                            <span style={{
                                                fontSize: '10px',
                                                fontWeight: '800',
                                                backgroundColor: '#eff6ff',
                                                color: '#1e40af',
                                                padding: '2px 8px',
                                                borderRadius: '12px',
                                                textTransform: 'uppercase',
                                                border: '1px solid #dbeafe'
                                            }}>
                                                {parent.custom_label}
                                            </span>
                                        )}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px' }}>
                                        {parent.category || 'Hardware'} - Qtd: {parent.quantity} - Unit.: {parent.present_in_usd ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((parent.unit_price || 0) / (parent.exchange_rate || 1)) : formatCurrency(parent.unit_price || 0)}
                                    </div>
                                </div>
                                <div style={{ textAlign: 'right', fontWeight: '700', color: '#111827', fontSize: '13px' }}>
                                    {parent.present_in_usd ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(((parent.unit_price || 0) / (parent.exchange_rate || 1)) * (parent.quantity || 1)) : formatCurrency((parent.unit_price || 0) * (parent.quantity || 1))}
                                </div>
                            </div>

                            {renderChildren(parent.id)}

                            {directChildren.length > 0 && (
                                <div style={{
                                    padding: '10px 20px',
                                    backgroundColor: '#fffbeb',
                                    borderTop: '2px solid #fde68a',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center'
                                }}>
                                    <span style={{ fontSize: '11px', fontWeight: '800', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                        Investimento Total da Opção (Incluindo Adicionais)
                                    </span>
                                    <span style={{ fontSize: '16px', fontWeight: '800', color: '#111827' }}>
                                        {parent.present_in_usd 
                                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format((((parent.unit_price || 0) / (parent.exchange_rate || 1)) * (parent.quantity || 1)) + calculateTotalRecursive(parent.id))
                                            : formatCurrency(((parent.unit_price || 0) * (parent.quantity || 1)) + calculateTotalRecursive(parent.id))
                                        }
                                    </span>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
