import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { PdfColors } from './pdfStyles';
import { LOGO_BASE64 } from './pdfAssetsBase64';
import { getClassificationLabel } from '@/utils/productClassification';
import type { BillingOverride } from '@/hooks/useProposalEditorState';

interface PdfInvestmentPageProps {
    products: any[];
    simplifiedProductNames?: Record<string, string>;
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
    simplifiedProductNames = {},
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
                                        {simplifiedProductNames[product.name] || product.display_name || product.name}
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
                                            {simplifiedProductNames[product.name] || product.display_name || product.name}
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

                        {/* ═══ Billing Info — Grouped by Billing Entity ═══ */}
                        {(() => {
                            const billingGroups: any[] = [];
                            
                            // 1. Reseller Group
                            const resellerProducts = mainProducts.filter(p => p.billing_type === 'direct' || !p.billing_type);
                            if (resellerProducts.length > 0) {
                                billingGroups.push({
                                    title: 'Faturamento Direto', // Label used for Infodive card header
                                    displayTitle: 'Infodive Representações e Serviços Ltda',
                                    products: resellerProducts,
                                    type: 'reseller',
                                    displayCnpj: resellerProducts.find(p => p.distributor_cnpj && p.distributor_cnpj.length > 5)?.distributor_cnpj || '05.613.186/0001-78'
                                });
                            }

                            // 2. Direct Groups by Distributor + CNPJ
                            const directProducts = mainProducts.filter(p => p.billing_type === 'indirect');
                            const directGroupKeys = Array.from(new Set(directProducts.map(p => `${p.distributor_id || 'no-dist'}|${p.distributor_cnpj || 'no-cnpj'}`)));

                            directGroupKeys.forEach(key => {
                                const [dId, dCnpj] = key.split('|');
                                const productsInGroup = directProducts.filter(p => 
                                    (p.distributor_id || 'no-dist') === dId && 
                                    (p.distributor_cnpj || 'no-cnpj') === dCnpj
                                );
                                
                                if (productsInGroup.length === 0) return;

                                const dist = dId !== 'no-dist' ? distributors.find(d => d.id === dId) : undefined;
                                const override = dist ? billingOverrides[dist.id] : undefined;

                                // 1. Prioritize Product-level override (from opportunity selection)
                                // 2. Fallback to Proposal-level override (from editor state)
                                // 3. Fallback to Distributor main CNPJ
                                const displayCnpj = (dCnpj !== 'no-cnpj' ? dCnpj : undefined) || override?.selectedCnpj || dist?.cnpj;

                                // Try to resolve branch name if a specific CNPJ is chosen
                                const branch = dist?.account_branches?.find((b: any) => b.cnpj === dCnpj);
                                const displayName = branch?.name || override?.selectedBranchName || dist?.name || 'Distribuidor';
                                
                                billingGroups.push({
                                    title: 'Faturamento Direto',
                                    displayTitle: displayName,
                                    products: productsInGroup,
                                    type: 'direct',
                                    displayCnpj: displayCnpj,
                                    displayTerms: override?.paymentTerms ?? branch?.payment_terms ?? dist?.payment_terms
                                });
                            });

                            return billingGroups.map((group, bIdx) => {
                                const isReseller = group.type === 'reseller';
                                return (
                                    <View key={bIdx} wrap={false} style={{
                                        padding: 16,
                                        backgroundColor: isReseller ? '#f8fafc' : '#ffffff',
                                        borderRadius: 10,
                                        borderWidth: 1,
                                        borderColor: isReseller ? '#e2e8f0' : '#fecdd3',
                                        borderLeftWidth: 4,
                                        borderLeftColor: isReseller ? '#64748b' : pdfColors.accent,
                                        marginBottom: bIdx < billingGroups.length - 1 ? 10 : 0,
                                    }}>
                                        <Text style={{
                                            fontSize: 8, fontWeight: 'bold', color: isReseller ? '#64748b' : pdfColors.accent,
                                            textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
                                        }}>
                                            {group.title}
                                        </Text>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: pdfColors.primary, marginBottom: isReseller ? 6 : 4 }}>
                                            {group.displayTitle}
                                        </Text>
                                        
                                        <View style={{ flexDirection: 'row', gap: 20, marginBottom: isReseller ? 0 : 8 }}>
                                            <View style={{ flexDirection: 'row' }}>
                                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: pdfColors.primary }}>CNPJ: </Text>
                                                <Text style={{ fontSize: 9, color: '#475569' }}>{formatCNPJ(group.displayCnpj)}</Text>
                                            </View>
                                            <View style={{ flexDirection: 'row' }}>
                                                <Text style={{ fontSize: 9, fontWeight: 'bold', color: pdfColors.primary }}>IE: </Text>
                                                <Text style={{ fontSize: 9, color: '#475569' }}>Isento</Text>
                                            </View>
                                        </View>

                                        {/* Products in this billing entity */}
                                        <View style={{ marginTop: isReseller ? 8 : 0, padding: 8, backgroundColor: '#f1f5f9', borderRadius: 6, marginBottom: isReseller ? 0 : 8 }}>
                                            <Text style={{ fontSize: 7, fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', letterSpacing: 0.4, marginBottom: 3 }}>
                                                Produtos neste faturamento:
                                            </Text>
                                            <Text style={{ fontSize: 9, color: pdfColors.primary, fontWeight: 'bold', lineHeight: 1.4 }}>
                                                {Array.from(group.products.reduce((acc: Map<string, string>, p: any) => {
                                                    const rawName = (simplifiedProductNames[p.name] || p.display_name || p.name || '').toString();
                                                    // Nuclear clean: remove ALL types of invisible spaces, normalize to single space, trim, and handle Case
                                                    const clean = rawName.replace(/[\s\u00A0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff\u200b]+/g, ' ').trim();
                                                    const key = clean.toLowerCase();
                                                    if (clean && !acc.has(key)) acc.set(key, clean);
                                                    return acc;
                                                }, new Map<string, string>()).values()).join(' • ')}
                                            </Text>
                                        </View>

                                        {/* Payment Terms (Direct Billing only) */}
                                        {!isReseller && group.displayTerms && (
                                            <View style={{
                                                padding: 12, backgroundColor: '#fff1f2',
                                                borderRadius: 8, borderWidth: 1, borderColor: '#fecdd3',
                                            }}>
                                                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                                    <View style={{ width: 4, height: 4, backgroundColor: pdfColors.accent, borderRadius: 2 }} />
                                                    <Text style={{ fontSize: 8, fontWeight: 'bold', color: pdfColors.accent, textTransform: 'uppercase' }}>
                                                        Condições e Prazos de Pagamento
                                                    </Text>
                                                </View>
                                                <View style={{ gap: 4 }}>
                                                    {group.displayTerms.split(';').map((part: string, pIdx: number) => {
                                                        if (!part.trim()) return null;
                                                        return (
                                                            <View key={pIdx} wrap={false} style={{ flexDirection: 'row', gap: 6, marginBottom: 4 }}>
                                                                <Text style={{ fontSize: 10, color: pdfColors.accent }}>•</Text>
                                                                <Text style={{ fontSize: 9, color: '#9f1239', fontWeight: 'bold', flex: 1, lineHeight: 1.4 }}>
                                                                    {part.trim()}
                                                                </Text>
                                                            </View>
                                                        );
                                                    })}
                                                </View>
                                            </View>
                                        )}
                                    </View>
                                );
                            });
                        })()}

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
