import React from 'react';
import { Page, View, Text, Image, Svg, Path, Circle, Polygon } from '@react-pdf/renderer';
import { PdfColors, getPageProps } from './pdfStyles';
import { LOGO_BASE64 } from './pdfAssetsBase64';

interface Differential {
    title: string;
    description: string;
    icon: string;
}

interface PdfDifferentialsPageProps {
    differentials: Differential[];
    pdfColors: PdfColors;
    pdfStyles: any;
    layout?: 'portrait' | 'landscape';
}

const getCardColors = (pdfColors: PdfColors) => [
    { bg: '#f0f9ff', border: pdfColors.primary, text: pdfColors.primary },
    { bg: '#fef2f2', border: pdfColors.accent, text: pdfColors.accent },
    { bg: '#f0fdf4', border: pdfColors.emerald, text: pdfColors.emerald },
];

const renderIcon = (iconText: string, color: string) => {
    if (iconText.includes('🎯')) {
        return (
            <Svg viewBox="0 0 24 24" width={32} height={32}>
                <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2" fill="none" />
                <Circle cx="12" cy="12" r="6" stroke={color} strokeWidth="2" fill="none" />
                <Circle cx="12" cy="12" r="2" fill={color} />
            </Svg>
        );
    }
    if (iconText.includes('🤝')) {
        return (
            <Svg viewBox="0 0 24 24" width={32} height={32}>
                <Path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke={color} strokeWidth="2" fill="none" />
                <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth="2" fill="none" />
                <Path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke={color} strokeWidth="2" fill="none" />
                <Path d="M16 3.13a4 4 0 0 1 0 7.75" stroke={color} strokeWidth="2" fill="none" />
            </Svg>
        );
    }
    if (iconText.includes('⭐')) {
        return (
            <Svg viewBox="0 0 24 24" width={32} height={32}>
                <Polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" stroke={color} strokeWidth="2" fill="none" />
            </Svg>
        );
    }
    return (
        <Svg viewBox="0 0 24 24" width={32} height={32}>
            <Path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" stroke={color} strokeWidth="2" fill="none" />
            <Path d="M22 4L12 14.01l-3-3" stroke={color} strokeWidth="2" fill="none" />
        </Svg>
    );
};

export function PdfDifferentialsPage({ differentials, pdfColors, pdfStyles, layout = 'portrait' }: PdfDifferentialsPageProps) {
    const cardColors = getCardColors(pdfColors);
    return (
        <Page {...getPageProps(layout)} style={pdfStyles.page} wrap>
            {/* Top gradient bar */}
            <View style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: 6, backgroundColor: pdfColors.accent }} />
            <View style={{ position: 'absolute', top: 0, left: '50%', width: '50%', height: 6, backgroundColor: pdfColors.primary }} />

            <View>
                {/* Header */}
                <View style={{ marginBottom: 35 }}>
                    <View style={pdfStyles.logoRow}>
                        <Image src={LOGO_BASE64} style={pdfStyles.logo} />
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                        <Text style={pdfStyles.sectionTitle}>
                            Diferenciais da
                        </Text>
                        <Text style={[pdfStyles.sectionTitle, pdfStyles.sectionTitleAccent, { flexWrap: 'nowrap' }]}>
                            Solução
                        </Text>
                    </View>
                    <View style={pdfStyles.titleUnderline} />
                    <Text style={{
                        fontSize: 12.5, color: pdfColors.textLight, fontWeight: 'bold',
                        textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>
                        Por que escolher a Infodive IT como parceira estratégica
                    </Text>
                </View>

                {/* Differentials Cards */}
                <View style={{ flexDirection: 'column', gap: 16 }}>
                    {differentials.map((diff, i) => {
                        const colorSet = cardColors[i % cardColors.length];
                        return (
                            <View key={i} style={{
                                flexDirection: 'row', gap: 20, padding: 24,
                                backgroundColor: colorSet.bg, borderRadius: 12,
                                borderWidth: 2, borderColor: colorSet.border,
                                alignItems: 'center',
                            }}>
                                {/* Icon */}
                                <View style={{ minWidth: 60, alignItems: 'center' }}>
                                    {renderIcon(diff.icon, colorSet.text)}
                                </View>

                                {/* Content */}
                                <View style={{ flex: 1 }}>
                                    <Text style={{
                                        fontSize: 18, fontWeight: 'bold', color: colorSet.text,
                                        marginBottom: 10,
                                    }}>
                                        {diff.title}
                                    </Text>
                                    <Text style={{ fontSize: 13, color: '#4b5563', lineHeight: 1.6 }}>
                                        {diff.description}
                                    </Text>
                                </View>
                            </View>
                        );
                    })}
                </View>

                {/* Bottom Banner */}
                <View style={{
                    marginTop: 25, padding: 24, backgroundColor: pdfColors.primary,
                    borderRadius: 12, alignItems: 'center',
                }}>
                    <Text style={{ fontSize: 16, color: pdfColors.white, fontWeight: 'bold', lineHeight: 1.6 }}>
                        <Text style={{ color: pdfColors.accent, fontWeight: 'bold' }}>Mais de 15 anos</Text>
                        {' '}transformando infraestruturas de TI em vantagens competitivas
                    </Text>
                </View>

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
