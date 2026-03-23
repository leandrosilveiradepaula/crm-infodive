import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { PdfColors } from './pdfStyles';
import { LOGO_BASE64} from './pdfAssetsBase64';

interface PdfOverviewPageProps {
    dealTitle: string;
    aiSummary?: string;
    pdfColors: PdfColors;
    pdfStyles: any;
}

const defaultObjectives = [
    { number: '01', title: 'Modernização de Infraestrutura', description: 'Atualização do parque tecnológico com soluções de última geração, garantindo performance e escalabilidade.' },
    { number: '02', title: 'Segurança & Compliance', description: 'Implementação de políticas de segurança robustas e conformidade com regulamentações do setor.' },
    { number: '03', title: 'Otimização de Custos', description: 'Redução do TCO através de consolidação, virtualização e licenciamento estratégico.' },
    { number: '04', title: 'Continuidade de Nºegócios', description: 'Garantia de alta disponibilidade e planos de disaster recovery para operações críticas.' },
];

export function PdfOverviewPage({ dealTitle, aiSummary, pdfColors, pdfStyles }: PdfOverviewPageProps) {
    return (
        <Page size="A4" style={pdfStyles.page} wrap>
            {/* Top gradient bar */}
            <View style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: 6, backgroundColor: pdfColors.accent }} />
            <View style={{ position: 'absolute', top: 0, left: '50%', width: '50%', height: 6, backgroundColor: pdfColors.primary }} />

            {/* Main Content */}
            <View>
                {/* Header */}
                <View style={{ marginBottom: 25 }}>
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

                {/* AI Summary or Objectives */}
                {aiSummary ? (
                    <View style={{
                        backgroundColor: pdfColors.bgLight, padding: '25px 30px',
                        borderRadius: 16, borderWidth: 1, borderColor: pdfColors.border,
                        marginBottom: 20,
                    }}>
                        <Text style={{
                            color: pdfColors.primary, fontSize: 15, lineHeight: 1.6,
                            textAlign: 'justify',
                        }}>
                            {aiSummary}
                        </Text>
                    </View>
                ) : (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 15, marginTop: 10 }}>
                        {defaultObjectives.map((obj, i) => (
                            <View key={i} style={{
                                width: '47%', backgroundColor: pdfColors.bgLight,
                                padding: 15, borderRadius: 12, borderWidth: 2,
                                borderColor: pdfColors.border, position: 'relative',
                            }}>
                                {/* Number badge */}
                                <View style={{
                                    position: 'absolute', top: -12, left: 20,
                                    width: 40, height: 40, backgroundColor: pdfColors.accent,
                                    borderRadius: 20, alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <Text style={{ fontSize: 16, fontWeight: 'bold', color: pdfColors.white }}>
                                        {obj.number}
                                    </Text>
                                </View>

                                <View style={{ marginTop: 20 }}>
                                    <Text style={{
                                        fontSize: 15, fontWeight: 'bold', color: pdfColors.primary,
                                        marginBottom: 8, lineHeight: 1.2,
                                    }}>
                                        {obj.title}
                                    </Text>
                                    <Text style={{ fontSize: 11, color: '#4b5563', lineHeight: 1.4 }}>
                                        {obj.description}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}

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
