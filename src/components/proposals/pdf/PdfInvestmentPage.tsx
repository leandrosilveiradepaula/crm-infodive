import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { PdfColors, getPageProps } from './pdfStyles';
import { LOGO_BASE64 } from './pdfAssetsBase64';
import { UnifiedExportData, ExportProduct } from '@/utils/proposalExportMapper';

interface PdfInvestmentPageProps {
    exportData: UnifiedExportData;
    formatCurrency: (value: number) => string;
    pdfColors: PdfColors;
    pdfStyles: any;
    layout?: 'portrait' | 'landscape';
}

export function PdfInvestmentPage({
    exportData,
    formatCurrency,
    pdfColors,
    pdfStyles,
    layout = 'portrait',
}: PdfInvestmentPageProps) {
    const formatCNPJ = (cnpj: string) => {
        if (!cnpj) return '-';
        const cleaned = cnpj.replace(/\D/g, '');
        if (cleaned.length !== 14) return cnpj;
        return cleaned.replace(/^(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})$/, '$1.$2.$3/$4-$5');
    };

    return (
        <Page {...getPageProps(layout)} style={pdfStyles.page} wrap>
            {/* ═══ Fixed Header (repeats on every page) ═══ */}
            <View fixed style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 6,
                flexDirection: 'row',
            }}>
                <View style={{ width: '50%', height: 6, backgroundColor: pdfColors.accent }} />
                <View style={{ width: '50%', height: 6, backgroundColor: pdfColors.primary }} />
            </View>
            {/* Main Content */}
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
                
                {/* ── Investment Tables (Options or Consolidated) ── */}
                {exportData.optionBlocks.map((block, qIdx) => {
                    const isOptionsMode = exportData.optionBlocks.length > 1 || exportData.quoteDisplayMode === 'options';
                    const optionLabel = block.label.replace('Opção ', ''); // Handle Single Quote Option names

                    const hasMonthly = block.products.some(p => p.pricingModel === 'monthly');

                    return (
                        <View key={block.id || qIdx} style={{ marginBottom: isOptionsMode ? 20 : 0 }}>
                            {isOptionsMode && (
                                <View wrap={false} style={{
                                    flexDirection: 'row', alignItems: 'center', gap: 8,
                                    marginBottom: 10, paddingHorizontal: 12
                                }}>
                                    <View style={{
                                        borderWidth: 1, borderColor: pdfColors.accent,
                                        borderRadius: 4, paddingVertical: 2, paddingHorizontal: 6
                                    }}>
                                        <Text style={{ fontSize: 9, fontWeight: 'bold', color: pdfColors.accent }}>
                                            OPÇÃO {optionLabel}
                                        </Text>
                                    </View>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: pdfColors.primary }}>
                                        {block.displayName}
                                    </Text>
                                </View>
                            )}

                            <View style={{
                                borderTopWidth: 1, borderTopColor: pdfColors.border,
                                borderBottomWidth: 1, borderBottomColor: pdfColors.primary,
                                backgroundColor: pdfColors.white,
                            }}>
                                {/* Table Header */}
                                <View style={{
                                    flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12,
                                    backgroundColor: '#fafafa', borderBottomWidth: 1, borderBottomColor: pdfColors.border,
                                    alignItems: 'center'
                                }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={pdfStyles.tableHeaderText}>Item / Descrição</Text>
                                    </View>
                                    <View style={{ width: 30, alignItems: 'center' }}>
                                        <Text style={pdfStyles.tableHeaderText}>Qtd</Text>
                                    </View>
                                    <View style={{ width: 85, alignItems: 'flex-end' }}>
                                        <Text style={pdfStyles.tableHeaderText}>Unitário</Text>
                                    </View>
                                    <View style={{ width: 85, alignItems: 'flex-end' }}>
                                        <Text style={pdfStyles.tableHeaderText}>{hasMonthly ? 'Mensal' : 'Total'}</Text>
                                    </View>
                                    {hasMonthly && (
                                        <View style={{ width: 85, alignItems: 'flex-end' }}>
                                            <Text style={pdfStyles.tableHeaderText}>Anual</Text>
                                        </View>
                                    )}
                                </View>

                                {/* Table Rows Grouped by Category */}
                                {(() => {
                                    let lastCategory = '';
                                    return block.products.map((product: ExportProduct, idx: number) => {
                                        const categoryLabel = product.categoryLabel;
                                        const showCategoryHeader = categoryLabel !== lastCategory;
                                        if (showCategoryHeader) lastCategory = categoryLabel;

                                        const isUSD = product.isPresentInUSD;
                                        const isMonthly = product.pricingModel === 'monthly';
                                        
                                        // Product costs already calculated correctly by the mapper
                                        const unitPrice = isUSD ? product.unitPriceUSD : product.unitPrice;
                                        const productTotal = isUSD ? product.totalPriceUSD : product.totalPrice;
                                        const annualTotal = isMonthly ? productTotal * 12 : productTotal;

                                        const formatValue = (val: number) => isUSD
                                            ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
                                            : formatCurrency(val);

                                        return (
                                            <React.Fragment key={`prod-${idx}`}>
                                                {showCategoryHeader && (
                                                    <View wrap={false} style={{
                                                        flexDirection: 'row', paddingVertical: 5, paddingHorizontal: 12,
                                                        backgroundColor: '#f8fafc', borderBottomWidth: 1, borderBottomColor: pdfColors.border
                                                    }}>
                                                        <Text style={{ fontSize: 7, fontWeight: 'bold', color: pdfColors.primary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                                            {categoryLabel}
                                                        </Text>
                                                    </View>
                                                )}
                                                <View wrap={false} style={{
                                                    flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12,
                                                    borderBottomWidth: 1, borderBottomColor: '#f3f4f6',
                                                    alignItems: 'flex-start',
                                                    backgroundColor: idx % 2 === 0 ? pdfColors.white : '#fafafa',
                                                }}>
                                                    <View style={{ flex: 1, paddingRight: 10 }}>
                                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: pdfColors.primary }}>
                                                            {product.displayName}
                                                        </Text>
                                                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 3, gap: 4 }}>
                                                            {product.sku && (
                                                                <Text style={{ fontSize: 7, color: pdfColors.accent, fontWeight: 'bold' }}>
                                                                    [SKU: {product.sku}]
                                                                </Text>
                                                            )}
                                                            {(() => {
                                                                const desc = product.description;
                                                                if (desc) {
                                                                    return (
                                                                        <Text style={{ fontSize: 8, color: pdfColors.textLight, lineHeight: 1.2 }}>
                                                                            {desc}
                                                                        </Text>
                                                                    );
                                                                }
                                                                return null;
                                                            })()}
                                                        </View>
                                                    </View>
                                                    <View style={{ width: 30, alignItems: 'center', paddingTop: 1 }}>
                                                        <Text style={{ fontSize: 10, color: pdfColors.text }}>
                                                            {product.quantity}
                                                        </Text>
                                                    </View>
                                                    <View style={{ width: 85, alignItems: 'flex-end', paddingTop: 1 }}>
                                                        <Text style={{ fontSize: 9, color: pdfColors.textLight }}>
                                                            {formatValue(unitPrice)}
                                                        </Text>
                                                    </View>
                                                    <View style={{ width: 85, alignItems: 'flex-end', paddingTop: 1 }}>
                                                        <Text style={{ fontSize: 10, fontWeight: 'bold', color: pdfColors.primary }}>
                                                            {formatValue(productTotal)}
                                                        </Text>
                                                    </View>
                                                    {hasMonthly && (
                                                        <View style={{ width: 85, alignItems: 'flex-end', paddingTop: 1 }}>
                                                            <Text style={{ fontSize: 10, fontWeight: 'bold', color: isMonthly ? pdfColors.green : pdfColors.primary }}>
                                                                {formatValue(annualTotal)}
                                                            </Text>
                                                        </View>
                                                    )}
                                                </View>
                                            </React.Fragment>
                                        );
                                    });
                                })()}

                                {block.products.length === 0 && (
                                    <View style={{ padding: 24, alignItems: 'center' }}>
                                        <Text style={{ color: pdfColors.textMuted }}>Consulte as opções alternativas abaixo.</Text>
                                    </View>
                                )}
                            </View>

                            {/* Total for Option or Consolidated */}
                            <View wrap={false} style={{
                                flexDirection: 'column', marginTop: 12, paddingHorizontal: 12,
                                alignItems: 'flex-end', justifyContent: 'flex-end', gap: 6
                            }}>
                                {block.totalBRL > 0 && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{
                                            fontSize: 10, fontWeight: 'bold', color: '#666',
                                            textTransform: 'uppercase', marginRight: 15, letterSpacing: 0.5,
                                        }}>
                                            {isOptionsMode ? `Total Opção ${optionLabel}` : 'Investimento Consolidado'} (1º Ano) {block.totalUSD > 0 ? '(BRL)' : ''}
                                        </Text>
                                        <Text style={{ fontSize: 18, fontWeight: 'black', color: pdfColors.primary }}>
                                            {formatCurrency(block.totalBRL)}
                                        </Text>
                                    </View>
                                )}
                                {block.totalUSD > 0 && (
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                        <Text style={{
                                            fontSize: 10, fontWeight: 'bold', color: '#666',
                                            textTransform: 'uppercase', marginRight: 15, letterSpacing: 0.5,
                                        }}>
                                            {isOptionsMode ? `Total Opção ${optionLabel}` : 'Investimento Consolidado'} (1º Ano) (USD)
                                        </Text>
                                        <Text style={{ fontSize: 18, fontWeight: 'black', color: pdfColors.primary }}>
                                            {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(block.totalUSD)}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        </View>
                    );
                })}

                {/* Optional Products */}
                {exportData.optionalProducts.length > 0 && (
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
                        {exportData.optionalProducts.map((product, idx) => {
                            const isUSD = product.isPresentInUSD;
                            const productTotal = isUSD ? product.totalPriceUSD : product.totalPrice;
                            
                            const formatValue = (val: number) => isUSD 
                                ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(val)
                                : formatCurrency(val);
                                
                            return (
                                <View key={idx} wrap={false} style={{
                                    flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 16,
                                    borderBottomWidth: 1, borderBottomColor: pdfColors.yellowBorder,
                                    alignItems: 'flex-start', backgroundColor: '#fffbf0',
                                }}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: pdfColors.primary }}>
                                            {product.displayName}
                                        </Text>
                                        <Text style={{ fontSize: 9, color: pdfColors.textLight }}>
                                            {product.categoryLabel || 'Opcional'} - Qtd: {product.quantity}
                                        </Text>
                                    </View>
                                    <View style={{ width: 120, alignItems: 'flex-end' }}>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: pdfColors.text }}>
                                            {formatValue(productTotal)}
                                        </Text>
                                    </View>
                                </View>
                            );
                        })}
                    </View>
                )}

                {/* Price Study Validity */}
                {exportData.isPriceStudy && (
                    <View wrap={false} style={{
                        marginTop: 20, padding: 16, backgroundColor: '#eff6ff',
                        borderRadius: 12, borderWidth: 1, borderColor: '#bfdbfe',
                        alignItems: 'center',
                    }}>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: pdfColors.primary }}>
                            Estudo de Preços válido até: {exportData.priceStudyValidity}
                        </Text>
                    </View>
                )}

                {/* ═══ Billing Info Section ═══ */}
                {exportData.showBillingInfo && !exportData.isPriceStudy && (
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
                        {exportData.billingGroups.map((group, bIdx) => {
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
                                    marginBottom: bIdx < exportData.billingGroups.length - 1 ? 10 : 0,
                                }}>
                                    <Text style={{
                                        fontSize: 8, fontWeight: 'bold', color: isReseller ? '#64748b' : pdfColors.accent,
                                        textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6,
                                    }}>
                                        {group.title}
                                    </Text>
                                    <Text style={{ fontSize: 12, fontWeight: 'bold', color: pdfColors.primary, marginBottom: isReseller ? 6 : 4 }}>
                                        {group.companyName}
                                    </Text>
                                    
                                    <View style={{ flexDirection: 'row', gap: 20, marginBottom: isReseller ? 0 : 8 }}>
                                        <View style={{ flexDirection: 'row' }}>
                                            <Text style={{ fontSize: 9, fontWeight: 'bold', color: pdfColors.primary }}>CNPJ: </Text>
                                            <Text style={{ fontSize: 9, color: '#475569' }}>{formatCNPJ(group.cnpj)}</Text>
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
                                                const rawName = (p.displayName || p.name || '').toString();
                                                const clean = rawName.replace(/[\s\u00A0\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff\u200b]+/g, ' ').trim();
                                                const key = clean.toLowerCase();
                                                if (clean && !acc.has(key)) acc.set(key, clean);
                                                return acc;
                                            }, new Map<string, string>()).values()).join(' • ')}
                                        </Text>
                                    </View>

                                    {/* Payment Terms (Direct Billing only) */}
                                    {!isReseller && group.paymentTerms && (
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
                                                {group.paymentTerms.split(';').map((part: string, pIdx: number) => {
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

