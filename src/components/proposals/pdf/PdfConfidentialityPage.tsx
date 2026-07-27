import React from 'react';
import { Page, View, Text, Image } from '@react-pdf/renderer';
import { PdfColors, getPageProps } from './pdfStyles';
import { LOGO_BASE64, DATACENTER_BASE64, HANDSHAKE_BASE64 } from './pdfAssetsBase64';

interface PdfConfidentialityPageProps {
    confidentialityText?: string;
    pdfColors: PdfColors;
    pdfStyles: any;
    layout?: 'portrait' | 'landscape';
}

export function PdfConfidentialityPage({ confidentialityText, pdfColors, pdfStyles, layout = 'portrait' }: PdfConfidentialityPageProps) {
    const text = confidentialityText || 'O conteúdo deste documento destina-se exclusivamente à avaliação interna da organização destinatária. As informações aqui contidas são proprietárias e não devem ser compartilhadas com terceiros sem autorização prévia. Qualquer alteração nas premissas técnicas ou comerciais descritas implicará na necessidade de uma revisão formal das condições propostas.';

    return (
        <Page {...getPageProps(layout)} style={[pdfStyles.page, { paddingTop: 0, paddingBottom: 0, paddingLeft: 0, paddingRight: 0 }]}>
            {/* Gradient bar */}
            <View style={{ position: 'absolute', top: 0, left: 0, width: '50%', height: 6, backgroundColor: pdfColors.accent }} />
            <View style={{ position: 'absolute', top: 0, left: '50%', width: '50%', height: 6, backgroundColor: pdfColors.primary }} />

            <View style={{ flexDirection: 'row', flex: 1 }}>
                {/* Left Content (~60%) */}
                <View style={{ width: '60%', padding: '60px 40px', flexDirection: 'column' }}>
                    <View style={pdfStyles.logoRow}>
                        <Image src={LOGO_BASE64} style={pdfStyles.logo} />
                    </View>

                    {/* Title */}
                    <View style={{ marginBottom: 40 }}>
                        <Text style={pdfStyles.sectionTitle}>
                            Termos de
                        </Text>
                        <Text style={[pdfStyles.sectionTitle, pdfStyles.sectionTitleAccent, { fontSize: 24, marginTop: -4 }]}>
                            Confidencialidade
                        </Text>
                        <View style={pdfStyles.titleUnderline} />
                    </View>

                    {/* Content Text */}
                    <Text style={{
                        fontSize: 14, color: pdfColors.text, lineHeight: 1.8,
                        marginBottom: 40, textAlign: 'justify',
                    }}>
                        {text}
                    </Text>

                    {/* Quote */}
                    <View style={{ paddingLeft: 20, borderLeftWidth: 3, borderLeftColor: pdfColors.accent }}>
                        <Text style={{
                            fontSize: 16, color: pdfColors.accent, fontStyle: 'italic', lineHeight: 1.6,
                        }}>
                            &quot;A integridade das informações e a proteção da estratégia de TI são pilares fundamentais desta parceria comercial.&quot;
                        </Text>
                    </View>
                </View>

                {/* Right Side - Image (50%) */}
                <View style={{
                    width: '50%', backgroundColor: pdfColors.primary,
                    alignItems: 'center', justifyContent: 'center', padding: 80,
                }}>
                    <Image
                        src={HANDSHAKE_BASE64}
                        style={{ width: '100%', height: 'auto' }}
                    />
                </View>
            </View>
        </Page>
    );
}
