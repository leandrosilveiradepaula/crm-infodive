import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { PdfColors } from './pdfStyles';
import { LOGO_BASE64 } from './pdfAssetsBase64';
import { isSoftware } from '@/utils/productClassification';
import { getSmartProductDescription } from '@/utils/formatProductDescription';

interface PdfSoftwarePageProps {
    products: any[];
    simplifiedProductNames?: Record<string, string>;
    softwareHighlights?: Array<{ title: string; value: string }>;
    benefitTiles?: Array<{ value: string; label: string }>;
    pdfColors: PdfColors;
    pdfStyles: any;
}

export function PdfSoftwarePage({ products, simplifiedProductNames = {}, softwareHighlights, benefitTiles, pdfColors, pdfStyles }: PdfSoftwarePageProps) {
    const rawSoftware = products.filter(p => isSoftware(p) && p.is_visible_on_proposal !== false);
    const softwareProducts = rawSoftware.filter((p, i, self) =>
        i === self.findIndex(t => t.name === p.name)
    );

    if (softwareProducts.length === 0) return null;

    const mainSoftware = softwareProducts.reduce((prev, cur) =>
        (cur.unit_price || 0) > (prev.unit_price || 0) ? cur : prev
    );

    const tiles = benefitTiles && benefitTiles.length > 0 ? benefitTiles : [
        { value: '99.99%', label: 'Disponibilidade Garantida' },
        { value: '50%', label: 'Redução de Custos' },
        { value: 'Zero', label: 'Tempo de Inatividade' },
    ];

    const tileColors = [
        { bg: '#f0f9ff', border: '#bfdbfe', text: pdfColors.primary },
        { bg: '#fef2f2', border: '#fecaca', text: pdfColors.accent },
        { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
    ];

    const highlights = softwareHighlights && softwareHighlights.length > 0
        ? softwareHighlights
        : [
            { title: 'Infraestrutura Hiperconvergente (HCI)', value: 'Consolidação de recursos de computação, armazenamento e rede em uma única plataforma, simplificando a gestão e reduzindo custos operacionais.' },
            { title: 'Automação Inteligente', value: 'Automatização de tarefas de provisionamento, configuração e gerenciamento de recursos, liberando a equipe de TI para atividades estratégicas.' },
        ];

    // Extract tech specs from main product description
    let techSpecs: Array<{ description: string; qty: number }> = [];
    const sourceDetails = mainSoftware?.description || mainSoftware?.tech_details;
    if (sourceDetails) {
        try {
            const parsed = typeof sourceDetails === 'string' ? JSON.parse(sourceDetails) : sourceDetails;
            if (Array.isArray(parsed) && parsed.length > 0) {
                techSpecs = getSmartProductDescription(parsed, 1);
            }
        } catch {
            // Not valid JSON, skip
        }
    }

    return (
        <Page size="A4" style={pdfStyles.page} wrap>
            {/* Top gradient bar */}
            <View style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: 6, backgroundColor: pdfColors.accent }} />
            <View style={{ position: 'absolute', top: 0, left: '50%', width: '50%', height: 6, backgroundColor: pdfColors.primary }} />
            {/* Main Content */}
            <View>
                {/* Header */}
                <View style={{ marginBottom: 24 }}>
                    <View style={pdfStyles.logoRow}>
                        <Image src={LOGO_BASE64} style={pdfStyles.logo} />
                    </View>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                        <Text style={pdfStyles.sectionTitle}>
                            Software &
                        </Text>
                        <Text style={[pdfStyles.sectionTitle, pdfStyles.sectionTitleAccent, { flexWrap: 'nowrap' }]}>
                            Licenciamento
                        </Text>
                    </View>
                    <View style={pdfStyles.titleUnderline} />
                </View>

                {/* ══ Main Software Card ══ */}
                <View wrap={false} style={{
                    backgroundColor: pdfColors.primary,
                    padding: 28,
                    borderRadius: 12,
                    marginBottom: 24,
                }}>
                    {/* Product Name */}
                    <Text style={{
                        fontSize: 18,
                        fontWeight: 'bold',
                        color: '#ffffff',
                        marginBottom: 16,
                    }}>
                        {simplifiedProductNames[mainSoftware.name] || mainSoftware.display_name || mainSoftware.name}
                    </Text>

                    {/* Two-column highlights */}
                    <View style={{ flexDirection: 'row', gap: 20 }}>
                        {highlights.map((h, i) => (
                            <View key={i} style={{ flex: 1 }}>
                                <Text style={{
                                    fontSize: 12,
                                    fontWeight: 'bold',
                                    color: pdfColors.accent,
                                    marginBottom: 8,
                                }}>
                                    {h.title}:
                                </Text>
                                <Text style={{
                                    fontSize: 11,
                                    color: '#e5e7eb',
                                    lineHeight: 1.6,
                                }}>
                                    {h.value}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Especificações Técnicas */}
                    {techSpecs.length > 0 && (
                        <View style={{
                            marginTop: 18,
                            padding: 14,
                            backgroundColor: 'rgba(255, 255, 255, 0.05)',
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                        }}>
                            <View style={{
                                flexDirection: 'row',
                                alignItems: 'center',
                                gap: 8,
                                marginBottom: 12,
                            }}>
                                <View style={{
                                    width: 4,
                                    height: 12,
                                    backgroundColor: pdfColors.accent,
                                    borderRadius: 2,
                                }} />
                                <Text style={{
                                    fontSize: 10,
                                    fontWeight: 'bold',
                                    color: '#ffffff',
                                    textTransform: 'uppercase',
                                    letterSpacing: 1,
                                }}>
                                    Especificações Técnicas:
                                </Text>
                            </View>
                            {techSpecs.map((spec, idx) => (
                                <View key={idx} style={{
                                    flexDirection: 'row',
                                    alignItems: 'flex-start',
                                    marginBottom: 8,
                                    paddingLeft: 4,
                                }}>
                                    <View style={{
                                        width: 6,
                                        height: 6,
                                        borderRadius: 3,
                                        backgroundColor: pdfColors.accent,
                                        marginTop: 4,
                                        marginRight: 10,
                                    }} />
                                    {spec.qty > 1 && (
                                        <Text style={{
                                            fontSize: 11,
                                            color: pdfColors.accent,
                                            fontWeight: 'bold',
                                            marginRight: 6,
                                        }}>
                                            {spec.qty}x
                                        </Text>
                                    )}
                                    <Text style={{
                                        fontSize: 11,
                                        color: '#f3f4f6',
                                        flex: 1,
                                        lineHeight: 1.4,
                                    }}>
                                        {spec.description}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
                </View>

                {/* ══ Benefit Tiles ══ */}
                <View wrap={false} style={{ flexDirection: 'row', gap: 16, marginBottom: 24 }}>
                    {tiles.map((tile, idx) => {
                        const tc = tileColors[idx % tileColors.length];
                        const isItalic = tile.value.toLowerCase() === 'zero' || tile.value.toLowerCase() === 'ilimitado';
                        return (
                            <View key={idx} style={{
                                flex: 1,
                                paddingVertical: 20,
                                paddingHorizontal: 12,
                                backgroundColor: tc.bg,
                                borderRadius: 12,
                                alignItems: 'center',
                                borderWidth: 1,
                                borderColor: tc.border,
                            }}>
                                <Text style={{
                                    fontSize: 32,
                                    fontFamily: isItalic ? 'Helvetica-BoldOblique' : 'Helvetica-Bold',
                                    color: tc.text,
                                    marginBottom: 10,
                                }}>
                                    {tile.value}
                                </Text>
                                <Text style={{
                                    fontSize: 9,
                                    color: '#4b5563',
                                    fontWeight: 'bold',
                                    textTransform: 'uppercase',
                                    textAlign: 'center',
                                    letterSpacing: 0.3,
                                }}>
                                    {tile.label}
                                </Text>
                            </View>
                        );
                    })}
                </View>

                {/* ══ Additional Software Items ══ */}
                {softwareProducts.length > 1 && (
                    <View wrap={false}>
                        <View style={{
                            flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12,
                        }}>
                            <View style={{ width: 4, height: 14, backgroundColor: '#16a34a', borderRadius: 2 }} />
                            <Text style={{ fontSize: 13, fontWeight: 'bold', color: pdfColors.primary, textTransform: 'uppercase' }}>
                                Itens de Licenciamento Adicional
                            </Text>
                        </View>
                        {softwareProducts.map((p, idx) => (
                            <View key={idx} wrap={false} style={{
                                flexDirection: 'row', paddingVertical: 8, paddingHorizontal: 12,
                                borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
                                alignItems: 'flex-start',
                            }}>
                                <View style={{ flex: 1, paddingRight: 10 }}>
                                    <Text style={{ fontSize: 11, fontWeight: 'bold', color: '#374151', marginBottom: 2 }}>{simplifiedProductNames[p.name] || p.display_name || p.name}</Text>

                                    {/* Render Product Specs */}
                                    {(() => {
                                        let rawSpecs: any[] = [];
                                        const sd = p.description || p.tech_details;
                                        if (sd) {
                                            try {
                                                const parsed = typeof sd === 'string' ? JSON.parse(sd) : sd;
                                                if (Array.isArray(parsed) && parsed.length > 0) rawSpecs = parsed;
                                            } catch {
                                                rawSpecs = (String(sd)).split('\n').filter((l: string) => l.trim().length > 0).map((l: string, i: number) => ({ description: l, quantity: 1, is_visible_on_proposal: true, id: i }));
                                            }
                                        }

                                        if (rawSpecs.length > 0) {
                                            const specsLines = getSmartProductDescription(rawSpecs, 1).filter(s =>
                                                !s.description.toLowerCase().includes('capacidade bruta') &&
                                                !s.description.toLowerCase().includes('capacidade útil') &&
                                                !s.description.toLowerCase().includes('efetiva')
                                            );

                                            if (specsLines.length > 0) {
                                                return (
                                                    <View style={{ marginTop: 4, paddingLeft: 4, display: 'flex', flexDirection: 'column', gap: 2 }}>
                                                        {specsLines.map((spec, sIdx) => (
                                                            <View key={sIdx} style={{ flexDirection: 'row', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                                                                <Text style={{ fontSize: 9, color: '#1e3a5f', marginRight: 3, marginTop: -0.5 }}>{spec.qty}x</Text>
                                                                <Text style={{ fontSize: 8.5, color: '#64748b', flex: 1, lineHeight: 1.2 }}>
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
                                <View style={{ width: 40, alignItems: 'center' }}>
                                    <Text style={{ fontSize: 10, color: '#64748b' }}>x{p.quantity || 1}</Text>
                                </View>
                            </View>
                        ))}
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
