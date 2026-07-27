import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { PdfColors, getPageProps } from './pdfStyles';
import { LOGO_BASE64 } from './pdfAssetsBase64';
import { isHardware, isService, isSupport, getClassificationLabel } from '@/utils/productClassification';
import { getSmartProductDescription } from '@/utils/formatProductDescription';
import { ExportProduct } from '@/utils/proposalExportMapper';

interface PdfHardwarePageProps {
    products: ExportProduct[];
    pdfColors: PdfColors;
    pdfStyles: any;
    layout?: 'portrait' | 'landscape';
}

export function PdfHardwarePage({ products, pdfColors, pdfStyles, layout = 'portrait' }: PdfHardwarePageProps) {
    const hardwareProducts = products.filter(p =>
        p.categoryLabel === 'Hardware & Infraestrutura' || 
        p.categoryLabel === 'Suporte & Garantia' || 
        p.categoryLabel === 'Serviços'
    );
    const deduplicated = hardwareProducts.filter((p, i, self) =>
        i === self.findIndex(t => t.name === p.name)
    );

    if (deduplicated.length === 0) return null;

    // Categorize products for the specific lists
    const hw = deduplicated.filter(p => p.categoryLabel === 'Hardware & Infraestrutura');
    const support = deduplicated.filter(p => p.categoryLabel === 'Suporte & Garantia');
    const services = deduplicated.filter(p => p.categoryLabel === 'Serviços' || p.categoryLabel === 'Serviços Profissionais');

    // Extract highlighted specs for the summary grid
    const allHighlightedSpecs: Array<{ label: string; value: string }> = [];
    deduplicated.forEach(p => {
        if (p.techDetails && Array.isArray(p.techDetails)) {
            p.techDetails.forEach(item => {
                if (item.is_highlighted_on_grid && item.grid_label) {
                    if (!allHighlightedSpecs.some(s => s.label === item.grid_label)) {
                        allHighlightedSpecs.push({
                            label: item.grid_label || 'Info',
                            value: item.description
                        });
                    }
                }
            });
        }
    });

    const renderProductList = (items: ExportProduct[], title: string, color: string) => {
        if (items.length === 0) return null;

        const showSkuColumn = items.some(p => p.showSkuOnProposal !== false && !!p.sku);

        return (
            <View wrap={false} style={{ marginBottom: 20 }}>
                <View style={{
                    flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10,
                }}>
                    <View style={{ width: 4, height: 14, backgroundColor: color, borderRadius: 2 }} />
                    <Text style={{
                        fontSize: 14, fontWeight: 'bold', color: pdfColors.primary,
                        textTransform: 'uppercase',
                    }}>
                        {title}
                    </Text>
                </View>

                {/* Technical Summary Grid (The "GRID") specifically for Hardware */}
                {title === 'Hardware & Infraestrutura' && allHighlightedSpecs.length > 0 && (
                    <View wrap={false} style={{
                        flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12,
                        backgroundColor: '#f1f5f9', padding: 10, borderRadius: 10,
                        borderWidth: 1, borderColor: '#cbd5e1'
                    }}>
                        {allHighlightedSpecs.map((spec, i) => (
                            <View key={i} style={{
                                width: '31%', backgroundColor: pdfColors.white, padding: 8,
                                borderRadius: 6, borderWidth: 1, borderColor: '#cbd5e1',
                                alignItems: 'center', justifyContent: 'center'
                            }}>
                                <Text style={{ fontSize: 7.5, color: pdfColors.textLight, textTransform: 'uppercase', fontWeight: 'bold', marginBottom: 2 }}>
                                    {spec.label}
                                </Text>
                                <Text style={{ fontSize: 11, color: pdfColors.primary, fontWeight: 'black', textAlign: 'center' }}>
                                    {spec.value}
                                </Text>
                            </View>
                        ))}
                    </View>
                )}

                {/* Table Header */}
                <View style={{
                    flexDirection: 'row', paddingVertical: 6, paddingHorizontal: 16,
                    borderBottomWidth: 1, borderBottomColor: pdfColors.border,
                }}>
                    <View style={{ flex: 1, paddingRight: 10 }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: pdfColors.primary, textTransform: 'uppercase' }}>Descrição</Text>
                    </View>
                    {showSkuColumn && (
                        <View style={{ width: 80 }}>
                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: pdfColors.primary, textTransform: 'uppercase' }}>SKU</Text>
                        </View>
                    )}
                    <View style={{ width: 40, alignItems: 'center' }}>
                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: pdfColors.primary, textTransform: 'uppercase' }}>Qtd</Text>
                    </View>
                </View>

                {items.map((product, idx) => (
                    <View key={idx} wrap={false} style={{
                        flexDirection: 'row', alignItems: 'flex-start', paddingVertical: 8,
                        paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: pdfColors.border,
                        backgroundColor: idx % 2 === 0 ? pdfColors.white : pdfColors.bgLight,
                    }}>
                        {/* Name and Specs */}
                        <View style={{ flex: 1, paddingRight: 10 }}>
                            <Text style={{ fontSize: 11, fontWeight: 'semibold', color: pdfColors.text, marginBottom: 2 }}>
                                {product.displayName}
                            </Text>
                            {product.duration && product.durationUnit && (
                                <Text style={{ fontSize: 9, color: pdfColors.green, fontStyle: 'italic', fontWeight: 'bold', marginBottom: 2 }}>
                                    (Válido por {product.duration} {product.durationUnit})
                                </Text>
                            )}

                            {/* Render Product Specs */}
                            {(() => {
                                let rawSpecs: any[] = [];
                                if (product.techDetails && product.techDetails.length > 0) {
                                    rawSpecs = product.techDetails;
                                } else if (product.description) {
                                    rawSpecs = product.description.split('\n').filter(l => l.trim().length > 0).map((l, i) => ({ description: l, quantity: 1, is_visible_on_proposal: true, id: i }));
                                }

                                if (rawSpecs.length > 0) {
                                    const specsLines = getSmartProductDescription(rawSpecs, 1);

                                    if (specsLines.length > 0) {
                                         return (
                                            <View style={{ marginTop: 4, paddingLeft: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                {specsLines.map((spec, sIdx) => (
                                                    <View key={sIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                        <Text style={{ fontSize: 10, color: pdfColors.primary, marginRight: 3, marginTop: -0.5 }}>{spec.qty}x</Text>
                                                        <Text style={{ fontSize: 9.5, color: pdfColors.textLight, flex: 1, lineHeight: 1.2 }}>
                                                            {spec.description}
                                                        </Text>
                                                    </View>
                                                ))}
                                            </View>
                                        );
                                    }
                                }
                                return null;
                            })()}
                        </View>
                        {showSkuColumn && (
                            <View style={{ width: 80 }}>
                                <Text style={{ fontSize: 10, color: pdfColors.textLight }}>
                                    {product.showSkuOnProposal !== false ? (product.sku || '-') : ''}
                                </Text>
                            </View>
                        )}
                        {/* Qty */}
                        <View style={{ width: 40, alignItems: 'center' }}>
                            <Text style={{ fontSize: 11, fontWeight: 'bold', color: pdfColors.text }}>
                                {product.quantity || 1}
                            </Text>
                        </View>
                    </View>
                ))}
            </View>
        );
    };

    return (
        <Page {...getPageProps(layout)} style={pdfStyles.page} wrap>
            {/* Top gradient bar */}
            <View style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: 6, backgroundColor: pdfColors.accent }} />
            <View style={{ position: 'absolute', top: 0, left: '50%', width: '50%', height: 6, backgroundColor: pdfColors.primary }} />
            {/* Main Content */}
            <View>
                {/* Header */}
                <View style={{ marginBottom: 30 }}>
                    <View style={pdfStyles.logoRow}>
                        <Image src={LOGO_BASE64} style={pdfStyles.logo} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                        <Text style={pdfStyles.sectionTitle}>
                            Infraestrutura &
                        </Text>
                        <Text style={[pdfStyles.sectionTitle, pdfStyles.sectionTitleAccent, { flexWrap: 'nowrap' }]}>
                            Hardware
                        </Text>
                    </View>
                    <View style={pdfStyles.titleUnderline} />
                </View>


                {/* Product Lists */}
                {renderProductList(hw, 'Hardware & Infraestrutura', pdfColors.primary)}
                {renderProductList(support, 'Suporte & Garantia', pdfColors.accent)}
                {renderProductList(services, 'Serviços Profissionais', pdfColors.emerald)}

            </View>

            {/* Fixed Footer */}
            <View fixed style={{
                position: 'absolute', bottom: 20, left: 60, right: 60,
                paddingTop: 8,
                borderTopWidth: 1,
                borderTopColor: '#f1f5f9',
                alignItems: 'center',
            }}>
                <Text style={pdfStyles.footerText}>Infodive IT Solutions - Confidencial</Text>
            </View>
        </Page>
    );
}
