import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { PdfColors } from './pdfStyles';
import { LOGO_BASE64 } from './pdfAssetsBase64';
import { getClassificationLabel } from '@/utils/productClassification';
import type { BillingOverride } from '@/hooks/useProposalEditorState';

interface PdfInvestmentPageProps {
    products: any[];
    showBillingInfo: boolean;
    isPriceStudy: boolean;
    priceStudyValidity: string;
    formatCurrency: (value: number) => string;
    distributors?: any[];
    billingOverrides?: Record<string, BillingOverride>;
    pdfColors: PdfColors;
    pdfStyles: any;
}

export function PdfInvestmentPage({
    products,
    showBillingInfo,
    isPriceStudy,
    priceStudyValidity,
    formatCurrency,
    distributors = [],
    billingOverrides = {},
    pdfColors,
    pdfStyles,
}: PdfInvestmentPageProps) {
    // Separate main and optional products
    const mainProducts = products.filter(p => !p.is_optional);
    const optionalProducts = products.filter(p => p.is_optional && p.is_visible_on_proposal !== false);

    // Calculate total
    const totalMainValue = mainProducts.reduce(
        (acc, p) => acc + (p.unit_price || 0) * (p.quantity || 1), 0
    );

    const showSkuColumn = mainProducts.some(p => p.show_sku_on_proposal !== false && !!p.sku);

    const formatCNPJ = (cnpj: string) => {
        if (!cnpj) return '-';
        const cleaned = cnpj.replace(/\D/g, '');
        if (cleaned.length !== 14) return cnpj;
        return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    };

    return (
        <Page size="A4" style={pdfStyles.page} wrap>
            {/* ═══ Fixed Header (repeats on every page) ═══ */}
            <View fixed style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 6,
                flexDirection: 'row',
            }}>
                <View style={{ width: '50%', height: 6, backgroundColor: pdfColors.accent }} />
                <View style={{ width: '50%', height: 6, backgroundColor: pdfColors.primary }} />
            </View>
            {/* Main Content (Padding now handled by styles.page) */}
            <View>
                {/* Header */}
                <View style={{ marginBottom: 20 }} wrap={false}>
                    <View style={pdfStyles.logoRow}>
                        <Image src={LOGO_BASE64} style={pdfStyles.logo} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                        <Text style={pdfStyles.sectionTitle}>
                            Estrutura de
                        </Text>
                        <Text style={[pdfStyles.sectionTitle, pdfStyles.sectionTitleAccent, { flexWrap: 'nowrap' }]}>
                            Investimento
                        </Text>
                    </View>
                    <View style={pdfStyles.titleUnderline} />
                </View>

                {/* Main Products Table */}
                <View style={{
                    borderTopWidth: 3, borderTopColor: pdfColors.primary,
                    borderBottomWidth: 3, borderBottomColor: pdfColors.primary,
                    backgroundColor: pdfColors.white,
                }}>
                    {/* Table Header */}
                    <View style={{
                        flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12,
                        backgroundColor: pdfColors.bgLighter, borderBottomWidth: 1, borderBottomColor: pdfColors.border,
                    }}>
                        <View style={{ width: 100 }}>
                            <Text style={pdfStyles.tableHeaderText}>Categoria</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={pdfStyles.tableHeaderText}>Descrição</Text>
                        </View>
                        {showSkuColumn && (
                            <View style={{ width: 70 }}>
                                <Text style={pdfStyles.tableHeaderText}>SKU</Text>
                            </View>
                        )}
                        <View style={{ width: 35, alignItems: 'center' }}>
                            <Text style={pdfStyles.tableHeaderText}>Qtd</Text>
                        </View>
                        <View style={{ width: 70, alignItems: 'flex-end' }}>
                            <Text style={pdfStyles.tableHeaderText}>Unitário</Text>
                        </View>
                        <View style={{ width: 95, alignItems: 'flex-end' }}>
                            <Text style={pdfStyles.tableHeaderText}>Investimento</Text>
                        </View>
                    </View>

                    {/* Table Rows */}
                    {mainProducts.map((product, idx) => {
                        const productTotal = (product.unit_price || 0) * (product.quantity || 1);
                        let categoryLabel = product.category || getClassificationLabel(product);
                        if (product.subcategory && !categoryLabel.includes(product.subcategory)) {
                            categoryLabel += ` - ${product.subcategory}`;
                        }

                        return (
                            <View key={idx} wrap={false} style={{
                                flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12,
                                borderBottomWidth: 1, borderBottomColor: pdfColors.border,
                                alignItems: 'flex-start',
                                backgroundColor: idx % 2 === 0 ? pdfColors.white : '#fafbfc',
                            }}>
                                <View style={{ width: 100 }}>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: pdfColors.primary }}>
                                        {categoryLabel}
                                    </Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={{ fontSize: 10, fontWeight: 'semibold', color: pdfColors.text }}>
                                        {product.name}
                                    </Text>
                                    {product.duration && product.duration_unit && (
                                        <Text style={{ fontSize: 8, color: pdfColors.green, fontFamily: 'Helvetica-Oblique' }}>
                                            (Válido por {product.duration} {product.duration_unit})
                                        </Text>
                                    )}
                                </View>
                                {showSkuColumn && (
                                    <View style={{ width: 70 }}>
                                        <Text style={{ fontSize: 9, color: pdfColors.textLight }}>
                                            {product.show_sku_on_proposal !== false ? (product.sku || '-') : ''}
                                        </Text>
                                    </View>
                                )}
                                <View style={{ width: 35, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 10, fontWeight: 'bold', color: pdfColors.text }}>
                                        {product.quantity || 1}
                                    </Text>
                                </View>
                                <View style={{ width: 70, alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 10, fontWeight: 'semibold', color: pdfColors.textLight }}>
                                        {formatCurrency(product.unit_price || 0)}
                                    </Text>
                                </View>
                                <View style={{ width: 95, alignItems: 'flex-end' }}>
                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: pdfColors.black }}>
                                        {formatCurrency(productTotal)}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}

                    {mainProducts.length === 0 && (
                        <View style={{ padding: 24, alignItems: 'center' }}>
                            <Text style={{ color: pdfColors.textMuted }}>Consulte as opções alternativas abaixo.</Text>
                        </View>
                    )}
                </View>

                {/* Total — keep together */}
                <View wrap={false} style={{
                    flexDirection: 'row', marginTop: 16, paddingHorizontal: 12,
                    alignItems: 'baseline', justifyContent: 'flex-end',
                }}>
                    <Text style={{
                        fontSize: 13, fontWeight: 'bold', color: '#4b5563',
                        textTransform: 'uppercase', marginRight: 20, letterSpacing: 0.5,
                    }}>
                        Investimento Consolidado
                    </Text>
                    <Text style={{ fontSize: 22, fontWeight: 'bold', color: pdfColors.accent }}>
                        {formatCurrency(totalMainValue)}
                    </Text>
                </View>

                {/* Optional Products */}
                {optionalProducts.length > 0 && (
                    <View wrap={false} style={{ marginTop: 24 }}>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
                        }}>
                            <View style={{ width: 8, height: 8, backgroundColor: '#f59e0b', borderRadius: 4 }} />
                            <Text style={{
                                fontSize: 13, fontWeight: 'bold', color: pdfColors.amber,
                                textTransform: 'uppercase',
                            }}>
                                Opções Adicionais / Alternativas
                            </Text>
                        </View>
                        {optionalProducts.map((product, idx) => {
                            const productTotal = (product.unit_price || 0) * (product.quantity || 1);
                            return (
                                <View key={idx} wrap={false} style={{
                                    flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 16,
                                    borderBottomWidth: 1, borderBottomColor: pdfColors.yellowBorder,
                                    alignItems: 'flex-start', backgroundColor: '#fffbf0',
                                }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: pdfColors.primary }}>
                                            {product.name}
                                        </Text>
                                        <Text style={{ fontSize: 9, color: pdfColors.textLight }}>
                                            {product.category || 'Opcional'} - Qtd: {product.quantity || 1}
                                        </Text>
                                    </View>
                                    <View style={{ width: 120, alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: pdfColors.text }}>
                                            {formatCurrency(productTotal)}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Price Study Validity */}
                {isPriceStudy && (
                    <View wrap={false} style={{
                        marginTop: 20, padding: 16, backgroundColor: '#eff6ff',
                        borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe',
                        alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: pdfColors.primary }}>
                            Estudo de Preços válido até: {priceStudyValidity}
                        </Text>
                    </View>
                )}

                {/* ═══ Billing Info Section ═══ */}
                {showBillingInfo && !isPriceStudy && (
                    <View style={{ marginTop: 24 }}>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10,
                        }}>
                            <View style={{ width: 3, height: 12, backgroundColor: pdfColors.accent, borderRadius: 2 }} />
                            <Text style={{
                                fontSize: 9, fontWeight: 'bold', color: '#64748b',
                                textTransform: 'uppercase', letterSpacing: 0.8,
                            }}>
                                Informações de Faturamento
                            </Text>
                        </View>

                        {/* Infodive Billing Card — only if reseller products exist */}
                        {(() => {
                            const resellerProducts = mainProducts.filter(p => (p.billing_type === 'direct' || !p.billing_type) && !p.distributor_id);
                            if (resellerProducts.length === 0) return null;
                            return (
                                <View wrap={false} style={{
                                    padding: 16,
                                    backgroundColor: '#f8fafc',
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: '#e2e8f0',
                                    borderLeftWidth: 4,
                                    borderLeftColor: '#64748b',
                                    marginBottom: distributors.length > 0 ? 10 : 0,
                                }}>
                                    <Text style={{
                                        fontSize: 8, fontWeight: 'bold', color: '#64748b',
                                        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
                                    }}>
                                        Faturamento Direto
                                    </Text>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: pdfColors.primary, marginBottom: 6 }}>
                                        Infodive Representações e Serviços Ltda
                                    </Text>
                                    <View style={{ flexDirection: 'row', gap: 20 }}>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: pdfColors.primary }}>CNPJ: </Text>
                                            <Text style={{ fontSize: 9, color: '#475569' }}>05.613.186/0001-78</Text>
                                        </View>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: pdfColors.primary }}>IE: </Text>
                                            <Text style={{ fontSize: 9, color: '#475569' }}>Isento</Text>
                                        </View>
                                    </View>
                                    <View style={{ marginTop: 8, padding: 8, backgroundColor: '#f1f5f9', borderRadius: 6 }}>
                                        <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>
                                            Produtos neste faturamento:
                                        </Text>
                                        <Text style={{ fontSize: 9, color: pdfColors.primary, fontWeight: 'bold', lineHeight: 1.4 }}>
                                            {resellerProducts.map(p => p.name).join(' • ')}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })()}

                        {/* Distributor Billing Cards */}
                        {distributors.map((dist, dIdx) => {
                            const distProducts = mainProducts.filter(p => p.distributor_id === dist.id);
                            if (distProducts.length === 0) return null;
                            const override = billingOverrides[dist.id];
                            const displayCnpj = override?.selectedCnpj || dist.cnpj;
                            const displayName = override?.selectedBranchName || dist.name;
                            const displayTerms = override?.paymentTerms ?? dist.payment_terms;
                            return (
                                <View key={dIdx} wrap={false} style={{
                                    padding: 16,
                                    backgroundColor: '#ffffff',
                                    borderRadius: 10,
                                    borderWidth: 1,
                                    borderColor: '#fecdd3',
                                    borderLeftWidth: 4,
                                    borderLeftColor: pdfColors.accent,
                                    marginBottom: dIdx < distributors.length - 1 ? 10 : 0,
                                }}>
                                    {/* Header Info - Keep together */}
                                    <View wrap={false}>
                                        <Text style={{
                                            fontSize: 8, fontWeight: 'bold', color: pdfColors.accent,
                                            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
                                        }}>
                                            Faturamento Direto
                                        </Text>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: pdfColors.primary, marginBottom: 4 }}>
                                            {displayName}
                                        </Text>
                                        <View style={{ flexDirection: 'row', gap: 20, marginBottom: 8 }}>
                                            <View style={{ flexDirection: 'row' }}>
                                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: pdfColors.primary }}>CNPJ: </Text>
                                                <Text style={{ fontSize: 9, color: '#475569' }}>{formatCNPJ(displayCnpj)}</Text>
                                            </View>
                                        </View>
                                    </View>

                                    {/* Products - Keep together */}
                                    <View wrap={false} style={{ padding: 8, backgroundColor: '#f1f5f9', borderRadius: 6, marginBottom: 8 }}>
                                        <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>
                                            Produtos neste faturamento:
                                        </Text>
                                        <Text style={{ fontSize: 9, color: pdfColors.primary, fontWeight: 'bold', lineHeight: 1.4 }}>
                                            {distProducts.map(p => p.name).join(' • ')}
                                        </Text>
                                    </View>

                                    {/* Payment Terms Container (Allows wrapping) */}
                                    {displayTerms && (
                                        <View style={{
                                            padding: 12, backgroundColor: '#fff1f2',
                                            borderRadius: 8, borderWidth: 1, borderColor: '#fecdd3',
                                        }}>
                                            {/* Header of Payment Terms - Keep together */}
                                            <View wrap={false}>
                                                <Text style={{
                                                    fontSize: 8, fontWeight: 'bold', color: pdfColors.accent,
                                                    textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 6,
                                                }}>
                                                    Condições e Prazos de Pagamento:
                                                </Text>
                                            </View>
                                            
                                            {/* Individual bullet points - Keep EACH bullet point together, but allow splitting BETWEEN them */}
                                            {displayTerms.split(';').filter((t: string) => t.trim()).map((term: string, tIdx: number) => (
                                                <View key={tIdx} wrap={false} style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                                                    <Text style={{ fontSize: 10, color: pdfColors.accent }}>•</Text>
                                                    <Text style={{ fontSize: 9, color: '#9f1239', fontWeight: 'bold', flex: 1, lineHeight: 1.4 }}>
                                                        {term.trim()}
                                                    </Text>
                                                </View>
                                            ))}
                                        </View>
                                    )}
                                </View>
                            );
                        })}
                    </View>
                )}
            </View>

            {/* Fixed Footer — repeats on every page */}
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
