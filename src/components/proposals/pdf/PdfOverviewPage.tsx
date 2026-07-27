import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { PdfColors, getPageProps } from './pdfStyles';
import { LOGO_BASE64} from './pdfAssetsBase64';

interface PdfOverviewPageProps {
    dealTitle: string;
    aiSummary?: string;
    objectives?: any[];
    pdfColors: PdfColors;
    pdfStyles: any;
    layout?: 'portrait' | 'landscape';
}

export function PdfOverviewPage({ 
    dealTitle, 
    aiSummary, 
    objectives = [], 
    pdfColors, 
    pdfStyles,
    layout = 'portrait'
}: PdfOverviewPageProps) {
    return (
        <Page {...getPageProps(layout)} style={pdfStyles.page} wrap>
            {/* Top gradient bar */}
            <View style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: 6, backgroundColor: pdfColors.accent }} />
            <View style={{ position: 'absolute', top: 0, left: '50%', width: '50%', height: 6, backgroundColor: pdfColors.primary }} />

            {/* Main Content */}
            <View>
                {/* Header */}
                <View style={{ marginBottom: 20 }}>
                    <View style={pdfStyles.logoRow}>
                        <Image src={LOGO_BASE64} style={pdfStyles.logo} />
                    </View>

                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
                        <Text style={pdfStyles.sectionTitle}>
                            Visão Geral do
                        </Text>
                        <Text style={[pdfStyles.sectionTitle, pdfStyles.sectionTitleAccent, { flexWrap: 'nowrap' }]}>
                            Projeto
                        </Text>
                    </View>
                    <View style={pdfStyles.titleUnderline} />
                    <Text style={{
                        fontSize: 14, color: pdfColors.textLight, fontWeight: 'bold',
                        textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>
                        {dealTitle}
                    </Text>
                </View>

                {/* Content Area - Stacked */}
                <View style={{ gap: 12 }}>
                    {/* AI Summary Section */}
                    {aiSummary && (
                        <View style={{
                            backgroundColor: pdfColors.bgLight, padding: '12px 16px',
                            borderRadius: 12, borderWidth: 1, borderColor: pdfColors.border,
                        }}>
                            <Text style={{
                                color: pdfColors.primary, fontSize: 11.5, lineHeight: 1.45,
                                textAlign: 'justify',
                            }}>
                                {aiSummary}
                            </Text>
                        </View>
                    )}

                    {/* Objectives Grid */}
                    {objectives.length > 0 && (
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                            {objectives.map((obj, i) => (
                                <View key={i} style={{
                                    width: '48.5%', backgroundColor: '#ffffff',
                                    padding: 12, borderRadius: 10, borderWidth: 1,
                                    borderColor: pdfColors.border, minHeight: 80,
                                }}>
                                    {/* Number badge (Inlined for density) */}
                                    <View style={{
                                        width: 22, height: 22, backgroundColor: pdfColors.accent,
                                        borderRadius: 6, alignItems: 'center', justifyContent: 'center',
                                        marginBottom: 6,
                                    }}>
                                        <Text style={{ fontSize: 12, fontWeight: 'bold', color: pdfColors.white }}>
                                            {obj.number || `0${i+1}`}
                                        </Text>
                                    </View>

                                    <Text style={{
                                        fontSize: 13, fontWeight: 'bold', color: pdfColors.primary,
                                        marginBottom: 3, lineHeight: 1.2,
                                    }}>
                                        {obj.title}
                                    </Text>
                                    <Text style={{ fontSize: 10, color: '#64748b', lineHeight: 1.35 }}>
                                        {obj.description}
                                    </Text>
                                </View>
                            ))}
                        </View>
                    )}
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
